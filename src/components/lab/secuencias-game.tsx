"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/* ============================================================
   Secuencias Luminosas (Mundo 5): cuatro orbes bioluminiscentes se
   encienden en secuencia; el viajero la repite. Cada ola añade un
   destello más. Nunca se penaliza: al fallar, la ola se retira y se
   premia hasta dónde llegó.
   ============================================================ */

const ORBS = [
  { key: 0, tone: "from-ocean-glow to-ocean-cyan", glow: "shadow-[0_0_34px_rgba(34,211,238,0.8)]" },
  { key: 1, tone: "from-ocean-violet to-[#6d6df8]", glow: "shadow-[0_0_34px_rgba(129,140,248,0.8)]" },
  { key: 2, tone: "from-oceom-turquoise to-[#0d9488]", glow: "shadow-[0_0_34px_rgba(45,212,191,0.8)]" },
  { key: 3, tone: "from-oceom-gold to-[#b45309]", glow: "shadow-[0_0_34px_rgba(234,179,8,0.8)]" },
];

const MAX_ROUNDS = 12;

export function SecuenciasGame({
  finish,
}: {
  finish: (metrics: Record<string, unknown>, reflexion?: string) => void;
}) {
  // La secuencia nace con su primer destello (estado inicial perezoso).
  const [seq, setSeq] = useState<number[]>(() => [Math.floor(Math.random() * 4)]);
  const [lit, setLit] = useState<number | null>(null);
  const [showing, setShowing] = useState(true);
  const [inputIdx, setInputIdx] = useState(0);
  const round = seq.length;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const speed = Math.max(340, 620 - seq.length * 25);
    // El reinicio de la entrada también va por timer (nada de setState síncrono
    // dentro del efecto).
    timers.current.push(setTimeout(() => setInputIdx(0), 0));
    seq.forEach((orb, i) => {
      timers.current.push(setTimeout(() => setLit(orb), 500 + i * speed));
      timers.current.push(setTimeout(() => setLit(null), 500 + i * speed + speed * 0.6));
    });
    timers.current.push(
      setTimeout(() => setShowing(false), 500 + seq.length * speed + 150),
    );
    return () => timers.current.forEach(clearTimeout);
  }, [seq]);

  function done(completedRound: number) {
    finish(
      { ronda: Math.max(1, completedRound) },
      completedRound >= 7
        ? "Sostuviste la atención mientras la profundidad crecía. Esa constancia silenciosa es concentración real."
        : "La ola se retiró, pero mira hasta dónde llegaste. La concentración crece exactamente así: una ola a la vez.",
    );
  }

  function press(orb: number) {
    if (showing) return;
    setLit(orb);
    setTimeout(() => setLit(null), 220);
    if (orb === seq[inputIdx]) {
      if (inputIdx + 1 === seq.length) {
        // Ronda completada.
        if (seq.length >= MAX_ROUNDS) return done(seq.length);
        setTimeout(() => setSeq((s) => [...s, Math.floor(Math.random() * 4)]), 650);
        setShowing(true);
      } else {
        setInputIdx(inputIdx + 1);
      }
    } else {
      done(seq.length - 1);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>Ola {round} · {showing ? "Observa la secuencia…" : "Repite la secuencia"}</span>
        <span className="font-mono tabular-nums">{MAX_ROUNDS} olas máx.</span>
      </div>

      <div className="mx-auto grid max-w-xs grid-cols-2 gap-4">
        {ORBS.map((o) => (
          <button
            key={o.key}
            onClick={() => press(o.key)}
            disabled={showing}
            aria-label={`Orbe ${o.key + 1}`}
            className={cn(
              "aspect-square rounded-full bg-gradient-to-br transition-all duration-150",
              o.tone,
              lit === o.key ? cn("scale-105 opacity-100", o.glow) : "opacity-35",
              !showing && "hover:opacity-70 active:scale-95",
            )}
          />
        ))}
      </div>

      <p className="text-center text-xs text-muted/70">
        {showing
          ? "Las luces del océano hablan primero."
          : "Ahora respóndeles en el mismo orden."}
      </p>
    </div>
  );
}
