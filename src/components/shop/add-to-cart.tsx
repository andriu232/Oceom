"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Minus, Plus, AlertTriangle } from "lucide-react";
import { addToCartAction } from "@/lib/actions/shop";
import { formatCop, MAX_QTY } from "@/config/shop";
import type { ShopVariant } from "@/lib/shop/queries";

/* Selector de presentación + cantidad + añadir al carrito.

   Después de añadir NO se navega al carrito: quien está mirando un producto
   suele querer seguir mirando. El estado "añadido" dura unos segundos y el
   contador de la cabecera se refresca solo. */

interface Props {
  productId: string;
  basePrice: number;
  trackStock: boolean;
  stock: number;
  variants: ShopVariant[];
  variantLabel?: string | null;
}

export function AddToCart({
  productId,
  basePrice,
  trackStock,
  stock,
  variants,
  variantLabel,
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [variantId, setVariantId] = useState<string | null>(
    variants.find((v) => !v.track_stock || v.stock > 0)?.id ?? variants[0]?.id ?? null,
  );
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const variant = variants.find((v) => v.id === variantId) ?? null;
  const price = variant?.price_cop ?? basePrice;
  const tracks = variant ? variant.track_stock : trackStock;
  const available = variant ? variant.stock : stock;
  const agotado = tracks && available <= 0;
  const tope = tracks ? Math.min(available, MAX_QTY) : MAX_QTY;
  const pocas = tracks && available > 0 && available <= 5;

  function add() {
    setAviso(null);
    start(async () => {
      const res = await addToCartAction(productId, variantId, qty);
      if (!res.ok) {
        setAviso(res.error ?? "No se pudo añadir.");
        return;
      }
      if (res.error) setAviso(res.error);
      setAdded(true);
      router.refresh();
      setTimeout(() => setAdded(false), 2600);
    });
  }

  return (
    <div className="space-y-5">
      {variants.length > 0 && (
        <div>
          <p className="mb-2 text-[0.68rem] uppercase tracking-[0.2em] text-muted">
            {variantLabel || "Presentación"}
          </p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const sinStock = v.track_stock && v.stock <= 0;
              const activa = v.id === variantId;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setVariantId(v.id);
                    setQty(1);
                  }}
                  disabled={sinStock}
                  className={`rounded-[3px] border px-4 py-2.5 text-sm transition-colors ${
                    activa
                      ? "border-ocean-cyan bg-ocean-cyan/10 text-foreground"
                      : "border-white/12 text-muted hover:border-white/25 hover:text-foreground"
                  } ${sinStock ? "cursor-not-allowed line-through opacity-40" : ""}`}
                >
                  {v.title}
                  {typeof v.price_cop === "number" && v.price_cop !== basePrice && (
                    <span className="ml-2 text-xs text-muted">{formatCop(v.price_cop)}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-baseline gap-3">
        <span className="font-display text-2xl font-semibold text-foreground">
          {formatCop(price)}
        </span>
        {pocas && (
          <span className="text-xs text-oceom-gold">Quedan {available}</span>
        )}
      </div>

      {agotado ? (
        <div className="rounded-[3px] border border-white/12 bg-white/[0.03] px-4 py-4 text-center">
          <p className="text-sm text-muted">
            Agotado por ahora. Escríbenos y te avisamos cuando vuelva.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex h-12 items-center rounded-[3px] border border-white/12">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              className="grid size-11 place-items-center text-muted transition-colors hover:text-foreground disabled:opacity-30"
              aria-label="Quitar uno"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-8 text-center text-sm font-medium text-foreground" aria-live="polite">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(tope, q + 1))}
              disabled={qty >= tope}
              className="grid size-11 place-items-center text-muted transition-colors hover:text-foreground disabled:opacity-30"
              aria-label="Añadir uno"
            >
              <Plus className="size-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={add}
            disabled={pending}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-[3px] bg-ocean-cyan text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[var(--ocean-abyss)] transition hover:brightness-110 disabled:opacity-60"
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Añadiendo
              </>
            ) : added ? (
              <>
                <Check className="size-4" /> En tu carrito
              </>
            ) : (
              "Añadir al carrito"
            )}
          </button>
        </div>
      )}

      {aviso && (
        <p className="flex items-center gap-1.5 text-sm text-oceom-gold">
          <AlertTriangle className="size-4 shrink-0" /> {aviso}
        </p>
      )}
    </div>
  );
}
