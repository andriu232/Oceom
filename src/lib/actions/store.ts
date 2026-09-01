"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

/* ============================================================
   Acciones de la Tienda.
   · Admin (mentora): CRUD de productos + imagen.
   · Comprador: iniciar checkout → crea la orden pendiente y devuelve los
     parámetros del botón de Bold (la firma se calcula en el servidor).
   ============================================================ */

const BUCKET = "productos";
/** Los infoproductos NO viven en un bucket público: se sirven firmados desde
 *  /api/descargas/<token>. */
const DIGITAL_BUCKET = "infoproductos";
const IMG_MAX = 6_291_456; // 6 MB
const DIGITAL_MAX = 209_715_200; // 200 MB
const IMG_TYPES = ["image/jpeg", "image/png", "image/webp"];
const KINDS = ["program", "session", "pack", "membership", "product"] as const;

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

/** Bucket PRIVADO de los archivos que se venden. Si fuera público, la URL de
 *  un ebook circularía por WhatsApp y no habría nada que vender. */
async function ensureDigitalBucket(svc: ReturnType<typeof createServiceClient>) {
  const { data } = await svc.storage.getBucket(DIGITAL_BUCKET);
  if (!data)
    await svc.storage.createBucket(DIGITAL_BUCKET, {
      public: false,
      fileSizeLimit: DIGITAL_MAX,
    });
}

/** Sube una imagen al bucket público y devuelve su URL. */
async function uploadImage(
  svc: ReturnType<typeof createServiceClient>,
  file: File,
): Promise<{ url?: string; error?: string }> {
  if (!IMG_TYPES.includes(file.type)) return { error: "Imagen: usa JPG, PNG o WebP." };
  if (file.size > IMG_MAX) return { error: "La imagen supera los 6 MB." };
  await ensureBucket(svc);
  const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const path = `${Math.random().toString(36).slice(2, 10)}-${Date.now()}.${ext}`;
  const { error } = await svc.storage
    .from(BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      upsert: false,
    });
  if (error) return { error: `No se pudo subir la imagen: ${error.message}` };
  return { url: svc.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
}

/* ── Admin: crear / actualizar producto ── */
export async function saveProductAction(
  _prev: StoreState,
  formData: FormData,
): Promise<StoreState> {
  const profile = await requireRole("mentor", "super_admin");
  const svc = createServiceClient();

  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const num = (k: string) => {
    const n = Number(formData.get(k));
    return Number.isFinite(n) ? n : null;
  };
  const bool = (k: string) => formData.get(k) === "on" || formData.get(k) === "true";

  const id = str("id") || null;
  const title = str("title");
  const kind = str("kind") || "product";
  const priceCop = Math.round(num("price_cop") ?? NaN);
  const programId = str("program_id") || null;
  const membershipDays = num("membership_days");

  if (!title) return { error: "Ponle un título." };
  if (!KINDS.includes(kind as (typeof KINDS)[number])) return { error: "Tipo no válido." };
  if (!Number.isFinite(priceCop) || priceCop < 1000)
    return { error: "El precio mínimo es $1.000 COP." };
  if (kind === "program" && !programId)
    return { error: "Elige el programa al que inscribe." };
  if (kind === "membership" && (!membershipDays || membershipDays < 1))
    return { error: "Indica los días de acceso de la membresía." };

  const compareAt = num("compare_at_price_cop");
  if (compareAt && compareAt <= priceCop)
    return { error: "El precio tachado debe ser mayor que el precio de venta." };

  // ── Imagen principal ──
  let imageUrl: string | undefined;
  const main = formData.get("image");
  if (main instanceof File && main.size > 0) {
    const up = await uploadImage(svc, main);
    if (up.error) return { error: up.error };
    imageUrl = up.url;
  }

  // ── Galería (varias imágenes) ──
  const galleryFiles = formData
    .getAll("gallery")
    .filter((f): f is File => f instanceof File && f.size > 0);
  const galleryUrls: string[] = [];
  for (const file of galleryFiles) {
    const up = await uploadImage(svc, file);
    if (up.error) return { error: up.error };
    if (up.url) galleryUrls.push(up.url);
  }

  // ── Archivo descargable (infoproducto) ──
  let digitalPath: string | undefined;
  let digitalName: string | undefined;
  const digital = formData.get("digital");
  if (digital instanceof File && digital.size > 0) {
    if (digital.size > DIGITAL_MAX) return { error: "El archivo supera los 200 MB." };
    await ensureDigitalBucket(svc);
    const safe = digital.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80);
    const path = `${Math.random().toString(36).slice(2, 10)}-${Date.now()}-${safe}`;
    const { error } = await svc.storage
      .from(DIGITAL_BUCKET)
      .upload(path, Buffer.from(await digital.arrayBuffer()), {
        contentType: digital.type || "application/octet-stream",
        upsert: false,
      });
    if (error) return { error: `No se pudo subir el archivo: ${error.message}` };
    digitalPath = path;
    digitalName = digital.name;
  }

  const benefitsRaw = str("benefits");
  const benefits = benefitsRaw
    ? benefitsRaw.split("\n").map((b) => b.trim()).filter(Boolean)
    : [];
  const intentions = formData.getAll("intentions").map(String).filter(Boolean);

  // Un infoproducto o una sesión nunca viajan por transportadora.
  const requiresShipping = kind === "product" || kind === "pack" ? bool("requires_shipping") : false;
  const trackStock = requiresShipping && bool("track_stock");

  const payload: Record<string, unknown> = {
    kind,
    title: title.slice(0, 160),
    subtitle: str("subtitle") || null,
    short_description: str("short_description") || null,
    description: str("description") || null,
    price_cop: priceCop,
    compare_at_price_cop: compareAt || null,
    program_id: kind === "program" ? programId : null,
    membership_days: kind === "membership" ? membershipDays : null,
    benefits,
    intentions,
    category_id: str("category_id") || null,
    requires_shipping: requiresShipping,
    track_stock: trackStock,
    stock: trackStock ? Math.max(0, Math.round(num("stock") ?? 0)) : 0,
    weight_g: num("weight_g") || null,
    featured: bool("featured"),
    is_public: !bool("hide_from_shop"),
    legal_note: str("legal_note") || null,
  };
  if (imageUrl) payload.image_url = imageUrl;
  if (digitalPath) {
    payload.digital_path = digitalPath;
    payload.digital_name = digitalName;
  }

  const supabase = await createClient();

  if (id) {
    // La galería se acumula: subir una foto nueva no borra las anteriores.
    if (galleryUrls.length > 0) {
      const { data: actual } = await supabase
        .from("store_products")
        .select("gallery")
        .eq("id", id)
        .maybeSingle();
      const previa = Array.isArray(actual?.gallery) ? (actual!.gallery as string[]) : [];
      payload.gallery = [...previa, ...galleryUrls].slice(0, 8);
    }
    const { error } = await supabase.from("store_products").update(payload).eq("id", id);
    if (error) return { error: `No se pudo guardar: ${error.message}` };
  } else {
    if (galleryUrls.length > 0) payload.gallery = galleryUrls.slice(0, 8);
    payload.slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`;
    payload.created_by = profile.id;
    const { error } = await supabase.from("store_products").insert(payload);
    if (error) return { error: `No se pudo crear el producto: ${error.message}` };
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
