"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { sendOrderShippedEmail } from "@/lib/shop/notify";
import type { FulfillmentStatus } from "@/config/shop";

/* ============================================================
   El panel de la tienda: variantes, despacho y tarifas de envío.

   Todo pasa por `requireRole`, así que solo Valeria (mentora) y el admin
   entran. Se usa el service client porque estas escrituras tocan pedidos de
   otras personas, que es justo lo que RLS impide a un cliente de sesión.
   ============================================================ */

export type AdminState = { ok?: boolean; error?: string } | undefined;

/* ── Variantes ── */

export async function saveVariantAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireRole("mentor", "super_admin");
  const svc = createServiceClient();

  const id = String(formData.get("id") ?? "").trim() || null;
  const productId = String(formData.get("product_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const priceRaw = String(formData.get("price_cop") ?? "").trim();
  const trackStock = formData.get("track_stock") === "on";
  const stock = Math.max(0, Math.round(Number(formData.get("stock")) || 0));

  if (!productId) return { error: "Falta el producto." };
  if (!title) return { error: "Ponle un nombre a la presentación." };

  // Vacío = hereda el precio del producto.
  const price = priceRaw ? Math.round(Number(priceRaw)) : null;
  if (price !== null && (!Number.isFinite(price) || price < 1000)) {
    return { error: "El precio mínimo es $1.000 COP (o déjalo vacío)." };
  }

  const payload = {
    product_id: productId,
    title: title.slice(0, 80),
    price_cop: price,
    track_stock: trackStock,
    stock: trackStock ? stock : 0,
    sku: String(formData.get("sku") ?? "").trim() || null,
    sort: Math.round(Number(formData.get("sort")) || 0),
  };

  const { error } = id
    ? await svc.from("store_variants").update(payload).eq("id", id)
    : await svc.from("store_variants").insert(payload);

  if (error) return { error: `No se pudo guardar: ${error.message}` };

  revalidatePath("/tienda-admin");
  revalidatePath("/tienda");
  return { ok: true };
}

export async function deleteVariantAction(id: string): Promise<AdminState> {
  await requireRole("mentor", "super_admin");
  const svc = createServiceClient();
  const { error } = await svc.from("store_variants").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar." };
  revalidatePath("/tienda-admin");
  revalidatePath("/tienda");
  return { ok: true };
}

/* ── Despacho ── */

/** Cambia el estado logístico. Al marcar "enviado" se guarda la guía y le
 *  llega el correo a la compradora — que es el momento en que más se escribe
 *  a preguntar "¿ya salió?". */
export async function updateFulfillmentAction(
  orderId: string,
  status: FulfillmentStatus,
  tracking?: { carrier?: string; number?: string },
): Promise<AdminState> {
  await requireRole("mentor", "super_admin");
  const svc = createServiceClient();

  const patch: Record<string, unknown> = { fulfillment_status: status };
  if (tracking?.carrier !== undefined) patch.carrier = tracking.carrier.trim() || null;
  if (tracking?.number !== undefined) patch.tracking_number = tracking.number.trim() || null;
  if (status === "shipped") patch.shipped_at = new Date().toISOString();
  if (status === "delivered") patch.delivered_at = new Date().toISOString();

  const { error } = await svc.from("store_orders").update(patch).eq("id", orderId);
  if (error) return { error: `No se pudo actualizar: ${error.message}` };

  if (status === "shipped") {
    try {
      await sendOrderShippedEmail(orderId);
    } catch (e) {
      // El pedido YA quedó marcado como enviado: que falle el correo no debe
      // deshacer eso ni mostrarle un error a Valeria.
      console.error("[shop-admin] correo de envío", e);
    }
  }

  revalidatePath("/tienda-admin");
  return { ok: true };
}

/* ── Tarifas de envío ── */

export async function saveShippingRateAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireRole("mentor", "super_admin");
  const svc = createServiceClient();

  const id = String(formData.get("id") ?? "").trim() || null;
  const name = String(formData.get("name") ?? "").trim();
  const price = Math.max(0, Math.round(Number(formData.get("price_cop")) || 0));
  const freeOverRaw = String(formData.get("free_over_cop") ?? "").trim();
  const states = formData.getAll("states").map(String).filter(Boolean);

  if (!name) return { error: "Ponle un nombre a la zona." };

  const payload = {
    name: name.slice(0, 80),
    states,
    price_cop: price,
    free_over_cop: freeOverRaw ? Math.round(Number(freeOverRaw)) : null,
    sort: Math.round(Number(formData.get("sort")) || 0),
    active: formData.get("active") !== "off",
  };

  const { error } = id
    ? await svc.from("store_shipping_rates").update(payload).eq("id", id)
    : await svc.from("store_shipping_rates").insert(payload);

  if (error) return { error: `No se pudo guardar: ${error.message}` };
  revalidatePath("/tienda-admin");
  revalidatePath("/carrito");
  return { ok: true };
}

export async function deleteShippingRateAction(id: string): Promise<AdminState> {
  await requireRole("mentor", "super_admin");
  const svc = createServiceClient();
  const { error } = await svc.from("store_shipping_rates").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar." };
  revalidatePath("/tienda-admin");
  return { ok: true };
}

/* ── Categorías ── */

export async function saveCategoryAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireRole("mentor", "super_admin");
  const svc = createServiceClient();

  const id = String(formData.get("id") ?? "").trim() || null;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Ponle un nombre." };

  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);

  const payload = {
    name: name.slice(0, 60),
    description: String(formData.get("description") ?? "").trim() || null,
    sort: Math.round(Number(formData.get("sort")) || 0),
  };

  const { error } = id
    ? await svc.from("store_categories").update(payload).eq("id", id)
    : await svc.from("store_categories").insert({ ...payload, slug });

  if (error) return { error: `No se pudo guardar: ${error.message}` };
  revalidatePath("/tienda-admin");
  revalidatePath("/tienda");
  return { ok: true };
}
