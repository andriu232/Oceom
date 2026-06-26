"use client";

import { useActionState, useState } from "react";
import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { createSlotAction, type SchedState } from "@/lib/actions/scheduling";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];
const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const TIMES: string[] = (() => {
  const out: string[] = [];
  for (let h = 6; h <= 21; h++) {
    for (const m of [0, 30]) {
      if (h === 21 && m === 30) break;
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return out;
})();

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "p.m." : "a.m.";
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${String(m).padStart(2, "0")} ${ap}`;
}

const selectCls =
  "h-11 w-full rounded-xl border border-card-border bg-ocean-surface/60 px-4 text-sm text-foreground outline-none focus:border-ocean-cyan focus:ring-2 focus:ring-[var(--ring)]";

/** Programador visual: mini calendario + selector de hora en pills. */
export function SlotScheduler({
  today,
}: {
  today: { y: number; m: number; d: number };
}) {
  const [view, setView] = useState({ y: today.y, m: today.m }); // m: 1-12
  const [sel, setSel] = useState<{ y: number; m: number; d: number } | null>(null);
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("120");
  const [state, action, pending] = useActionState<SchedState, FormData>(
    createSlotAction,
    undefined,
  );

  const firstDow = (new Date(view.y, view.m - 1, 1).getDay() + 6) % 7; // lunes=0
  const daysInMonth = new Date(view.y, view.m, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const cmp = (d: number) => view.y * 10000 + view.m * 100 + d;
  const todayNum = today.y * 10000 + today.m * 100 + today.d;
  const isPast = (d: number) => cmp(d) < todayNum;
  const isSel = (d: number) =>
    sel?.y === view.y && sel?.m === view.m && sel?.d === d;
  const isToday = (d: number) =>
    today.y === view.y && today.m === view.m && today.d === d;

  const prevMonth = () =>
    setView((v) => (v.m === 1 ? { y: v.y - 1, m: 12 } : { y: v.y, m: v.m - 1 }));
  const nextMonth = () =>
    setView((v) => (v.m === 12 ? { y: v.y + 1, m: 1 } : { y: v.y, m: v.m + 1 }));
  const canGoBack = view.y > today.y || (view.y === today.y && view.m > today.m);

  const datetimeValue =
    sel && time
      ? `${sel.y}-${String(sel.m).padStart(2, "0")}-${String(sel.d).padStart(2, "0")}T${time}`
      : "";

  return (
    <form action={action} className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <CalendarPlus className="size-4 text-ocean-cyan" />
        <h2 className="font-display text-base font-semibold text-foreground">
          Abrir disponibilidad
        </h2>
      </div>

      <div className="mt-4 grid gap-6 md:grid-cols-2">
        {/* Mini calendario */}
        <div>
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={prevMonth}
              disabled={!canGoBack}
              className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-foreground disabled:opacity-30"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm font-medium capitalize text-foreground">
              {MONTHS[view.m - 1]} {view.y}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-foreground"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[0.65rem] uppercase tracking-wide text-muted/60">
            {WEEKDAYS.map((w, i) => (
              <span key={i}>{w}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((d, i) =>
              d === null ? (
                <span key={i} />
              ) : (
                <button
                  key={i}
                  type="button"
                  disabled={isPast(d)}
                  onClick={() => setSel({ y: view.y, m: view.m, d })}
                  className={cn(
                    "grid aspect-square place-items-center rounded-lg text-sm transition-colors",
                    isPast(d) && "cursor-not-allowed text-muted/25",
                    isSel(d)
                      ? "bg-ocean-cyan font-semibold text-[var(--ocean-abyss)]"
                      : !isPast(d) && "text-foreground hover:bg-white/5",
                    isToday(d) && !isSel(d) && "ring-1 ring-inset ring-ocean-cyan/40",
                  )}
                >
                  {d}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Hora + duración */}
        <div>
          <p className="px-1 text-sm text-muted">Hora (Colombia)</p>
          <div className="mt-2 grid max-h-44 grid-cols-3 gap-1.5 overflow-y-auto pr-1">
            {TIMES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTime(t)}
                className={cn(
                  "rounded-lg border px-2 py-1.5 text-xs transition-colors",
                  time === t
                    ? "border-ocean-cyan bg-ocean-cyan/15 text-ocean-cyan"
                    : "border-card-border text-foreground hover:border-ocean-cyan/40",
                )}
              >
                {fmt12(t)}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-1.5">
            <p className="px-1 text-sm text-muted">Duración</p>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className={selectCls}
            >
              <option value="60">1 hora</option>
              <option value="90">1.5 horas</option>
              <option value="120">2 horas</option>
            </select>
          </div>
        </div>
      </div>

      <input type="hidden" name="datetime" value={datetimeValue} />
      <input type="hidden" name="duration" value={duration} />

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending || !datetimeValue}>
          {pending ? "Añadiendo…" : "Añadir disponibilidad"}
        </Button>
        {datetimeValue && (
          <span className="text-xs text-muted">
            {sel!.d}/{sel!.m}/{sel!.y} · {fmt12(time)}
          </span>
        )}
        {state?.ok && (
          <span className="inline-flex items-center gap-1 text-sm text-success">
            <Check className="size-4" /> Añadida
          </span>
        )}
        {state?.error && <span className="text-sm text-danger">{state.error}</span>}
      </div>
    </form>
  );
}
