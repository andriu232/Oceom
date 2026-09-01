"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, X, AlertTriangle, Truck } from "lucide-react";
import {
  saveShippingRateAction,
  deleteShippingRateAction,
  type AdminState,
} from "@/lib/actions/shop-admin";
import { formatCop, DEPARTAMENTOS } from "@/config/shop";
import type { AdminShippingRate } from "@/lib/queries/shop-admin";
import { cn } from "@/lib/utils";

/* Tarifas de envío por zona.

   La que no marca ningún departamento es la tarifa general: la que se cobra
   a todo el país que no esté nombrado en otra. Sin ella, un pedido a un
   departamento no listado saldría con envío en cero. */

const input =
  "w-full rounded-xl border border-card-border bg-ocean-surface/50 px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-ocean-cyan/40 focus:outline-none";

export function ShippingRates({ rates }: { rates: AdminShippingRate[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [pending, start] = useTransition();

  const [state, action, saving] = useActionState<AdminState, FormData>(
    async (prev, fd) => {
      const res = await saveShippingRateAction(prev, fd);
      if (res?.ok) { router.refresh(); setAdding(false); }
      return res;
    },
    undefined,
  );

  const remove = (id: string) =>
    start(async () => { await deleteShippingRateAction(id); router.refresh(); });

  const hayGeneral = rates.some((r) => r.states.length === 0 && r.active);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
          <Truck className="size-4 text-ocean-glow" /> Tarifas de envío
        </h2>
        {!adding && (
          <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-card-border px-3 py-1.5 text-xs text-muted hover:text-foreground">
            <Plus className="size-3.5" /> Nueva zona
          </button>
        )}
      </div>

      {!hayGeneral && (
        <p className="flex items-start gap-2 rounded-xl border border-oceom-gold/30 bg-oceom-gold/10 px-4 py-3 text-sm text-oceom-gold">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          No hay tarifa general (una zona sin departamentos marcados). Los pedidos a
          departamentos no listados saldrían con envío gratis.
        </p>
      )}

      <ul className="space-y-2">
        {rates.map((r) => (
          <li key={r.id} className={cn("glass flex items-center gap-3 rounded-xl px-4 py-3", !r.active && "opacity-50")}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{r.name}</p>
              <p className="truncate text-xs text-muted">
                {r.states.length === 0 ? "Resto del país" : `${r.states.length} departamentos`}
                {" · "}{formatCop(r.price_cop)}
                {r.free_over_cop && ` · gratis desde ${formatCop(r.free_over_cop)}`}
              </p>
            </div>
            <button onClick={() => remove(r.id)} disabled={pending} className="grid size-8 place-items-center rounded-lg text-muted hover:text-danger disabled:opacity-50">
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-4" />}
            </button>
          </li>
        ))}
      </ul>

      {adding && (
        <form action={action} className="glass space-y-4 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">Nueva zona</p>
            <button type="button" onClick={() => setAdding(false)} className="grid size-7 place-items-center rounded-lg text-muted hover:text-foreground">
              <X className="size-3.5" />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <input name="name" required placeholder="Nombre de la zona" className={input} />
            <input name="price_cop" type="number" min={0} step={500} required placeholder="Costo del envío" className={input} />
            <input name="free_over_cop" type="number" min={0} step={1000} placeholder="Gratis desde (opcional)" className={input} />
          </div>

          <div>
            <p className="mb-2 text-xs text-muted">
              Departamentos que cubre. Sin marcar ninguno, es la tarifa general del país.
            </p>
            <div className="grid max-h-44 grid-cols-2 gap-1.5 overflow-y-auto rounded-xl border border-card-border/60 p-3 sm:grid-cols-3">
              {DEPARTAMENTOS.map((d) => (
                <label key={d} className="flex items-center gap-2 text-xs text-muted">
                  <input type="checkbox" name="states" value={d} className="accent-ocean-cyan" />
                  {d}
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="inline-flex h-9 items-center gap-2 rounded-xl bg-ocean-cyan px-4 text-sm font-medium text-[var(--ocean-abyss)] transition hover:brightness-110 disabled:opacity-60">
              {saving ? <><Loader2 className="size-3.5 animate-spin" /> Guardando…</> : "Guardar zona"}
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
