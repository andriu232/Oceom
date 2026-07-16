"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/* ============================================================
   Corrientes de Respiración (Mundo 6): un orbe bioluminiscente se
   expande al inhalar, se sostiene en la pausa y se contrae al exhalar.
   Patrones configurables y ciclos a elección. Sin sonido: la guía es
   visual y el ritmo, el del propio cuerpo.
   ============================================================ */

interface Pattern {
  key: string;
  name: string;
  desc: string;
  /** [inhala, sostén, exhala] en segundos. */
  steps: [number, number, number];
}

const PATTERNS: Pattern[] = [
  { key: "oceanica", name: "Oceánica", desc: "4 · 4 · 6 — calma general", steps: [4, 4, 6] },
  { key: "cuadrada", name: "Marea cuadrada", desc: "4 · 4 · 4 — equilibrio", steps: [4, 4, 4] },
  { key: "profunda", name: "Calma profunda", desc: "4 · 7 · 8 — para soltar", steps: [4, 7, 8] },
];

const PHASE_LABEL = ["Inhala", "Sostén", "Exhala"] as const;

export function RespiracionGame({
  finish,
}: {
  finish: (metrics: Record<string, unknown>, reflexion?: string) => void;
}) {
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [cycles, setCycles] = useState(3);
  const [phase, setPhase] = useState(0); // 0 inhala, 1 sostén, 2 exhala
  const [cycle, setCycle] = useState(0);
  const [running, setRunning] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!running || !pattern) return;
    const dur = pattern.steps[phase] * 1000;
    const t = setTimeout(() => {
      if (phase < 2) {
        setPhase(phase + 1);
      } else if (cycle + 1 < cycles) {
        setCycle(cycle + 1);
        setPhase(0);
      } else if (!doneRef.current) {
        doneRef.current = true;
        finish(
          { ciclos: cycles, patron: pattern.key },
          "Tu sistema nervioso acaba de recibir un mensaje claro: estás a salvo. Vuelve a esta corriente cada vez que el oleaje interno suba.",
        );
      }
    }, dur);
    return () => clearTimeout(t);
  }, [running, pattern, phase, cycle, cycles, finish]);

  if (!pattern) {
    return (
      <div className="space-y-5">
        <p className="text-sm text-muted">Elige tu corriente y cuántos ciclos quieres nadar.</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {PATTERNS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPattern(p)}
              className="rounded-xl border border-card-border bg-ocean-surface/40 px-4 py-4 text-left transition-colors hover:border-oceom-turquoise/50"
            >
              <p className="font-display text-sm font-semibold text-foreground">{p.name}</p>
              <p className="mt-0.5 text-xs text-muted">{p.desc}</p>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">Ciclos:</span>
          {[3, 5, 7].map((n) => (
            <button
              key={n}
              onClick={() => setCycles(n)}
              className={cn(
                "size-9 rounded-full border text-sm font-medium transition-colors",
                cycles === n
                  ? "border-oceom-turquoise/60 bg-oceom-turquoise/15 text-oceom-turquoise"
                  : "border-card-border text-muted hover:text-foreground",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!running) {
    return (
      <div className="space-y-5 text-center">
        <p className="text-sm text-muted">
          {pattern.name} · {cycles} ciclos · deja que el orbe respire por ti.
        </p>
        <button
          onClick={() => setRunning(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-oceom-turquoise px-6 py-3 text-sm font-semibold text-[var(--ocean-abyss)] transition hover:brightness-110"
        >
          Comenzar a respirar
        </button>
      </div>
    );
  }

  const dur = pattern.steps[phase];
  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <p className="text-xs text-muted">
        Ciclo {cycle + 1} de {cycles}
      </p>

      <div className="relative grid size-56 place-items-center">
        {/* Ondas exteriores */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-full border border-oceom-turquoise/20 [animation:pulse-glow_5s_ease-in-out_infinite] motion-reduce:animate-none"
        />
        {/* Orbe que respira: escala sincronizada con la fase */}
        <div
          className="grid size-40 place-items-center rounded-full transition-transform ease-in-out motion-reduce:transition-none"
          style={{
            transform: `scale(${phase === 0 ? 1 : phase === 1 ? 1 : 0.55})`,
            transitionDuration: `${dur * 1000}ms`,
            background:
              "radial-gradient(circle at 42% 36%, rgba(190,250,255,0.9), rgba(45,212,191,0.65) 45%, rgba(13,148,136,0.35) 75%)",
            boxShadow: "0 0 70px -12px rgba(45,212,191,0.7)",
          }}
        >
          <span className="font-display text-xl font-semibold text-[var(--ocean-abyss)]">
            {PHASE_LABEL[phase]}
          </span>
        </div>
      </div>

      <p className="text-sm text-muted">
        {PHASE_LABEL[phase]} · {dur}s
      </p>
    </div>
  );
}
