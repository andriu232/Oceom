"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, X, AlertTriangle, Layers } from "lucide-react";
import { saveVariantAction, deleteVariantAction, type AdminState } from "@/lib/actions/shop-admin";
import { formatCop } from "@/config/shop";
import type { AdminVariant } from "@/lib/queries/shop-admin";
import { cn } from "@/lib/utils";

/* Presentaciones de un producto: 30 g / 100 g, o las fechas de una sesión.

   El precio en blanco hereda el del producto — así una variante que solo
   cambia el tamaño no obliga a repetir el precio en cada fila. */

const input =
  "w-full rounded-xl border border-card-border bg-ocean-surface/50 px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-ocean-cyan/40 focus:outline-none";

export function VariantsEditor({
  productId, variants, basePrice,
}: {
  productId: string;
  variants: AdminVariant[];
  basePrice: number;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [pending, start] = useTransition();

  const [state, action, saving] = useActionState<AdminState, FormData>(
    async (prev, fd) => {
      const res = await saveVariantAction(prev, fd);
      if (res?.ok) { router.refresh(); setAdding(false); }
      return res;
    },
    undefined,
  );

  const remove = (id: string) =>
    start(async () => { await deleteVariantAction(id); router.refresh(); });

  return (
    <div className="glass space-y-4 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
          <Layers className="size-4 text-ocean-glow" /> Presentaciones ({variants.length})
        </h3>
        {!adding && (
          <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-card-border px-3 py-1.5 text-xs text-muted hover:text-foreground">
            <Plus className="size-3.5" /> Añadir
          </button>
        )}
      </div>

      <p className="text-xs text-muted">
        Opcional. Úsalas para tamaños (30 g / 100 g) o para las fechas de una sesión.
        Si dejas el precio vacío, se cobra el del producto ({formatCop(basePrice)}).
      </p>

      {variants.length > 0 && (
        <ul className="space-y-2">
          {variants.map((v) => (
            <li key={v.id} className="flex items-center gap-3 rounded-xl border border-card-border/60 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{v.title}</p>
                <p className="text-xs text-muted">
                  {v.price_cop ? formatCop(v.price_cop) : `${formatCop(basePrice)} (heredado)`}
                  {v.track_stock && ` · ${v.stock} u.`}
                  {v.track_stock && v.stock <= 0 && " · agotada"}
                </p>
              </div>
              <button onClick={() => remove(v.id)} disabled={pending} className="grid size-8 place-items-center rounded-lg text-muted hover:text-danger disabled:opacity-50" title="Eliminar">
                {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-4" />}
              </button>
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <form action={action} className="space-y-3 rounded-xl border border-card-border/60 bg-ocean-surface/30 p-4">
          <input type="hidden" name="product_id" value={productId} />
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">Nueva presentación</p>
            <button type="button" onClick={() => setAdding(false)} className="grid size-7 place-items-center rounded-lg text-muted hover:text-foreground">
              <X className="size-3.5" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="title" required placeholder="Ej. 100 g" className={input} />
            <input name="price_cop" type="number" min={1000} step={1000} placeholder={`Precio (vacío = ${basePrice})`} className={input} />
            <input name="sku" placeholder="SKU (opcional)" className={input} />
            <input name="stock" type="number" min={0} placeholder="Unidades" className={input} />
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" name="track_stock" className="accent-ocean-cyan" />
            Llevar control de existencias de esta presentación
          </label>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className={cn("inline-flex h-9 items-center gap-2 rounded-xl bg-ocean-cyan px-4 text-sm font-medium text-[var(--ocean-abyss)] transition hover:brightness-110 disabled:opacity-60")}>
              {saving ? <><Loader2 className="size-3.5 animate-spin" /> Guardando…</> : "Añadir"}
            </button>
            {state?.error && (
              <span className="inline-flex items-center gap-1 text-sm text-danger">
                <AlertTriangle className="size-4" /> {state.error}
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
