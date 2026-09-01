import Link from "next/link";
import { ShoppingBag, ArrowRight, Truck } from "lucide-react";
import { getCart } from "@/lib/shop/cart";
import { listShippingRates, quoteShipping } from "@/lib/shop/queries";
import { CartLines } from "@/components/shop/cart-lines";
import { formatCop } from "@/config/shop";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tu carrito · OCEOM" };

export default async function CarritoPage() {
  const cart = await getCart();

  // Sin departamento todavía: se muestra la tarifa general, para que el envío
  // no aparezca como una sorpresa recién en el último paso.
  const rates = cart.requiresShipping ? await listShippingRates() : [];
  const quote = cart.requiresShipping ? quoteShipping(rates, null, cart.subtotal) : null;

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-md px-6 py-28 text-center">
        <ShoppingBag className="mx-auto size-9 text-ocean-cyan/40" />
        <h1 className="mt-5 font-display text-2xl font-semibold text-foreground">
          Tu carrito está vacío
        </h1>
        <p className="mt-3 text-sm text-muted">
          Todo lo que elijas te espera aquí hasta que estés lista.
        </p>
        <Link
          href="/tienda"
          className="mt-7 inline-flex h-11 items-center justify-center rounded-[3px] bg-ocean-cyan px-7 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-[var(--ocean-abyss)] transition hover:brightness-110"
        >
          Ir a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] px-6 py-12">
      <h1 className="mb-8 font-display text-2xl font-semibold text-foreground">
        Tu carrito
      </h1>

      {cart.changed && (
        <p className="mb-6 rounded-[3px] border border-oceom-gold/30 bg-oceom-gold/10 px-4 py-3 text-sm text-oceom-gold">
          Ajustamos tu carrito: algo cambió de disponibilidad mientras tanto.
        </p>
      )}

      <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
        <div className="border-t border-white/10">
          <CartLines lines={cart.lines} />
        </div>

        <aside className="lg:sticky lg:top-32 lg:h-fit">
          <div className="rounded-[3px] border border-white/10 bg-ocean-surface/35 p-6">
            <h2 className="font-display text-base font-semibold text-foreground">Resumen</h2>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="text-foreground">{formatCop(cart.subtotal)}</dd>
              </div>
              {quote && (
                <div className="flex justify-between">
                  <dt className="text-muted">Envío</dt>
                  <dd className={quote.free ? "text-success" : "text-foreground"}>
                    {quote.free ? "Gratis" : `desde ${formatCop(quote.cost)}`}
                  </dd>
                </div>
              )}
              <div className="flex justify-between border-t border-white/10 pt-3">
                <dt className="font-display font-semibold text-foreground">Total</dt>
                <dd className="font-display text-lg font-semibold text-ocean-glow">
                  {formatCop(cart.subtotal + (quote?.cost ?? 0))}
                </dd>
              </div>
            </dl>

            {quote?.missingForFree && quote.missingForFree > 0 && (
              <p className="mt-4 flex items-start gap-2 rounded-[3px] bg-ocean-cyan/8 px-3 py-2.5 text-xs text-ocean-glow">
                <Truck className="mt-0.5 size-3.5 shrink-0" />
                Te faltan {formatCop(quote.missingForFree)} para el envío gratis.
              </p>
            )}

            <Link
              href="/checkout"
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[3px] bg-ocean-cyan text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-[var(--ocean-abyss)] transition hover:brightness-110"
            >
              Finalizar compra <ArrowRight className="size-4" />
            </Link>

            <Link
              href="/tienda"
              className="mt-3 block text-center text-xs text-muted transition-colors hover:text-foreground"
            >
              Seguir viendo
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
