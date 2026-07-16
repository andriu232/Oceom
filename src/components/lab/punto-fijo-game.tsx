"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/* ============================================================
   Punto Fijo (Mundo 5): sostener la mirada en un punto de luz. En
   momentos impredecibles el punto cambia sutilmente (color y tamaño);
   el viajero lo toca apenas lo note. 8 cambios por inmersión. No hay
   castigo: los cambios no vistos solo muestran cuándo viajó la mente.
   ============================================================ */

const TOTAL_CAMBIOS = 8;
const VENTANA_MS = 1300; // tiempo para notar el cambio

export function PuntoFijoGame({
  finish,
}: {
  finish: (metrics: Record<string, unknown>, reflexion?: string) => void;
}) {
  const [running, setRunning] = useState(false);
  const [changed, setChanged] = useState(false);
  const [eventos, setEventos] = useState(0);
  const [detectados, setDetectados] = useState(0);
  const [feedback, setFeedback] = useState<"visto" | "paso" | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const changedRef = useRef(false);
  const doneRef = useRef(false);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (!running || doneRef.current) return;
    if (eventos >= TOTAL_CAMBIOS) return; // el cierre lo maneja la ventana final
    // Programa el próximo cambio en un momento impredecible.
    const delay = 2600 + Math.random() * 3200;
    const t = setTimeout(() => {
      changedRef.current = true;
      setChanged(true);
      // Ventana para notarlo; si pasa, se registra como "la mente viajó".
      const w = setTimeout(() => {
        if (changedRef.current) {
          changedRef.current = false;
          setChanged(false);
          setFeedback("paso");
          setTimeout(() => setFeedback(null), 700);
          next();
        }
      }, VENTANA_MS);
      timers.current.push(w);
    }, delay);
    timers.current.push(t);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, eventos]);

  function next() {
    setEventos((e) => {
      const n = e + 1;
      if (n >= TOTAL_CAMBIOS && !doneRef.current) {
        doneRef.current = true;
        setTimeout(() => {
          setDetectados((d) => {
            finish(
              { detectados: d },
              d >= 6
                ? "Tu atención se quedó contigo casi todo el viaje. Sostener la mirada es sostener la mente: hoy lo lograste."
                : "Cada cambio que se te pasó no es un error: es un mapa de cuándo viaja tu mente. Con cada inmersión, los viajes se acortan.",
            );
            return d;
          });
        }, 600);
      }
      return n;
    });
  }

  function tap() {
    if (!running || doneRef.current) return;
    if (changedRef.current) {
      changedRef.current = false;
      setChanged(false);
      setDetectados((d) => d + 1);
      setFeedback("visto");
      setTimeout(() => setFeedback(null), 700);
      next();
    }
  }

  if (!running) {
    return (
      <div className="space-y-5 text-center">
        <p className="mx-auto max-w-md text-sm leading-relaxed text-muted">
          Vas a sostener la mirada en un punto de luz. De vez en cuando cambiará
          apenas — un respiro de color. Tócalo en cuanto lo notes. Son {TOTAL_CAMBIOS}{" "}
          cambios; nada más existe durante este viaje.
        </p>
        <button
          onClick={() => setRunning(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-ocean-cyan px-6 py-3 text-sm font-semibold text-[var(--ocean-abyss)] transition hover:brightness-110"
        >
          Fijar la mirada
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      <div className="flex w-full items-center justify-between text-xs text-muted">
        <span>
          Cambios: {eventos}/{TOTAL_CAMBIOS}
        </span>
        <span>Notados: {detectados}</span>
      </div>

      <button
        onClick={tap}
        aria-label="Punto de luz"
        className="relative grid size-64 place-items-center rounded-2xl border border-card-border bg-[#04101f]"
      >
        {/* Halo del punto */}
        <span
          aria-hidden
          className={cn(
            "absolute size-24 rounded-full blur-2xl transition-colors duration-500",
            changed ? "bg-ocean-violet/35" : "bg-ocean-cyan/25",
          )}
        />
        {/* El punto */}
        <span
          className={cn(
            "relative rounded-full transition-all duration-500",
            changed
              ? "size-7 bg-ocean-violet shadow-[0_0_30px_rgba(129,140,248,0.9)]"
              : "size-6 bg-ocean-cyan shadow-[0_0_24px_rgba(34,211,238,0.8)]",
          )}
        />
        {feedback && (
          <span
            className={cn(
              "absolute bottom-3 text-xs font-medium",
              feedback === "visto" ? "text-oceom-turquoise" : "text-muted/70",
            )}
          >
            {feedback === "visto" ? "Lo notaste" : "La mente viajó"}
          </span>
        )}
      </button>

      <p className="text-xs text-muted/70">Respira. Mira. Cuando el punto respire distinto, tócalo.</p>
    </div>
  );
}
