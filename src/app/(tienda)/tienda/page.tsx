import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { listShopProducts, listCategories, type CatalogFilters } from "@/lib/shop/queries";
import { ProductCard } from "@/components/shop/product-card";
import { INTENTIONS } from "@/config/shop";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tienda · OCEOM",
  description:
    "Suplementos, objetos de ritual y formación del método E-MOTION®. Envíos a toda Colombia.",
};

const SHELL = "mx-auto w-full max-w-[1180px] px-6";

const ORDENES = [
  { key: "destacados", label: "Destacados" },
  { key: "recientes", label: "Lo nuevo" },
  { key: "precio-asc", label: "Precio ↑" },
  { key: "precio-desc", label: "Precio ↓" },
] as const;

/** Conserva los filtros vigentes al cambiar uno solo. */
function hrefWith(
  current: Record<string, string | undefined>,
  patch: Record<string, string | null>,
): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...current, ...patch })) {
    if (v) params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `/tienda?${qs}` : "/tienda";
}

export default async function TiendaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const filtros = {
    categoria: one(sp.categoria),
    intencion: one(sp.intencion),
    buscar: one(sp.buscar),
    orden: one(sp.orden),
  };

  const [products, categories] = await Promise.all([
    listShopProducts({
      category: filtros.categoria ?? null,
      intention: filtros.intencion ?? null,
      search: filtros.buscar ?? null,
      sort: (filtros.orden as CatalogFilters["sort"]) ?? null,
    }),
    listCategories(),
  ]);

  const categoriaActual = categories.find((c) => c.slug === filtros.categoria);
  // Solo se ofrecen las intenciones que alguien puede llegar a encontrar.
  const intencionesVivas = INTENTIONS.filter(
    (i) => products.some((p) => p.intentions.includes(i.key)) || filtros.intencion === i.key,
  );

  return (
    <div className={`${SHELL} py-12`}>
      <header className="mb-10 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {categoriaActual?.name ?? "La tienda"}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted">
          {categoriaActual?.description ??
            "Lo que sostiene el cuerpo mientras la emoción se ordena: suplementos, objetos de ritual y formación del método E-MOTION®."}
        </p>
      </header>

      {/* Intenciones: el filtro que de verdad usa la gente. No busca "polvo
          de hongo", busca dormir mejor. */}
      {intencionesVivas.length > 0 && (
        <div className="mb-5 flex flex-wrap justify-center gap-2">
          {intencionesVivas.map((i) => {
            const activa = filtros.intencion === i.key;
            return (
              <Link
                key={i.key}
                href={hrefWith(filtros, { intencion: activa ? null : i.key })}
                className="rounded-full border px-3.5 py-1.5 text-[0.72rem] tracking-wide transition-colors"
                style={{
                  color: activa ? "var(--ocean-abyss)" : i.color,
                  backgroundColor: activa ? i.color : `${i.color}14`,
                  borderColor: activa ? i.color : `${i.color}33`,
                }}
              >
                {i.label}
              </Link>
            );
          })}
        </div>
      )}

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">
          {products.length} {products.length === 1 ? "producto" : "productos"}
          {filtros.buscar && (
            <>
              {" · "}
              <span className="text-foreground">“{filtros.buscar}”</span>
            </>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          {ORDENES.map((o) => {
            const activa = (filtros.orden ?? "destacados") === o.key;
            return (
              <Link
                key={o.key}
                href={hrefWith(filtros, { orden: o.key === "destacados" ? null : o.key })}
                className={`text-[0.72rem] uppercase tracking-[0.14em] transition-colors ${
                  activa ? "text-ocean-cyan" : "text-muted hover:text-foreground"
                }`}
              >
                {o.label}
              </Link>
            );
          })}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="rounded-[3px] border border-white/10 bg-ocean-surface/35 px-6 py-20 text-center">
          <ShoppingBag className="mx-auto size-8 text-ocean-cyan/40" />
          <p className="mt-4 font-display text-lg text-foreground">
            Nada por aquí todavía
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            {filtros.intencion || filtros.buscar || filtros.categoria
              ? "Prueba quitando algún filtro."
              : "La tienda se está preparando. Vuelve pronto."}
          </p>
          {(filtros.intencion || filtros.buscar || filtros.categoria) && (
            <Link
              href="/tienda"
              className="mt-5 inline-block text-sm text-ocean-cyan hover:underline"
            >
              Ver todo
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
