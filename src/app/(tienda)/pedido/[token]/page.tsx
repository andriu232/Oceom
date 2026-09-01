import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, Truck, Package, ArrowRight } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";
import { OrderStatus } from "@/components/shop/order-status";
import { formatCop, FULFILLMENT_MAP } from "@/config/shop";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tu pedido · OCEOM", robots: { index: false } };

/* La página del pedido.

   El `claim_token` de la URL es la llave: quien lo tiene, compró. Así una
   persona sin cuenta puede seguir su envío y descargar lo suyo desde el
   enlace del correo, sin registrarse ni recordar contraseñas. */

export default async function PedidoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const svc = createServiceClient();

  const { data: order } = await svc
    .from("store_orders")
    .select(
      "id, reference, status, fulfillment_status, requires_shipping, buyer_name, email, subtotal_cop, shipping_cop, amount_cop, shipping_address, shipping_address2, shipping_city, shipping_state, carrier, tracking_number, created_at, claim_token",
    )
    .eq("claim_token", token)
    .maybeSingle();

  if (!order) notFound();

  const [{ data: items }, { data: downloads }] = await Promise.all([
    svc
      .from("store_order_items")
      .select("id, title, variant_title, qty, total_cop, image_url, kind")
      .eq("order_id", order.id),
    order.status === "paid"
      ? svc.from("store_downloads").select("token, name").eq("order_id", order.id)
      : Promise.resolve({ data: [] }),
  ]);

  const entrega = FULFILLMENT_MAP[order.fulfillment_status] ?? null;
  const nombre = order.buyer_name?.split(" ")[0] ?? "";

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-14">
      <p className="text-[0.68rem] uppercase tracking-[0.2em] text-ocean-glow/80">
        Pedido {order.reference}
      </p>
      <h1 className="mt-3 font-display text-2xl font-semibold text-foreground">
        {order.status === "paid"
          ? `Gracias${nombre ? `, ${nombre}` : ""}`
          : "Tu pedido"}
      </h1>

      <div className="mt-4">
        <OrderStatus
          claimToken={order.claim_token}
          initialStatus={order.status as "pending" | "paid" | "rejected" | "cancelled"}
        />
      </div>

      {/* Descargas: lo primero que se busca al volver a esta página. */}
      {(downloads ?? []).length > 0 && (
        <section className="mt-8 rounded-[3px] border border-ocean-cyan/25 bg-ocean-cyan/[0.06] p-5">
          <h2 className="mb-3 flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.18em] text-ocean-glow">
            <Download className="size-3.5" /> Tus descargas
          </h2>
          <ul className="space-y-2">
            {(downloads ?? []).map((d) => (
              <li key={d.token as string}>
                <a
                  href={`/api/descargas/${d.token}`}
                  className="inline-flex items-center gap-2 text-sm text-foreground hover:text-ocean-cyan"
                >
                  <ArrowRight className="size-3.5" />
                  {(d.name as string) ?? "Tu material"}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted/70">
            Guarda los archivos en tu dispositivo. Estos enlaces son solo tuyos.
          </p>
        </section>
      )}

      {order.requires_shipping && order.status === "paid" && (
        <section className="mt-8 rounded-[3px] border border-white/10 bg-ocean-surface/35 p-5">
          <h2 className="mb-3 flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.18em] text-muted">
            <Truck className="size-3.5" /> Tu envío
          </h2>
          {entrega && (
            <span className={`inline-block rounded-full px-3 py-1 text-xs ${entrega.chip}`}>
              {entrega.publicLabel}
            </span>
          )}
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {order.shipping_address}
            {order.shipping_address2 ? `, ${order.shipping_address2}` : ""}
            <br />
            {order.shipping_city}, {order.shipping_state}
          </p>
          {order.tracking_number && (
            <p className="mt-3 text-sm text-foreground">
              Guía <strong>{order.tracking_number}</strong>
              {order.carrier ? ` · ${order.carrier}` : ""}
            </p>
          )}
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.18em] text-muted">
          <Package className="size-3.5" /> Lo que compraste
        </h2>
        <ul className="divide-y divide-white/8 border-y border-white/8">
          {(items ?? []).map((i) => (
            <li key={i.id as string} className="flex items-center gap-4 py-4">
              <div className="size-14 shrink-0 overflow-hidden rounded-[3px] border border-white/10 bg-ocean-deep/50">
                {i.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={i.image_url as string} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">{i.title as string}</p>
                <p className="text-xs text-muted">
                  {i.variant_title ? `${i.variant_title} · ` : ""}× {i.qty as number}
                </p>
              </div>
              <span className="text-sm text-muted">{formatCop(i.total_cop as number)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="text-foreground">{formatCop(order.subtotal_cop)}</dd>
          </div>
          {order.shipping_cop > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted">Envío</dt>
              <dd className="text-foreground">{formatCop(order.shipping_cop)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-white/10 pt-2">
            <dt className="font-display font-semibold text-foreground">Total</dt>
            <dd className="font-display font-semibold text-ocean-glow">
              {formatCop(order.amount_cop)}
            </dd>
          </div>
        </dl>
      </section>

      <p className="mt-10 text-center text-xs text-muted/70">
        Guarda esta página: es el enlace privado de tu pedido.
        <br />
        ¿Algo no cuadra? Escríbenos y lo resolvemos.
      </p>

      <div className="mt-8 text-center">
        <Link
          href="/tienda"
          className="text-sm text-ocean-cyan transition-opacity hover:opacity-80"
        >
          Seguir explorando la tienda
        </Link>
      </div>
    </div>
  );
}
