"use client";

import { useActionState } from "react";
import { CalendarPlus, Check } from "lucide-react";
import { createSlotAction, type SchedState } from "@/lib/actions/scheduling";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const inputCls =
  "h-11 w-full rounded-xl border border-card-border bg-ocean-surface/60 px-4 text-sm text-foreground outline-none focus:border-ocean-cyan focus:ring-2 focus:ring-[var(--ring)]";

export function AddSlotForm() {
  const [state, action, pending] = useActionState<SchedState, FormData>(
    createSlotAction,
    undefined,
  );

  return (
    <form action={action} className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <CalendarPlus className="size-4 text-ocean-cyan" />
        <h2 className="font-display text-base font-semibold text-foreground">
          Abrir disponibilidad
        </h2>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="datetime">Fecha y hora</Label>
          <input id="datetime" name="datetime" type="datetime-local" required className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="duration">Duración</Label>
          <select id="duration" name="duration" defaultValue="120" className={inputCls}>
            <option value="60">1 hora</option>
            <option value="90">1.5 horas</option>
            <option value="120">2 horas</option>
          </select>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Añadiendo…" : "Añadir"}
        </Button>
      </div>
      {state?.ok && (
        <p className="mt-3 inline-flex items-center gap-1 text-sm text-success">
          <Check className="size-4" /> Disponibilidad añadida
        </p>
      )}
      {state?.error && <p className="mt-3 text-sm text-danger">{state.error}</p>}
      <p className="mt-3 text-xs text-muted/70">Hora de Colombia (GMT-5).</p>
    </form>
  );
}
