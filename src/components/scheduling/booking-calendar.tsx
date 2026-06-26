"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { bookSlotAction } from "@/lib/actions/scheduling";
import { formatTime, type DayGroup } from "@/lib/scheduling/time";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { OpenSlot } from "@/lib/queries/scheduling";

export function BookingCalendar({
  days,
  programId,
}: {
  days: DayGroup<OpenSlot>[];
  programId: string | null;
}) {
  const [sel, setSel] = useState<{ id: string; startsAt: string; dayLabel: string } | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function confirm() {
    if (!sel) return;
    setError(null);
    start(async () => {
      const r = await bookSlotAction(sel.id, note, programId);
      if (r?.error) setError(r.error);
      else {
        setSel(null);
        setNote("");
        router.refresh();
      }
    });
  }

  if (days.length === 0) {
    return (
      <p className="glass rounded-2xl p-6 text-sm text-muted">
        Aún no hay horarios disponibles. Tu mentora los abrirá pronto. 🌊
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {days.map((day) => (
        <div key={day.key} className="glass rounded-2xl p-5">
          <h3 className="font-display text-base font-semibold text-foreground">
            {day.label}
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {day.items.map((slot) => {
              const active = sel?.id === slot.id;
              return (
                <button
                  key={slot.id}
                  onClick={() => {
                    setError(null);
                    setSel(active ? null : { id: slot.id, startsAt: slot.startsAt, dayLabel: day.label });
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition-colors",
                    active
                      ? "border-ocean-cyan bg-ocean-cyan/15 text-ocean-cyan"
                      : "border-card-border bg-ocean-surface/40 text-foreground hover:border-ocean-cyan/40",
                  )}
                >
                  <Clock className="size-3.5" /> {formatTime(slot.startsAt)}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {sel && (
        <div className="glass-strong rounded-2xl p-5">
          <p className="text-sm text-muted">Reservar clase</p>
          <p className="mt-1 font-display text-lg font-semibold text-foreground">
            {sel.dayLabel} · {formatTime(sel.startsAt)}
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="¿Qué quieres trabajar en esta sesión? (opcional)"
            className="mt-3 w-full rounded-xl border border-card-border bg-ocean-surface/60 px-4 py-3 text-sm text-foreground outline-none focus:border-ocean-cyan focus:ring-2 focus:ring-[var(--ring)]"
          />
          {error && <p className="mt-2 text-sm text-danger">{error}</p>}
          <div className="mt-4 flex gap-2">
            <Button onClick={confirm} disabled={pending}>
              {pending ? "Reservando…" : "Confirmar reserva"}
            </Button>
            <button
              onClick={() => setSel(null)}
              className="rounded-xl px-4 py-2 text-sm text-muted transition-colors hover:text-foreground"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
