import Link from "next/link";
import { ShoppingBag, Library, Calendar, Package, Crown, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { requireStudentArea } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { listActiveProducts, listMyOrders } from "@/lib/queries/store";
import { formatCop, PRODUCT_KIND_LABEL, type ProductKind } from "@/config/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tienda · OCEOM" };

const KIND_ICON: Record<ProductKind, LucideIcon> = {
  program: Library,
  session: Calendar,
  pack: Package,
  membership: Crown,
};

export default async function TiendaPage() {
  const profile = await requireStudentArea();
  const [products, orders] = await Promise.all([
    listActiveProducts(),
    listMyOrders(profile.id),
  ]);
  const paid = orders.filter((o) => o.status === "paid");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tienda"
        subtitle="Programas, sesiones 1:1, experiencias y membresía. Pagos seguros con Bold."
      />

      {products.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="La tienda está en preparación"
          description="Muy pronto podrás adquirir programas y experiencias aquí."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const Icon = KIND_ICON[p.kind];
            return (
              <Link
                key={p.id}
                href={`/tienda/${p.slug}`}
                className="glass group flex flex-col overflow-hidden rounded-2xl transition-all hover:-translate-y-0.5 hover:border-ocean-cyan/30"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-ocean-surface/50">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image_url}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-ocean-cyan/40">
                      <Icon className="size-10" />
                    </div>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-ocean-abyss/70 px-2.5 py-1 text-[0.65rem] font-medium text-foreground/90 backdrop-blur">
                    {PRODUCT_KIND_LABEL[p.kind]}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h2 className="font-display text-lg font-semibold leading-snug text-foreground">
                    {p.title}
                  </h2>
                  {p.subtitle && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{p.subtitle}</p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-display text-lg font-bold text-ocean-cyan">
                      {formatCop(p.price_cop)}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium text-muted transition-colors group-hover:text-ocean-cyan">
                      Ver <ArrowRight className="size-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {paid.length > 0 && (
        <section className="space-y-3 border-t border-card-border/60 pt-6">
          <h2 className="font-display text-lg font-semibold text-foreground">Mis compras</h2>
          <ul className="space-y-2">
            {paid.map((o) => (
              <li
                key={o.id}
                className="glass flex items-center justify-between rounded-xl px-4 py-3 text-sm"
              >
                <span className="font-medium text-foreground">{o.product_title}</span>
                <span className="flex items-center gap-3 text-muted">
                  <span>{formatCop(o.amount_cop)}</span>
                  <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs text-success">
                    Pagado
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
