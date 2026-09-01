"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { boldApiKey, boldIntegritySignature, newOrderReference } from "@/lib/bold";
import {
  readCartCookie,
  writeCartCookie,
  resolveCart,
  lineKey,
  type CartLine,
} from "@/lib/shop/cart";
import { listShippingRates, quoteShipping } from "@/lib/shop/queries";
import { MAX_QTY, MIN_ORDER_COP, DEPARTAMENTOS } from "@/config/shop";

/* ============================================================
   Acciones de la tienda: carrito y checkout.

   Regla que ordena todo el archivo: el cliente manda intenciones (qué
   producto, cuántos, a dónde), nunca importes. Precio, envío y total se
   calculan aquí con datos de la base, y la firma de Bold se hace sobre ESE
   total. Un carrito manipulado no puede cambiar lo que se cobra.
   ============================================================ */

export type CartResult = { ok: boolean; error?: string; count?: number };

/* ── Carrito ── */

export async function addToCartAction(
  productId: string,
  variantId: string | null,
  qty = 1,
): Promise<CartResult> {
  const svc = createServiceClient();
  const { data: product } = await svc
    .from("store_products")
    .select("id, status, is_public, track_stock, stock")
    .eq("id", productId)
    .maybeSingle();

  if (!product || product.status !== "active" || !product.is_public) {
    return { ok: false, error: "Este producto ya no está disponible." };
  }

  let stockLimit: number | null = product.track_stock ? product.stock : null;

  if (variantId) {
    const { data: variant } = await svc
      .from("store_variants")
      .select("id, product_id, status, track_stock, stock")
      .eq("id", variantId)
      .maybeSingle();
    if (!variant || variant.product_id !== productId || variant.status !== "active") {
      return { ok: false, error: "Esa presentación ya no está disponible." };
    }
    stockLimit = variant.track_stock ? variant.stock : null;
  }

  if (stockLimit !== null && stockLimit <= 0) {
    return { ok: false, error: "Agotado por ahora." };
  }

  const lines = await readCartCookie();
  const key = lineKey(productId, variantId);
  const existing = lines.find((l) => lineKey(l.p, l.v) === key);
  const wanted = (existing?.q ?? 0) + Math.max(1, Math.floor(qty));
  const capped = Math.min(wanted, MAX_QTY, stockLimit ?? MAX_QTY);

  if (existing) existing.q = capped;
  else lines.push({ p: productId, v: variantId, q: capped });

  await writeCartCookie(lines);
  revalidatePath("/tienda");
  revalidatePath("/carrito");

  const count = lines.reduce((s, l) => s + l.q, 0);
  if (capped < wanted) {
    return { ok: true, count, error: `Solo quedan ${capped} disponibles.` };
  }
  return { ok: true, count };
}

export async function setLineQtyAction(
  productId: string,
  variantId: string | null,
  qty: number,
): Promise<CartResult> {
  const lines = await readCartCookie();
  const key = lineKey(productId, variantId);
  const next: CartLine[] =
    qty < 1
      ? lines.filter((l) => lineKey(l.p, l.v) !== key)
      : lines.map((l) =>
          lineKey(l.p, l.v) === key ? { ...l, q: Math.min(Math.floor(qty), MAX_QTY) } : l,
        );
  await writeCartCookie(next);
  revalidatePath("/carrito");
  return { ok: true, count: next.reduce((s, l) => s + l.q, 0) };
}

export async function removeLineAction(
  productId: string,
  variantId: string | null,
): Promise<CartResult> {
  return setLineQtyAction(productId, variantId, 0);
}

export async function clearCartAction(): Promise<CartResult> {
  await writeCartCookie([]);
  revalidatePath("/carrito");
  return { ok: true, count: 0 };
}

/** Cotización en vivo del envío mientras se llena el checkout. */
export async function quoteShippingAction(
  state: string,
): Promise<{ cost: number; free: boolean; rateName: string | null; missingForFree: number | null }> {
  const cart = await resolveCart(await readCartCookie());
  if (!cart.requiresShipping) {
    return { cost: 0, free: true, rateName: null, missingForFree: null };
  }
  const rates = await listShippingRates();
  return quoteShipping(rates, state, cart.subtotal);
}

/* ── Checkout ── */

export interface CheckoutInput {
  name: string;
  email: string;
  phone: string;
  doc?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  notes?: string;
}

export interface CheckoutResult {
  ok: boolean;
  error?: string;
  /** Parámetros firmados del botón de Bold. */
  apiKey?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  signature?: string;
  description?: string;
  redirectionUrl?: string;
  /** Enlace privado del pedido (funciona sin cuenta). */
  claimUrl?: string;
}

async function siteOrigin(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "oceom.33vertebras.com";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Crea el pedido pendiente con todas sus líneas y devuelve el botón de Bold.
 *
 *  No descuenta inventario todavía: el stock se toma cuando el pago se
 *  confirma. Reservarlo aquí dejaría productos bloqueados por cada checkout
 *  abandonado, que son la mayoría. */
export async function startShopCheckoutAction(input: CheckoutInput): Promise<CheckoutResult> {
  const cart = await resolveCart(await readCartCookie());
  if (cart.lines.length === 0) return { ok: false, error: "Tu carrito está vacío." };
  if (cart.changed) {
    return {
      ok: false,
      error: "Algo cambió en tu carrito (precio o disponibilidad). Revísalo y vuelve a intentar.",
    };
  }

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();

  if (name.length < 3) return { ok: false, error: "Escribe tu nombre completo." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Revisa tu correo." };
  if (phone.replace(/\D/g, "").length < 7) return { ok: false, error: "Escribe un teléfono válido." };

  // Envío: solo si algo en el carrito viaja.
  let shippingCost = 0;
  const needsShipping = cart.requiresShipping;
  if (needsShipping) {
    const address = (input.address ?? "").trim();
    const city = (input.city ?? "").trim();
    const state = (input.state ?? "").trim();
    if (address.length < 6) return { ok: false, error: "Escribe la dirección de entrega." };
    if (!city) return { ok: false, error: "Escribe la ciudad." };
    if (!DEPARTAMENTOS.includes(state as (typeof DEPARTAMENTOS)[number])) {
      return { ok: false, error: "Elige el departamento." };
    }
    const rates = await listShippingRates();
    shippingCost = quoteShipping(rates, state, cart.subtotal).cost;
  }

  const total = cart.subtotal + shippingCost;
  if (total < MIN_ORDER_COP) {
    return { ok: false, error: "El pedido mínimo es de $1.000 COP." };
  }

  const apiKey = boldApiKey();
  if (!apiKey) return { ok: false, error: "La pasarela de pago no está configurada aún." };

  // ¿Quién compra? Con sesión, es ella. Sin sesión, se intenta casar por
  // correo con una cuenta existente para que la compra aparezca en su
  // portal; si no existe, la orden queda a nombre del correo y la cuenta se
  // crea al confirmarse el pago (solo si compró algo que la necesita).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const svc = createServiceClient();
  let buyerId: string | null = user?.id ?? null;
  if (!buyerId) {
    const { data: profile } = await svc
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    buyerId = profile?.id ?? null;
  }

  const first = cart.lines[0];
  const reference = newOrderReference(first.slug);

  const { data: order, error: orderError } = await svc
    .from("store_orders")
    .insert({
      buyer_id: buyerId,
      email,
      buyer_name: name,
      phone,
      // Snapshot heredado (el webhook y las vistas viejas lo siguen leyendo).
      product_id: first.productId,
      product_title:
        cart.lines.length === 1
          ? first.title
          : `${first.title} y ${cart.lines.length - 1} más`,
      product_kind: first.kind,
      program_id: null,
      membership_days: null,
      subtotal_cop: cart.subtotal,
      shipping_cop: shippingCost,
      amount_cop: total,
      item_count: cart.lines.length,
      currency: "COP",
      reference,
      status: "pending",
      requires_shipping: needsShipping,
      fulfillment_status: needsShipping ? "pending" : "none",
      shipping_doc: input.doc?.trim() || null,
      shipping_address: needsShipping ? input.address?.trim() : null,
      shipping_address2: needsShipping ? input.address2?.trim() || null : null,
      shipping_city: needsShipping ? input.city?.trim() : null,
      shipping_state: needsShipping ? input.state?.trim() : null,
      shipping_notes: input.notes?.trim() || null,
    })
    .select("id, claim_token")
    .single();

  if (orderError || !order) {
    console.error("[shop] no se pudo crear la orden", orderError);
    return { ok: false, error: "No se pudo crear el pedido. Intenta de nuevo." };
  }

  const { error: itemsError } = await svc.from("store_order_items").insert(
    cart.lines.map((l) => ({
      order_id: order.id,
      product_id: l.productId,
      variant_id: l.variantId,
      title: l.title,
      variant_title: l.variantTitle,
      kind: l.kind,
      image_url: l.imageUrl,
      qty: l.qty,
      unit_price_cop: l.unitPrice,
      total_cop: l.total,
      program_id: l.programId,
      membership_days: l.membershipDays,
      digital_path: l.digitalPath,
      digital_name: l.digitalName,
      requires_shipping: l.requiresShipping,
    })),
  );

  if (itemsError) {
    // Sin líneas, la orden no se puede cumplir: mejor borrarla que dejar un
    // pedido fantasma que cobra y no entrega nada.
    await svc.from("store_orders").delete().eq("id", order.id);
    console.error("[shop] no se pudieron crear las líneas", itemsError);
    return { ok: false, error: "No se pudo crear el pedido. Intenta de nuevo." };
  }

  const origin = await siteOrigin();
  const claimUrl = `${origin}/pedido/${order.claim_token}`;

  return {
    ok: true,
    apiKey,
    orderId: reference,
    amount: total,
    currency: "COP",
    signature: boldIntegritySignature(reference, total, "COP"),
    description: `OCEOM · ${cart.lines.length} ${cart.lines.length === 1 ? "artículo" : "artículos"}`.slice(0, 100),
    redirectionUrl: claimUrl,
    claimUrl,
  };
}

/* ── Verificación activa del pago (red de seguridad) ──────────
   El webhook de Bold puede tardar o no llegar. Cuando la compradora vuelve
   a la página de su pedido, preguntamos directamente a Bold por el estado.
   La autorización es el `claim_token`: es secreto, va en la URL que solo
   ella recibió, y no expone nada de otras compradoras. */
export async function verifyOrderByClaimAction(
  claimToken: string,
): Promise<{ status: "paid" | "pending" | "rejected" | "not_found" }> {
  const svc = createServiceClient();
  const { data: order } = await svc
    .from("store_orders")
    .select(
      "id, buyer_id, product_kind, program_id, membership_days, amount_cop, reference, status, fulfilled, email, buyer_name",
    )
    .eq("claim_token", claimToken)
    .maybeSingle();

  if (!order) return { status: "not_found" };
  if (order.status === "paid") {
    // Pagada pero sin cumplir: el webhook llegó a medias. Se reintenta.
    if (!order.fulfilled) {
      const { markOrderPaidAndFulfill } = await import("@/lib/store/fulfill");
      await markOrderPaidAndFulfill(order);
    }
    return { status: "paid" };
  }

  const { getBoldPaymentStatus } = await import("@/lib/bold");
  const bold = await getBoldPaymentStatus(order.reference);

  if (bold?.status === "APPROVED") {
    const { markOrderPaidAndFulfill } = await import("@/lib/store/fulfill");
    await markOrderPaidAndFulfill(order, bold.transactionId ?? null);
    await writeCartCookie([]); // el carrito ya se convirtió en pedido
    revalidatePath("/carrito");
    return { status: "paid" };
  }
  if (bold && ["REJECTED", "FAILED", "VOIDED"].includes(bold.status)) {
    await svc.from("store_orders").update({ status: "rejected" }).eq("id", order.id);
    return { status: "rejected" };
  }
  return { status: "pending" };
}
