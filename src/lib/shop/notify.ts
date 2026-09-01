import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/send";
import { shell, linkButton, esc, APP_URL } from "@/lib/email/layout";
import { formatCop } from "@/config/shop";

/* ============================================================
   Los tres correos de la tienda.

   · A la compradora, cuando el pago entra: qué compró, a dónde llega y —si
     hay infoproductos— los enlaces para descargarlos ya mismo.
   · A la compradora, cuando el pedido sale: transportadora y número de guía.
   · A Valeria, cuando hay una venta: para que sepa que hay algo que empacar
     sin tener que vivir dentro del panel.
   ============================================================ */

interface OrderForMail {
  id: string;
  reference: string;
  email: string | null;
  buyer_name: string | null;
  amount_cop: number;
  subtotal_cop: number;
  shipping_cop: number;
  requires_shipping: boolean;
  claim_token: string;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  carrier: string | null;
  tracking_number: string | null;
}

async function loadOrder(orderId: string) {
  const svc = createServiceClient();
  const [{ data: order }, { data: items }, { data: downloads }] = await Promise.all([
    svc
      .from("store_orders")
      .select(
        "id, reference, email, buyer_name, amount_cop, subtotal_cop, shipping_cop, requires_shipping, claim_token, shipping_address, shipping_city, shipping_state, carrier, tracking_number",
      )
      .eq("id", orderId)
      .maybeSingle(),
    svc
      .from("store_order_items")
      .select("title, variant_title, qty, total_cop, kind")
      .eq("order_id", orderId),
    svc.from("store_downloads").select("token, name").eq("order_id", orderId),
  ]);
  return {
    order: (order as OrderForMail) ?? null,
    items: items ?? [],
    downloads: downloads ?? [],
  };
}

function itemsTable(
  items: { title: string; variant_title: string | null; qty: number; total_cop: number }[],
): string {
  return items
    .map(
      (i) => `<tr>
        <td style="padding:8px 0;color:#e8eefb;font-size:14px">
          ${esc(i.title)}${i.variant_title ? ` <span style="color:#8aa0c6">· ${esc(i.variant_title)}</span>` : ""}
          <span style="color:#8aa0c6"> × ${i.qty}</span>
        </td>
        <td style="padding:8px 0;color:#e8eefb;font-size:14px;text-align:right;white-space:nowrap">
          ${formatCop(i.total_cop)}
        </td>
      </tr>`,
    )
    .join("");
}

/** Confirmación de pago. */
export async function sendOrderPaidEmail(orderId: string): Promise<void> {
  const { order, items, downloads } = await loadOrder(orderId);
  if (!order?.email) return;

  const nombre = order.buyer_name?.split(" ")[0] ?? "";
  const claimUrl = `${APP_URL}/pedido/${order.claim_token}`;

  const descargas =
    downloads.length > 0
      ? `<div style="margin:22px 0 6px;padding:16px;background:rgba(94,234,212,0.07);border:1px solid rgba(94,234,212,0.2);border-radius:12px">
           <p style="margin:0 0 10px;color:#5eead4;font-size:13px;font-weight:600">Ya puedes descargar</p>
           ${downloads
             .map(
               (d) =>
                 `<p style="margin:5px 0"><a href="${APP_URL}/api/descargas/${d.token}" style="color:#e8eefb;font-size:14px">${esc((d.name as string) ?? "Tu material")}</a></p>`,
             )
             .join("")}
         </div>`
      : "";

  const envio = order.requires_shipping
    ? `<p style="margin:16px 0 0;color:#aab8d4;font-size:14px">
         Preparamos tu envío a <strong style="color:#e8eefb">${esc(order.shipping_address ?? "")}, ${esc(order.shipping_city ?? "")}</strong>.
         Te escribimos apenas salga con el número de guía.
       </p>`
    : "";

  const inner = `
    <p style="margin:0 0 16px;color:#aab8d4;font-size:15px">
      ${nombre ? `${esc(nombre)}, r` : "R"}ecibimos tu pago. Gracias por confiar en OCEOM.
    </p>
    <table style="width:100%;border-collapse:collapse;border-top:1px solid rgba(255,255,255,0.08)">
      ${itemsTable(items as never[])}
      <tr><td colspan="2" style="border-top:1px solid rgba(255,255,255,0.08);padding-top:10px"></td></tr>
      ${
        order.shipping_cop > 0
          ? `<tr><td style="color:#8aa0c6;font-size:13px">Envío</td><td style="color:#8aa0c6;font-size:13px;text-align:right">${formatCop(order.shipping_cop)}</td></tr>`
          : ""
      }
      <tr>
        <td style="color:#e8eefb;font-size:15px;font-weight:600;padding-top:6px">Total</td>
        <td style="color:#5eead4;font-size:15px;font-weight:600;text-align:right;padding-top:6px">${formatCop(order.amount_cop)}</td>
      </tr>
    </table>
    ${descargas}
    ${envio}
    ${linkButton(claimUrl, "Ver mi pedido")}
    <p style="margin:18px 0 0;color:#8aa0c6;font-size:12px">Pedido ${esc(order.reference)}</p>`;

  await sendEmail({
    to: order.email,
    subject: `Tu pedido en OCEOM · ${order.reference}`,
    html: shell("Pago confirmado", inner),
    text: `Recibimos tu pago. Total ${formatCop(order.amount_cop)}. Consulta tu pedido: ${claimUrl}`,
  });

  await notifyMentor(order, items as never[]);
}

/** Aviso interno de venta. */
async function notifyMentor(
  order: OrderForMail,
  items: { title: string; qty: number; total_cop: number; variant_title: string | null }[],
): Promise<void> {
  const svc = createServiceClient();
  const { data: mentores } = await svc
    .from("profiles")
    .select("email")
    .in("role", ["mentor", "super_admin"]);

  const destinos = (mentores ?? [])
    .map((m) => m.email as string | null)
    .filter((e): e is string => !!e);
  if (destinos.length === 0) return;

  const inner = `
    <p style="margin:0 0 14px;color:#aab8d4;font-size:15px">
      <strong style="color:#e8eefb">${esc(order.buyer_name ?? "Alguien")}</strong>
      (${esc(order.email ?? "")}) acaba de comprar.
    </p>
    <table style="width:100%;border-collapse:collapse">${itemsTable(items)}</table>
    <p style="margin:14px 0 0;color:#5eead4;font-size:15px;font-weight:600">${formatCop(order.amount_cop)}</p>
    ${
      order.requires_shipping
        ? `<p style="margin:12px 0 0;color:#f5c451;font-size:14px">Hay que empacar y enviar a ${esc(order.shipping_city ?? "")}, ${esc(order.shipping_state ?? "")}.</p>`
        : ""
    }
    ${linkButton(`${APP_URL}/tienda-admin`, "Ver el pedido")}`;

  for (const to of destinos) {
    await sendEmail({
      to,
      subject: `Nueva venta · ${formatCop(order.amount_cop)}`,
      html: shell("Nueva venta en la tienda", inner),
      text: `Nueva venta de ${formatCop(order.amount_cop)} — ${order.reference}`,
    });
  }
}

/** El pedido salió: transportadora y guía. */
export async function sendOrderShippedEmail(orderId: string): Promise<void> {
  const { order } = await loadOrder(orderId);
  if (!order?.email) return;

  const nombre = order.buyer_name?.split(" ")[0] ?? "";
  const guia = order.tracking_number
    ? `<p style="margin:14px 0 0;color:#aab8d4;font-size:14px">
         Guía <strong style="color:#e8eefb">${esc(order.tracking_number)}</strong>
         ${order.carrier ? ` · ${esc(order.carrier)}` : ""}
       </p>`
    : "";

  const inner = `
    <p style="margin:0 0 10px;color:#aab8d4;font-size:15px">
      ${nombre ? `${esc(nombre)}, t` : "T"}u pedido va en camino hacia
      ${esc(order.shipping_city ?? "tu ciudad")}.
    </p>
    ${guia}
    ${linkButton(`${APP_URL}/pedido/${order.claim_token}`, "Seguir mi pedido")}`;

  await sendEmail({
    to: order.email,
    subject: "Tu pedido va en camino · OCEOM",
    html: shell("Tu pedido salió", inner),
    text: `Tu pedido ${order.reference} va en camino.${order.tracking_number ? ` Guía: ${order.tracking_number}` : ""}`,
  });
}
