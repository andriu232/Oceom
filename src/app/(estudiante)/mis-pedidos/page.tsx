import Link from "next/link";
import { Package, Download, ArrowRight } from "lucide-react";
import { requireStudentArea } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCop, FULFILLMENT_MAP } from "@/config/shop";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mis pedidos · OCEOM" };

/* Las compras de quien SÍ tiene cuenta.

   Se busca por id de perfil y también por correo: una alumna pudo comprar
   como invitada antes de tener cuenta (o con el carrito de su teléfono sin
   sesión), y esas compras también son suyas. */

export default async function MisPedidosPage() {
  const profile = await requireStudentArea();
  const svc = createServiceClient();

  const { data: orders } = await svc
    .from("store_orders")
    .select(
      "id, reference, status, fulfillment_status, amount_cop, created_at, claim_token, requires_shipping, tracking_number",
    )
    .or(`buyer_id.eq.${profile.id},email.ilike.${profile.email ?? "___nunca___"}`)
    .order("created_at", { ascending: false })
    .limit(50);

  const pedidos = orders ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Mis pedidos"
        subtitle="Todo lo que has comprado en la tienda, con sus envíos y descargas."
      />

      {pedidos.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Todavía no has comprado nada"
          description="Cuando lo hagas, aquí podrás seguir tus envíos y volver a descargar tus materiales."
        />
      ) : (
        <ul className="space-y-3">
          {pedidos.map((o) => {
            const entrega = FULFILLMENT_MAP[o.fulfillment_status as string];
            const pagado = o.status === "paid";
            return (
              <li key={o.id as string}>
                <Link
                  href={`/pedido/${o.claim_token}`}
                  className="glass flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-4 transition-colors hover:border-ocean-cyan/30"
                >
                  <div className="min-w-0">
                    <p className="font-display text-sm font-medium text-foreground">
                      {o.reference as string}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {new Date(o.created_at as string).toLocaleDateString("es-CO", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium text-foreground">
                      {formatCop(o.amount_cop as number)}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs ${
                        pagado ? "bg-success/15 text-success" : "bg-oceom-gold/15 text-oceom-gold"
                      }`}
                    >
                      {pagado ? "Pagado" : "Pendiente"}
                    </span>
                    {pagado && o.requires_shipping && entrega && (
                      <span className={`rounded-full px-2.5 py-0.5 text-xs ${entrega.chip}`}>
                        {entrega.publicLabel}
                      </span>
                    )}
                    {pagado && !o.requires_shipping && (
                      <span className="flex items-center gap-1 text-xs text-ocean-glow">
                        <Download className="size-3" /> Digital
                      </span>
                    )}
                    <ArrowRight className="size-4 text-muted" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
