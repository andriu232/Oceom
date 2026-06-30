"use client";

import { useActionState } from "react";
import { Radio, Save } from "lucide-react";
import {
  createCircleAction,
  updateCircleAction,
  type CircleFormState,
} from "@/lib/actions/circles";
import { isoToLocalInput } from "@/lib/scheduling/time";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Circle } from "@/lib/queries/circles";

interface ProgramOption {
  id: string;
  title: string;
}

export function CircleForm({
  circle,
  programs,
}: {
  circle?: Circle;
  programs: ProgramOption[];
}) {
  const editing = Boolean(circle);
  const [state, action, pending] = useActionState<CircleFormState, FormData>(
    editing ? updateCircleAction : createCircleAction,
    undefined,
  );

  const defaultStart = circle ? isoToLocalInput(circle.starts_at) : "";
  const defaultDuration =
    circle?.ends_at && circle.starts_at
      ? Math.round(
          (new Date(circle.ends_at).getTime() -
            new Date(circle.starts_at).getTime()) /
            60000,
        )
      : 90;

  return (
    <form action={action} className="glass space-y-4 rounded-2xl p-6">
      <div className="flex items-center gap-2">
        <Radio className="size-4 text-ocean-cyan" />
        <h2 className="font-display text-lg font-semibold text-foreground">
          {editing ? "Editar círculo" : "Programar un Círculo en Vivo"}
        </h2>
      </div>

      {editing && <input type="hidden" name="id" value={circle!.id} />}

      <div className="space-y-1.5">
        <Label htmlFor="c-title">Título</Label>
        <Input id="c-title" name="title" defaultValue={circle?.title} placeholder="Ej: Círculo de sanación · Junio" required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="c-desc">Descripción (opcional)</Label>
        <Input id="c-desc" name="description" defaultValue={circle?.description ?? ""} placeholder="De qué tratará el encuentro" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="c-start">Fecha y hora (Colombia)</Label>
          <Input id="c-start" name="starts_at" type="datetime-local" defaultValue={defaultStart} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-dur">Duración</Label>
          <select
            id="c-dur"
            name="duration"
            defaultValue={String(defaultDuration)}
            className="h-11 w-full rounded-xl border border-card-border bg-ocean-surface/40 px-3 text-sm text-foreground outline-none focus:border-ocean-cyan/40"
          >
            <option value="45">45 min</option>
            <option value="60">1 hora</option>
            <option value="90">1.5 horas</option>
            <option value="120">2 horas</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="c-prog">Acceso</Label>
        <select
          id="c-prog"
          name="program_id"
          defaultValue={circle?.program_id ?? ""}
          className="h-11 w-full rounded-xl border border-card-border bg-ocean-surface/40 px-3 text-sm text-foreground outline-none focus:border-ocean-cyan/40"
        >
          <option value="">Abierto a todos los estudiantes</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              Solo inscritos en: {p.title}
            </option>
          ))}
        </select>
      </div>

      {editing && (
        <div className="space-y-1.5">
          <Label htmlFor="c-rec">Enlace de grabación (después del círculo)</Label>
          <Input id="c-rec" name="recording_url" defaultValue={circle?.recording_url ?? ""} placeholder="https://…" />
        </div>
      )}

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.ok && (
        <p className="text-sm text-success">
          {editing ? "Círculo actualizado ✓" : "Círculo programado ✓"}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        <Save className="size-4" />
        {pending ? "Guardando…" : editing ? "Guardar cambios" : "Programar círculo"}
      </Button>
    </form>
  );
}
