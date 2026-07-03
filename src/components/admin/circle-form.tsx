"use client";

import { useState } from "react";
import { Radio, Save, Zap, CalendarClock } from "lucide-react";
import {
  createCircleAction,
  updateCircleAction,
  type CircleFormState,
} from "@/lib/actions/circles";
import { isoToLocalInput } from "@/lib/scheduling/time";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Circle } from "@/lib/queries/circles";

interface ProgramOption {
  id: string;
  title: string;
}

const FIELD =
  "h-11 w-full rounded-xl border border-card-border bg-ocean-surface/40 px-3 text-sm text-foreground outline-none focus:border-ocean-cyan/40";

// Horarios en dropdown (6:00 → 21:30, cada 30 min). Sin escribir.
const TIMES: string[] = [];
for (let h = 6; h <= 21; h++)
  for (const m of ["00", "30"]) TIMES.push(`${String(h).padStart(2, "0")}:${m}`);

function dateStr(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86400000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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

  // Por defecto "ahora" para crear rápido. En edición no aplica.
  const [mode, setMode] = useState<"now" | "schedule">("now");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:00");

  const defaultStart = circle ? isoToLocalInput(circle.starts_at) : "";
  const defaultDuration =
    circle?.ends_at && circle.starts_at
      ? Math.round(
          (new Date(circle.ends_at).getTime() -
            new Date(circle.starts_at).getTime()) /
            60000,
        )
      : 90;

  const goSchedule = () => {
    setMode("schedule");
    if (!date) setDate(dateStr(0)); // arranca en "hoy"
  };

  return (
    <form action={action} className="glass space-y-4 rounded-2xl p-6">
      <div className="flex items-center gap-2">
        <Radio className="size-4 text-ocean-cyan" />
        <h2 className="font-display text-lg font-semibold text-foreground">
          {editing ? "Editar círculo" : "Crear un Círculo en Vivo"}
        </h2>
      </div>

      {editing && <input type="hidden" name="id" value={circle!.id} />}

      {/* Selector de modo (solo al crear) */}
      {!editing && (
        <>
          <input type="hidden" name="mode" value={mode} />
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-card-border bg-ocean-surface/30 p-1">
            <button
              type="button"
              onClick={() => setMode("now")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                mode === "now"
                  ? "bg-ocean-cyan/15 text-ocean-cyan"
                  : "text-muted hover:text-foreground",
              )}
            >
              <Zap className="size-4" /> Empezar ahora
            </button>
            <button
              type="button"
              onClick={goSchedule}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                mode === "schedule"
                  ? "bg-ocean-cyan/15 text-ocean-cyan"
                  : "text-muted hover:text-foreground",
              )}
            >
              <CalendarClock className="size-4" /> Programar
            </button>
          </div>
        </>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="c-title">Título</Label>
        <Input
          id="c-title"
          name="title"
          defaultValue={circle?.title}
          placeholder="Ej: Círculo de sanación · Junio"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="c-desc">Descripción (opcional)</Label>
        <Input
          id="c-desc"
          name="description"
          defaultValue={circle?.description ?? ""}
          placeholder="De qué tratará el encuentro"
        />
      </div>

      {/* Modo AHORA: aviso, sin fecha */}
      {!editing && mode === "now" && (
        <div className="flex items-start gap-3 rounded-xl border border-ocean-cyan/20 bg-ocean-cyan/5 p-3">
          <Zap className="mt-0.5 size-4 shrink-0 text-ocean-cyan" />
          <p className="text-sm text-muted">
            El círculo quedará <strong className="text-foreground">EN VIVO al instante</strong>.
            No necesitas poner fecha ni esperar. Podrás entrar a la sala apenas lo crees.
          </p>
        </div>
      )}

      {/* Modo PROGRAMAR (crear): calendario + hora en dropdown */}
      {!editing && mode === "schedule" && (
        <>
          <input type="hidden" name="starts_at" value={date ? `${date}T${time}` : ""} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDate(dateStr(0))}
              className="rounded-full border border-card-border px-3 py-1 text-xs text-muted transition-colors hover:text-ocean-cyan"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => setDate(dateStr(1))}
              className="rounded-full border border-card-border px-3 py-1 text-xs text-muted transition-colors hover:text-ocean-cyan"
            >
              Mañana
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="c-date">Día</Label>
              <input
                id="c-date"
                type="date"
                value={date}
                min={dateStr(0)}
                onChange={(e) => setDate(e.target.value)}
                className={FIELD}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-time">Hora (Colombia)</Label>
              <select
                id="c-time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={FIELD}
              >
                {TIMES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}

      {/* Modo EDICIÓN: fecha/hora clásica */}
      {editing && (
        <div className="space-y-1.5">
          <Label htmlFor="c-start">Fecha y hora (Colombia)</Label>
          <Input
            id="c-start"
            name="starts_at"
            type="datetime-local"
            defaultValue={defaultStart}
            required
          />
        </div>
      )}

      {/* Duración (siempre) */}
      <div className="space-y-1.5">
        <Label htmlFor="c-dur">Duración</Label>
        <select
          id="c-dur"
          name="duration"
          defaultValue={String(defaultDuration)}
          className={FIELD}
        >
          <option value="45">45 min</option>
          <option value="60">1 hora</option>
          <option value="90">1.5 horas</option>
          <option value="120">2 horas</option>
        </select>
      </div>

      {/* Acceso */}
      <div className="space-y-1.5">
        <Label htmlFor="c-prog">Acceso</Label>
        <select
          id="c-prog"
          name="program_id"
          defaultValue={circle?.program_id ?? ""}
          className={FIELD}
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
          <Input
            id="c-rec"
            name="recording_url"
            defaultValue={circle?.recording_url ?? ""}
            placeholder="https://…"
          />
        </div>
      )}

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.ok && (
        <p className="text-sm text-success">
          {editing
            ? "Círculo actualizado ✓"
            : mode === "now"
              ? "¡Círculo en vivo creado! Entra a la sala 🎥"
              : "Círculo programado ✓"}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {!editing && mode === "now" ? (
          <Zap className="size-4" />
        ) : (
          <Save className="size-4" />
        )}
        {pending
          ? "Creando…"
          : editing
            ? "Guardar cambios"
            : mode === "now"
              ? "Empezar ahora"
              : "Programar círculo"}
      </Button>
    </form>
  );
}
