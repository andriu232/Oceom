import Link from "next/link";
import { formatCop, INTENTION_MAP } from "@/config/shop";
import { isAvailable, priceFrom, type ShopProduct } from "@/lib/shop/queries";

/* Tarjeta de la vitrina.

   La foto manda: cuadrada, sobre un fondo propio y sin recortes raros. Debajo,
   solo lo que decide una compra — para qué sirve (las intenciones), cómo se
   llama y cuánto vale. */

export function ProductCard({ product }: { product: ShopProduct }) {
  const disponible = isAvailable(product);
  const desde = priceFrom(product);
  const variosPrecios = (product.variants ?? []).some(
    (v) => typeof v.price_cop === "number" && v.price_cop !== product.price_cop,
  );
  const rebaja =
    product.compare_at_price_cop && product.compare_at_price_cop > product.price_cop
      ? product.compare_at_price_cop
      : null;

  return (
    <Link
      href={`/tienda/${product.slug}`}
      className="group flex flex-col rounded-[3px] border border-white/10 bg-ocean-surface/35 transition-all duration-300 hover:-translate-y-1 hover:border-ocean-cyan/30 hover:shadow-[0_28px_70px_-42px_rgba(34,211,238,0.5)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-b from-ocean-mid/40 to-ocean-deep/60">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full place-items-center">
            <span className="font-display text-3xl tracking-[0.3em] text-ocean-cyan/20">
              OCEOM
            </span>
          </div>
        )}

        {!disponible && (
          <div className="absolute inset-0 grid place-items-center bg-ocean-abyss/70">
            <span className="rounded-full border border-white/20 px-4 py-1.5 text-[0.65rem] uppercase tracking-[0.2em] text-foreground/90">
              Agotado
            </span>
          </div>
        )}
        {disponible && rebaja && (
          <span className="absolute left-3 top-3 rounded-full bg-oceom-gold px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-wider text-[var(--ocean-abyss)]">
            Oferta
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {product.intentions.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {product.intentions.slice(0, 3).map((key) => {
              const intention = INTENTION_MAP[key];
              if (!intention) return null;
              return (
                <span
                  key={key}
                  className="rounded-full px-2 py-0.5 text-[0.62rem] tracking-wide"
                  style={{
                    color: intention.color,
                    backgroundColor: `${intention.color}1a`,
                  }}
                >
                  {intention.label}
                </span>
              );
            })}
          </div>
        )}

        <h3 className="font-display text-[0.98rem] font-medium leading-snug text-foreground">
          {product.title}
        </h3>
        {product.subtitle && (
          <p className="mt-1 line-clamp-2 text-[0.8rem] leading-relaxed text-muted">
            {product.subtitle}
          </p>
        )}

        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-display text-[0.95rem] font-semibold text-ocean-glow">
            {variosPrecios && (
              <span className="mr-1 text-[0.7rem] font-normal text-muted">desde</span>
            )}
            {formatCop(desde)}
          </span>
          {rebaja && (
            <span className="text-xs text-muted/60 line-through">{formatCop(rebaja)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
