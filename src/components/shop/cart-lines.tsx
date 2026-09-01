"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Minus, Plus, X, Loader2 } from "lucide-react";
import { setLineQtyAction, removeLineAction } from "@/lib/actions/shop";
import { formatCop } from "@/config/shop";
import type { ResolvedLine } from "@/lib/shop/cart";

/* Las líneas del carrito, editables. */

export function CartLines({ lines }: { lines: ResolvedLine[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function change(line: ResolvedLine, qty: number) {
    start(async () => {
      await setLineQtyAction(line.productId, line.variantId, qty);
      router.refresh();
    });
  }

  function remove(line: ResolvedLine) {
    start(async () => {
      await removeLineAction(line.productId, line.variantId);
      router.refresh();
    });
  }

  return (
    <ul className={`divide-y divide-white/8 ${pending ? "opacity-60" : ""} transition-opacity`}>
      {lines.map((line) => {
        const tope = line.maxQty ?? 20;
        return (
          <li key={line.key} className="flex gap-4 py-5">
            <Link
              href={`/tienda/${line.slug}`}
              className="size-20 shrink-0 overflow-hidden rounded-[3px] border border-white/10 bg-ocean-deep/50 sm:size-24"
            >
              {line.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={line.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full place-items-center text-[0.55rem] tracking-[0.2em] text-ocean-cyan/30">
                  OCEOM
                </span>
              )}
            </Link>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/tienda/${line.slug}`}
                    className="font-display text-sm font-medium text-foreground hover:text-ocean-cyan"
                  >
                    {line.title}
                  </Link>
                  {line.variantTitle && (
                    <p className="mt-0.5 text-xs text-muted">{line.variantTitle}</p>
                  )}
                  {!line.requiresShipping && (
                    <p className="mt-1 text-[0.68rem] uppercase tracking-wider text-ocean-glow/70">
                      Entrega digital
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(line)}
                  disabled={pending}
                  className="shrink-0 text-muted transition-colors hover:text-danger"
                  aria-label={`Quitar ${line.title}`}
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                <div className="flex h-9 items-center rounded-[3px] border border-white/12">
                  <button
                    type="button"
                    onClick={() => change(line, line.qty - 1)}
                    disabled={pending}
                    className="grid size-8 place-items-center text-muted transition-colors hover:text-foreground disabled:opacity-30"
                    aria-label="Quitar uno"
                  >
                    {pending ? <Loader2 className="size-3 animate-spin" /> : <Minus className="size-3" />}
                  </button>
                  <span className="w-7 text-center text-sm text-foreground">{line.qty}</span>
                  <button
                    type="button"
                    onClick={() => change(line, line.qty + 1)}
                    disabled={pending || line.qty >= tope}
                    className="grid size-8 place-items-center text-muted transition-colors hover:text-foreground disabled:opacity-30"
                    aria-label="Añadir uno"
                  >
                    <Plus className="size-3" />
                  </button>
                </div>
                <span className="font-display text-sm font-semibold text-foreground">
                  {formatCop(line.total)}
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
