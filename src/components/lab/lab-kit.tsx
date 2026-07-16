"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Gem, Loader2, RotateCcw, Sparkles, Shell } from "lucide-react";
import { completeLabSessionAction, type LabReward } from "@/lib/actions/lab";
import { cn } from "@/lib/utils";

/* ============================================================
   Kit compartido de OCEOM LAB: cada juego se envuelve en <LabShell>,
   que maneja las tres fases del viaje — inmersión (narrativa) → juego →
   recompensa (XP/cristales/perlas + nivel del Viajero + reflexión).
   ============================================================ */

export function LabShell({
  gameKey,
  title,
  world,
  narrative,
  children,
}: {
  gameKey: string;
  title: string;
  world: string;
  narrative: string;
  /** El juego. Llama a `finish(metrics, reflexion)` al terminar. */
  children: (
    finish: (metrics: Record<string, unknown>, reflexion?: string) => void,
  ) => React.ReactNode;
}) {
  const [phase, setPhase] = useState<"intro" | "playing" | "saving" | "result">("intro");
  const [reward, setReward] = useState<LabReward | null>(null);
  const [reflexion, setReflexion] = useState<string | null>(null);
  const [playKey, setPlayKey] = useState(0);

  async function finish(metrics: Record<string, unknown>, refl?: string) {
    setPhase("saving");
    setReflexion(refl ?? null);
    const res = await completeLabSessionAction(gameKey, metrics);
    setReward(res);
    setPhase("result");
  }

  const again = () => {
    setReward(null);
    setReflexion(null);
    setPlayKey((k) => k + 1);
    setPhase("intro");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/lab"
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ocean-cyan"
      >
        <ArrowLeft className="size-4" /> OCEOM LAB
      </Link>

      <div className="glass relative overflow-hidden rounded-2xl p-6 sm:p-8">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-ocean-cyan/80">
          {world}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-foreground">{title}</h1>

        {phase === "intro" && (
          <div className="mt-6 space-y-6">
            <p className="max-w-lg text-[0.98rem] leading-relaxed text-foreground/80">
              {narrative}
            </p>
            <button
              onClick={() => setPhase("playing")}
              className="inline-flex items-center gap-2 rounded-xl bg-ocean-cyan px-6 py-3 text-sm font-semibold text-[var(--ocean-abyss)] transition hover:brightness-110"
            >
              Sumergirme <Sparkles className="size-4" />
            </button>
          </div>
        )}

        {phase === "playing" && <div key={playKey} className="mt-6">{children(finish)}</div>}

        {phase === "saving" && (
          <div className="mt-10 flex flex-col items-center gap-3 pb-6">
            <Loader2 className="size-7 animate-spin text-ocean-cyan" />
            <p className="text-sm text-muted">El océano registra tu viaje…</p>
          </div>
        )}

        {phase === "result" && reward && (
          <div className="mt-6">
            {reward.error ? (
              <p className="text-sm text-danger">{reward.error}</p>
            ) : (
              <LabResult reward={reward} reflexion={reflexion} onAgain={again} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LabResult({
  reward,
  reflexion,
  onAgain,
}: {
  reward: LabReward;
  reflexion: string | null;
  onAgain: () => void;
}) {
  return (
    <div className="space-y-5">
      {reward.levelUp && (
        <div className="rounded-xl border border-oceom-gold/40 bg-oceom-gold/10 px-4 py-3 text-center">
          <p className="font-display text-lg font-bold text-oceom-gold">
            Nuevo nivel: {reward.levelName}
          </p>
          <p className="text-xs text-foreground/70">Tu océano interior se expande.</p>
        </div>
      )}

      {/* Recompensas */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <RewardTile icon={Sparkles} value={`+${reward.xpEarned}`} label="XP" tone="text-ocean-cyan" />
        <RewardTile icon={Gem} value={`+${reward.crystalsEarned}`} label="Cristales" tone="text-ocean-violet" />
        <RewardTile icon={Shell} value={`+${reward.pearlsEarned}`} label="Perlas" tone="text-oceom-turquoise" />
      </div>

      {/* Nivel */}
      <div>
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-medium text-foreground">
            {reward.levelName} · {reward.totalXp} XP
          </span>
          <span className="text-muted">
            {reward.nextLevel ? `Siguiente: ${reward.nextLevel}` : "Nivel máximo"}
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-ocean-glow to-ocean-cyan transition-[width] duration-700"
            style={{ width: `${reward.pct ?? 0}%` }}
          />
        </div>
      </div>

      {reflexion && (
        <p className="rounded-xl border border-card-border bg-ocean-surface/40 px-4 py-3 text-sm leading-relaxed text-foreground/80">
          {reflexion}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={onAgain}
          className="inline-flex items-center gap-2 rounded-xl bg-ocean-cyan px-4 py-2.5 text-sm font-semibold text-[var(--ocean-abyss)] transition hover:brightness-110"
        >
          <RotateCcw className="size-4" /> Entrenar de nuevo
        </button>
        <Link
          href="/omi"
          className="inline-flex items-center gap-2 rounded-xl border border-ocean-violet/40 bg-ocean-violet/10 px-4 py-2.5 text-sm font-medium text-ocean-violet transition hover:bg-ocean-violet/20"
        >
          Reflexionar con OMI
        </Link>
        <Link
          href="/lab"
          className="inline-flex items-center gap-2 rounded-xl border border-card-border px-4 py-2.5 text-sm text-muted transition hover:text-foreground"
        >
          Volver al LAB
        </Link>
      </div>
    </div>
  );
}

function RewardTile({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: typeof Sparkles;
  value: string;
  label: string;
  tone: string;
}) {
  return (
    <div className="glass rounded-xl px-3 py-4">
      <Icon className={cn("mx-auto size-5", tone)} />
      <p className="mt-2 font-display text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
