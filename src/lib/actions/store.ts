"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireRole, requireStudentArea } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  boldApiKey,
  boldIntegritySignature,
  newOrderReference,
  getBoldPaymentStatus,
} from "@/lib/bold";
import { markOrderPaidAndFulfill, type FulfillableOrder } from "@/lib/store/fulfill";

/* ============================================================
   Acciones de la Tienda.
   · Admin (mentora): CRUD de productos + imagen.
   · Comprador: iniciar checkout → crea la orden pendiente y devuelve los
     parámetros del botón de Bold (la firma se calcula en el servidor).
   ============================================================ */

const BUCKET = "productos";
const IMG_MAX = 6_291_456; // 6 MB
const IMG_TYPES = ["image/jpeg", "image/png", "image/webp"];
const KINDS = ["program", "session", "pack", "membership"] as const;

export type StoreState = { ok?: boolean; error?: string; slug?: string } | undefined;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function ensureBucket(svc: ReturnType<typeof createServiceClient>) {
  const { data } = await svc.storage.getBucket(BUCKET);
  if (!data)
    await svc.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: IMG_MAX,
      allowedMimeTypes: IMG_TYPES,
    });
}

/* ── Admin: crear / actualizar producto ── */
export async function saveProductAction(
  _prev: StoreState,
  formData: FormData,
): Promise<StoreState> {
  const profile = await requireRole("mentor", "super_admin");
  const id = String(formData.get("id") ?? "").trim() || null;
  const title = String(formData.get("title") ?? "").trim();
  const kind = String(formData.get("kind") ?? "program");
  const subtitle = String(formData.get("subtitle") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const priceCop = Math.round(Number(formData.get("price_cop")));
  const programId = String(formData.get("program_id") ?? "").trim() || null;
  const membershipDays = Number(formData.get("membership_days")) || null;
  const benefitsRaw = String(formData.get("benefits") ?? "").trim();
  const benefits = benefitsRaw
    ? benefitsRaw.split("\n").map((b) => b.trim()).filter(Boolean)
    : [];
  const file = formData.get("image");

  if (!title) return { error: "Ponle un título." };
  if (!KINDS.includes(kind as (typeof KINDS)[number])) return { error: "Tipo no válido." };
  if (!Number.isFinite(priceCop) || priceCop < 1000)
    return { error: "El precio mínimo es $1.000 COP." };
  if (kind === "program" && !programId)
    return { error: "Elige el programa al que inscribe." };
  if (kind === "membership" && (!membershipDays || membershipDays < 1))
    return { error: "Indica los días de acceso de la membresía." };

  // Imagen (opcional).
  let imageUrl: string | undefined;
  if (file instanceof File && file.size > 0) {
    if (!IMG_TYPES.includes(file.type)) return { error: "Imagen: usa JPG, PNG o WebP." };
    if (file.size > IMG_MAX) return { error: "La imagen supera los 6 MB." };
    const svc = createServiceClient();
    await ensureBucket(svc);
    const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
    const path = `${Math.random().toString(36).slice(2, 10)}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await svc.storage.from(BUCKET).upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });
    if (upErr) return { error: `No se pudo subir la imagen: ${upErr.message}` };
    imageUrl = svc.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  const supabase = await createClient();
  const payload: Record<string, unknown> = {
    kind,
    title: title.slice(0, 160),
    subtitle,
    description,
    price_cop: priceCop,
    program_id: kind === "program" ? programId : null,
    membership_days: kind === "membership" ? membershipDays : null,
    benefits,
  };
  if (imageUrl) payload.image_url = imageUrl;

  if (id) {
    const { error } = await supabase.from("store_products").update(payload).eq("id", id);
    if (error) return { error: "No se pudo guardar." };
  } else {
    payload.slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`;
    payload.created_by = profile.id;
    const { error } = await supabase.from("store_products").insert(payload);
    if (error) return { error: "No se pudo crear el producto." };
  }

  revalidatePath("/tienda-admin");
  revalidatePath("/tienda");
  return { ok: true };
}

export async function toggleProductAction(id: string, active: boolean): Promise<StoreState> {
  await requireRole("mentor", "super_admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("store_products")
    .update({ status: active ? "active" : "hidden" })
    .eq("id", id);
  if (error) return { error: "No se pudo actualizar." };
  revalidatePath("/tienda-admin");
  revalidatePath("/tienda");
  return { ok: true };
}

export async function deleteProductAction(id: string): Promise<StoreState> {
  await requireRole("mentor", "super_admin");
  const supabase = await createClient();
  const { error } = await supabase.from("store_products").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar." };
  revalidatePath("/tienda-admin");
  revalidatePath("/tienda");
  return { ok: true };
}

/* ── Comprador: iniciar checkout con Bold ── */

export interface CheckoutParams {
  ok: boolean;
  error?: string;
  apiKey?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  signature?: string;
  description?: string;
  redirectionUrl?: string;
}

async function siteOrigin(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "oceom.33vertebras.com";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

/** Crea la orden pendiente y devuelve los parámetros del botón de Bold. */
export async function startCheckoutAction(productId: string): Promise<CheckoutParams> {
  const profile = await requireStudentArea();
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("store_products")
    .select("id, title, kind, price_cop, program_id, membership_days, slug, status")
    .eq("id", productId)
    .maybeSingle();
  if (!product || product.status !== "active") return { ok: false, error: "Producto no disponible." };

  const apiKey = boldApiKey();
  if (!apiKey) return { ok: false, error: "La pasarela de pago no está configurada aún." };

  const amount = product.price_cop as number;
  const currency = "COP";
  const reference = newOrderReference(product.slug as string);

  const { error } = await supabase.from("store_orders").insert({
    buyer_id: profile.id,
    product_id: product.id,
    product_title: product.title,
    product_kind: product.kind,
    program_id: product.program_id,
    membership_days: product.membership_days,
    amount_cop: amount,
    currency,
    reference,
    status: "pending",
  });
  if (error) return { ok: false, error: "No se pudo crear la orden." };

  const origin = await siteOrigin();
  return {
    ok: true,
    apiKey,
    orderId: reference,
    amount,
    currency,
    signature: boldIntegritySignature(reference, amount, currency),
    description: String(product.title).slice(0, 100),
    redirectionUrl: `${origin}/tienda/resultado`,
  };
}

/** Verificación ACTIVA del pago: consulta el estado en Bold y, si está
 *  aprobado, marca la orden pagada y la cumple (red de seguridad frente a
 *  webhooks que fallan o a PSE que tarda en confirmar). */
export async function verifyOrderPaymentAction(
  reference: string,
): Promise<{ status: "paid" | "pending" | "rejected" | "not_found" }> {
  const profile = await requireStudentArea();
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("store_orders")
    .select(
      "id, buyer_id, product_kind, program_id, membership_days, amount_cop, reference, status, fulfilled",
    )
    .eq("reference", reference)
    .eq("buyer_id", profile.id)
    .maybeSingle();
  if (!order) return { status: "not_found" };
  if (order.status === "paid") return { status: "paid" };

  const bold = await getBoldPaymentStatus(reference);
  if (bold?.status === "APPROVED") {
    await markOrderPaidAndFulfill(order as FulfillableOrder, bold.transactionId ?? null);
    return { status: "paid" };
  }
  if (bold && ["REJECTED", "FAILED", "VOIDED"].includes(bold.status)) {
    await supabase.from("store_orders").update({ status: "rejected" }).eq("id", order.id);
    return { status: "rejected" };
  }
  return { status: "pending" };
}
