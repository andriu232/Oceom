"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronDown, Truck, Copy, Check, MapPin, Phone, Mail } from "lucide-react";
import { updateFulfillmentAction } from "@/lib/actions/shop-admin";
import { formatCop, FULFILLMENT, FULFILLMENT_MAP, type FulfillmentStatus } from "@/config/shop";
import type { AdminOrder } from "@/lib/queries/shop-admin";
import { cn } from "@/lib/utils";

/* Los pedidos, desde el lado de quien tiene que empacarlos.

   Se abre uno y está todo lo que hace falta para despachar: qué llevar, a
   dónde, a quién llamar. Marcar "enviado" con la guía dispara el correo a la
   clienta, que es la pregunta que más llega por WhatsApp. */

const ESTADO_PAGO: Record<string, { label: string; chip: string }> = {
  paid: { label: "Pagado", chip: "bg-success/15 text-success" },
  pending: { label: "Pendiente", chip: "bg-oceom-gold/15 text-oceom-gold" },
  rejected: { label: "Rechazado", chip: "bg-danger/15 text-danger" },
  cancelled: { label: "Cancelado", chip: "bg-white/5 text-muted" },
};

export function OrdersManager({ orders }: { orders: AdminOrder[] }) {
  const [filtro, setFiltro] = useState<"todos" | "despachar" | "pagados">("despachar");

  const visibles = orders.filter((o) => {
    if (filtro === "pagados") return o.status === "paid";
    if (filtro === "despachar")
      return o.status === "paid" && ["pending", "preparing"].includes(o.fulfillment_status);
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {([
          ["despachar", "Por despachar"],
          ["pagados", "Pagados"],
          ["todos", "Todos"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFiltro(key)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs transition-colors",
              filtro === key
                ? "border-ocean-cyan bg-ocean-cyan/10 text-ocean-cyan"
                : "border-card-border text-muted hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
          {filtro === "despachar" ? "No hay nada pendiente por despachar." : "Sin pedidos."}
        </div>
      ) : (
        <ul className="space-y-2">
          {visibles.map((o) => <OrderRow key={o.id} order={o} />)}
        </ul>
      )}
    </div>
  );
}

function OrderRow({ order }: { order: AdminOrder }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [pending, start] = useTransition();
  const [carrier, setCarrier] = useState(order.carrier ?? "");
  const [guia, setGuia] = useState(order.tracking_number ?? "");
  const [copiado, setCopiado] = useState(false);

  const pago = ESTADO_PAGO[order.status] ?? ESTADO_PAGO.pending;
  const entrega = FULFILLMENT_MAP[order.fulfillment_status];

  const cambiar = (status: FulfillmentStatus) =>
    start(async () => {
      await updateFulfillmentAction(order.id, status, { carrier, number: guia });
      router.refresh();
    });

  const direccion = [
    order.shipping_address,
    order.shipping_address2,
    order.shipping_city,
    order.shipping_state,
  ].filter(Boolean).join(", ");

  const copiar = async () => {
    await navigator.clipboard.writeText(
      `${order.buyer_name ?? ""}\n${order.shipping_doc ?? ""}\n${order.phone ?? ""}\n${direccion}`,
    );
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <li className="glass overflow-hidden rounded-xl">
      <button
        onClick={() => setAbierto((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {order.buyer_name ?? order.email ?? "Sin nombre"}
          </p>
          <p className="truncate text-xs text-muted">
            {order.reference} ·{" "}
            {new Date(order.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
            {order.items.length > 0 && ` · ${order.items.length} art.`}
          </p>
        </div>
        <span className="hidden text-sm font-medium text-foreground sm:block">
          {formatCop(order.amount_cop)}
        </span>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs", pago.chip)}>{pago.label}</span>
        {order.requires_shipping && entrega && order.status === "paid" && (
          <span className={cn("hidden rounded-full px-2.5 py-0.5 text-xs sm:inline", entrega.chip)}>
            {entrega.label}
          </span>
        )}
        <ChevronDown className={cn("size-4 shrink-0 text-muted transition-transform", abierto && "rotate-180")} />
      </button>

      {abierto && (
        <div className="space-y-4 border-t border-card-border/60 px-4 py-4">
          <ul className="space-y-1.5">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3 text-sm">
                <span className="text-foreground">
                  {i.title}
                  {i.variant_title && <span className="text-muted"> · {i.variant_title}</span>}
                  <span className="text-muted"> × {i.qty}</span>
                </span>
                <span className="shrink-0 text-muted">{formatCop(i.total_cop)}</span>
              </li>
            ))}
            {order.shipping_cop > 0 && (
              <li className="flex justify-between gap-3 border-t border-card-border/40 pt-1.5 text-sm">
                <span className="text-muted">Envío</span>
                <span className="text-muted">{formatCop(order.shipping_cop)}</span>
              </li>
            )}
          </ul>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="space-y-1.5">
              {order.email && (
                <p className="flex items-center gap-2 text-muted">
                  <Mail className="size-3.5 shrink-0" /> {order.email}
                </p>
              )}
              {order.phone && (
                <p className="flex items-center gap-2 text-muted">
                  <Phone className="size-3.5 shrink-0" />
                  <a href={`https://wa.me/57${order.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="hover:text-ocean-cyan">
                    {order.phone}
                  </a>
                </p>
              )}
            </div>
            {order.requires_shipping && (
              <div className="space-y-1.5">
                <p className="flex items-start gap-2 text-muted">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    {direccion}
                    {order.shipping_doc && <><br />CC {order.shipping_doc}</>}
                    {order.shipping_notes && <><br /><span className="text-muted/70">{order.shipping_notes}</span></>}
                  </span>
                </p>
                <button onClick={copiar} className="inline-flex items-center gap-1.5 text-xs text-ocean-cyan hover:underline">
                  {copiado ? <><Check className="size-3" /> Copiado</> : <><Copy className="size-3" /> Copiar datos de envío</>}
                </button>
              </div>
            )}
          </div>

          {order.requires_shipping && order.status === "paid" && (
            <div className="space-y-3 rounded-xl border border-card-border/60 bg-ocean-surface/30 p-4">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-ocean-glow">
                <Truck className="size-3.5" /> Despacho
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="Transportadora"
                  className="w-full rounded-xl border border-card-border bg-ocean-surface/50 px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-ocean-cyan/40 focus:outline-none"
                />
                <input
                  value={guia}
                  onChange={(e) => setGuia(e.target.value)}
                  placeholder="Número de guía"
                  className="w-full rounded-xl border border-card-border bg-ocean-surface/50 px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-ocean-cyan/40 focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {FULFILLMENT.filter((f) => f.key !== "none").map((f) => (
                  <button
                    key={f.key}
                    onClick={() => cambiar(f.key)}
                    disabled={pending || order.fulfillment_status === f.key}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs transition-colors disabled:opacity-40",
                      order.fulfillment_status === f.key
                        ? "border-ocean-cyan bg-ocean-cyan/10 text-ocean-cyan"
                        : "border-card-border text-muted hover:text-foreground",
                    )}
                  >
                    {pending ? <Loader2 className="size-3 animate-spin" /> : f.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted/70">
                Al marcar “Enviado” le llega el correo con la guía.
              </p>
            </div>
          )}

          <a href={`/pedido/${order.claim_token}`} target="_blank" rel="noreferrer" className="inline-block text-xs text-ocean-cyan hover:underline">
            Ver como lo ve la clienta →
          </a>
        </div>
      )}
    </li>
  );
}
