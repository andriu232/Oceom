import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { StoreManager } from "@/components/admin/store-manager";
import { listAllProducts, listAllOrders } from "@/lib/queries/store";
import { formatCop, PRODUCT_KIND_LABEL, type ProductKind } from "@/config/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tienda · OCEOM" };

const STATUS_CHIP: Record<string, string> = {
  paid: "bg-success/15 text-success",
  pending: "bg-oceom-gold/15 text-oceom-gold",
  rejected: "bg-danger/15 text-danger",
  cancelled: "bg-white/5 text-muted",
};
const STATUS_LABEL: Record<string, string> = {
  paid: "Pagado",
  pending: "Pendiente",
  rejected: "Rechazado",
  cancelled: "Cancelado",
};

export default async function TiendaAdminPage() {
  await requireRole("mentor", "super_admin");
  const supabase = await createClient();
  const [products, orders, programsRes] = await Promise.all([
    listAllProducts(),
    listAllOrders(),
    supabase.from("programs").select("id, title").order("title"),
  ]);
  const programs = (programsRes.data ?? []) as { id: string; title: string }[];

  const paidTotal = orders
    .filter((o) => o.status === "paid")
    .reduce((s, o) => s + o.amount_cop, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tienda"
        subtitle="Crea y gestiona productos. Los pagos con Bold se confirman e inscriben solos."
      />

      <StoreManager products={products} programs={programs} />

      <section className="space-y-3 border-t border-card-border/60 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Órdenes ({orders.length})
          </h2>
          <span className="text-sm text-muted">
            Ventas confirmadas: <span className="font-semibold text-success">{formatCop(paidTotal)}</span>
          </span>
        </div>
        {orders.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
            Aún no hay órdenes.
          </div>
        ) : (
          <div className="glass overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-card-border/60 text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Comprador</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Monto</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-card-border/40 last:border-0">
                    <td className="px-4 py-3 text-foreground/90">{o.buyer_name ?? "—"}</td>
                    <td className="px-4 py-3 text-foreground/90">{o.product_title}</td>
                    <td className="px-4 py-3 text-muted">
                      {PRODUCT_KIND_LABEL[o.product_kind as ProductKind] ?? o.product_kind}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{formatCop(o.amount_cop)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_CHIP[o.status] ?? ""}`}>
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(o.created_at).toLocaleDateString("es-CO", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
