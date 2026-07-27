"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Sparkles, Gem, Shell } from "lucide-react";
import { completeLabSessionAction, type LabReward } from "@/lib/actions/lab";

/* ============================================================
   Cartas de Telepatía (Mundo 2 · Intuición). Cinco figuras tipo Zener.
   En cada ronda hay una carta OCULTA con una figura al azar; el viajero
   siente cuál es y la elige, luego se revela. Al final compara su acierto
   con el azar (1 de 5 = 20%). Sin castigo: siempre suma al Viajero.
   ============================================================ */

const TOTAL = 5;
type SymKey = "circulo" | "estrella" | "espiral" | "ondas" | "cuadrado";

function Glyph({ k, className }: { k: SymKey; className?: string }) {
  const common = {
    viewBox: "0 0 64 64",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 3.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };
  switch (k) {
    case "circulo":
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="19" />
        </svg>
      );
    case "cuadrado":
      return (
        <svg {...common}>
          <rect x="14" y="14" width="36" height="36" rx="4" />
        </svg>
      );
    case "estrella":
      return (
        <svg {...common}>
          <path d="M32 7 l6.9 14 15.4 2.2 -11.1 10.9 2.6 15.3 -13.8 -7.2 -13.8 7.2 2.6 -15.3 -11.1 -10.9 15.4 -2.2 z" />
        </svg>
      );
    case "ondas":
      return (
        <svg {...common}>
          <path d="M11 24 q 5.25 -8 10.5 0 t 10.5 0 t 10.5 0" />
          <path d="M11 32 q 5.25 -8 10.5 0 t 10.5 0 t 10.5 0" />
          <path d="M11 40 q 5.25 -8 10.5 0 t 10.5 0 t 10.5 0" />
        </svg>
      );
    case "espiral":
      return (
        <svg {...common}>
          <path d="M32 32 q 3 -3 6 0 q 5 5 0 11 q -8 8 -18 0 q -11 -11 0 -23 q 14 -14 30 0" />
        </svg>
      );
  }
}

const SYMBOLS: { key: SymKey; label: string }[] = [
  { key: "circulo", label: "Círculo" },
  { key: "estrella", label: "Estrella" },
  { key: "espiral", label: "Espiral" },
  { key: "ondas", label: "Ondas" },
  { key: "cuadrado", label: "Cuadrado" },
];

function randomSym(): SymKey {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].key;
}

export function TelepatiaGame() {
  const [round, setRound] = useState(1);
  const [target, setTarget] = useState<SymKey>(() => randomSym());
  const [pick, setPick] = useState<SymKey | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [hits, setHits] = useState(0);
  const [done, setDone] = useState(false);
  const [reward, setReward] = useState<LabReward | null>(null);

  function choose(k: SymKey) {
    if (revealed) return;
    setPick(k);
    setRevealed(true);
    const hit = k === target;
    if (hit) setHits((h) => h + 1);
    setTimeout(() => {
      if (round < TOTAL) {
        setRound((r) => r + 1);
        setTarget(randomSym());
        setPick(null);
        setRevealed(false);
      } else {
        void finish(hits + (hit ? 1 : 0));
      }
    }, 1700);
  }

  async function finish(finalHits: number) {
    setDone(true);
    const r = await completeLabSessionAction("telepatia", {
      aciertos: finalHits,
      rondas: TOTAL,
    });
    setReward(r);
  }

  function again() {
    setRound(1);
    setTarget(randomSym());
    setPick(null);
    setRevealed(false);
    setHits(0);
    setDone(false);
    setReward(null);
  }

  // ── Resultados ──
  if (done) {
    const pct = Math.round((hits / TOTAL) * 100);
    const beatChance = hits > TOTAL * 0.2;
    const msg =
      hits === TOTAL
        ? "Sintonía extraordinaria. El velo se volvió transparente."
        : beatChance
          ? "Superaste al azar: algo en ti percibió más allá de la vista."
          : hits === 0
            ? "Hoy el velo estuvo denso. La percepción también se entrena descansando el intento."
            : "En el rango del azar. Sigue: la intuición se afina con la práctica y la calma.";
    return (
      <div className="space-y-6 text-center">
        <div>
          <p className="font-display text-5xl font-bold text-foreground">
            {hits}
            <span className="text-2xl text-muted">/{TOTAL}</span>
          </p>
          <p className="mt-1 text-sm text-muted">
            {pct}% de acierto · el azar es 20%
          </p>
        </div>
        <p className="mx-auto max-w-md rounded-2xl border border-ocean-violet/25 bg-ocean-violet/5 px-5 py-4 text-sm leading-relaxed text-foreground/90">
          {msg}
        </p>

        {reward?.ok && (
          <div className="mx-auto flex max-w-sm items-center justify-center gap-5 rounded-2xl border border-card-border bg-ocean-surface/40 px-5 py-4 text-sm">
            <span className="inline-flex items-center gap-1.5 text-ocean-cyan">
              <Sparkles className="size-4" /> +{reward.xpEarned} XP
            </span>
            {!!reward.crystalsEarned && (
              <span className="inline-flex items-center gap-1.5 text-ocean-violet">
                <Gem className="size-4" /> +{reward.crystalsEarned}
              </span>
            )}
            {!!reward.pearlsEarned && (
              <span className="inline-flex items-center gap-1.5 text-oceom-gold">
                <Shell className="size-4" /> +{reward.pearlsEarned}
              </span>
            )}
          </div>
        )}
        {reward?.levelUp && (
          <p className="text-sm font-medium text-ocean-glow">
            ¡Subiste a {reward.levelName}! 🌊
          </p>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={again}
            className="inline-flex items-center gap-2 rounded-xl bg-ocean-cyan px-5 py-2.5 text-sm font-semibold text-[var(--ocean-abyss)] transition hover:brightness-110"
          >
            <RotateCcw className="size-4" /> Jugar de nuevo
          </button>
          <Link
            href="/lab"
            className="inline-flex items-center gap-2 rounded-xl border border-card-border px-5 py-2.5 text-sm text-muted transition hover:text-foreground"
          >
            Volver al LAB
          </Link>
        </div>
      </div>
    );
  }

  // ── Juego ──
  return (
    <div className="space-y-7">
      <p className="text-center text-xs text-muted">
        Carta {round} de {TOTAL} · Respira, cierra los ojos un segundo y{" "}
        <span className="text-ocean-violet">siente</span> qué figura está oculta.
      </p>

      {/* Carta central */}
      <div className="flex justify-center">
        <div
          className={
            "grid size-40 place-items-center rounded-3xl border transition-all duration-500 " +
            (revealed
              ? pick === target
                ? "border-ocean-glow/60 bg-ocean-glow/10 text-ocean-glow"
                : "border-danger/40 bg-danger/5 text-foreground"
              : "border-ocean-violet/30 bg-gradient-to-br from-ocean-violet/15 to-ocean-cyan/10 text-ocean-violet/40")
          }
        >
          {revealed ? (
            <Glyph k={target} className="size-20 [animation:omi-msg-in_0.35s_ease_both]" />
          ) : (
            <Sparkles className="size-10 animate-pulse" />
          )}
        </div>
      </div>

      {revealed ? (
        <p className="text-center text-sm font-medium">
          {pick === target ? (
            <span className="text-ocean-glow">✓ Acertaste — era {labelOf(target)}.</span>
          ) : (
            <span className="text-muted">
              Era <span className="text-foreground">{labelOf(target)}</span>. Elegiste{" "}
              {pick ? labelOf(pick) : "—"}.
            </span>
          )}
        </p>
      ) : (
        <p className="text-center text-sm text-muted">¿Qué figura sientes?</p>
      )}

      {/* Baraja de figuras */}
      <div className="mx-auto grid max-w-xl grid-cols-5 gap-2 sm:gap-3">
        {SYMBOLS.map((s) => {
          const isTarget = revealed && s.key === target;
          const isPick = revealed && s.key === pick;
          return (
            <button
              key={s.key}
              onClick={() => choose(s.key)}
              disabled={revealed}
              aria-label={s.label}
              className={
                "flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border p-2 transition-all disabled:cursor-default " +
                (isTarget
                  ? "border-ocean-glow/60 bg-ocean-glow/10 text-ocean-glow"
                  : isPick
                    ? "border-danger/50 bg-danger/10 text-foreground"
                    : "border-card-border bg-ocean-surface/40 text-foreground/80 hover:-translate-y-0.5 hover:border-ocean-violet/50 hover:bg-ocean-violet/10 hover:text-ocean-violet")
              }
            >
              <Glyph k={s.key} className="size-8" />
              <span className="text-[0.6rem] text-muted">{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function labelOf(k: SymKey): string {
  return SYMBOLS.find((s) => s.key === k)?.label ?? k;
}
