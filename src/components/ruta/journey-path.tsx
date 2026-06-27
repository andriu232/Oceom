"use client";

import { motion } from "motion/react";
import {
  Waves,
  Shell,
  Orbit,
  Fish,
  Heart,
  Moon,
  Infinity as InfinityIcon,
  Lock,
  Check,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ETAPAS } from "@/config/journey";
import type { TravelerView } from "@/lib/queries/journey";
import { JOURNEY_COLOR } from "@/components/ruta/journey-style";

const SYMBOL_ICON: Record<string, LucideIcon> = {
  Ola: Waves,
  Concha: Shell,
  Espiral: Orbit,
  Ballena: Fish,
  Corazón: Heart,
  Luna: Moon,
  Infinito: InfinityIcon,
};

/** El sendero del viajero: las 7 etapas como una corriente vertical. */
export function JourneyPath({ traveler }: { traveler: TravelerView }) {
  return (
    <section>
      <h2 className="mb-5 font-display text-lg font-semibold text-foreground">
        El sendero
      </h2>

      <ol className="relative space-y-3">
        {ETAPAS.map((etapa, i) => {
          const c = JOURNEY_COLOR[etapa.color];
          const Icon = SYMBOL_ICON[etapa.symbol] ?? Waves;
          const state =
            i < traveler.etapaIndex
              ? "done"
              : i === traveler.etapaIndex
                ? "current"
                : "locked";
          const isLast = i === ETAPAS.length - 1;

          return (
            <motion.li
              key={etapa.key}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex gap-4"
            >
              {/* Columna del nodo + línea conectora */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  {state === "current" && (
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-2xl [animation:pulse-glow_3s_ease-in-out_infinite]"
                      style={{ boxShadow: `0 0 22px 2px ${c.hex}66` }}
                    />
                  )}
                  <div
                    className={cn(
                      "relative grid size-12 place-items-center rounded-2xl ring-1 ring-inset transition-colors",
                      state === "locked"
                        ? "bg-white/[0.03] text-muted/40 ring-white/10"
                        : cn(c.bg, c.ring, c.text),
                    )}
                  >
                    <Icon className="size-6" />
                  </div>
                </div>
                {!isLast && (
                  <div className="mt-1 w-px flex-1 bg-gradient-to-b from-white/15 to-transparent" />
                )}
              </div>

              {/* Contenido de la etapa */}
              <div
                className={cn(
                  "mb-2 flex-1 rounded-2xl border p-5 transition-colors",
                  state === "current"
                    ? "glass border-card-border"
                    : "border-transparent",
                  state === "locked" && "opacity-55",
                )}
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted/60">
                    Etapa {i + 1}
                  </span>
                  <h3 className={cn("font-display text-lg font-semibold", state === "locked" ? "text-foreground/70" : "text-foreground")}>
                    {etapa.name}
                  </h3>
                  {state === "done" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[0.65rem] font-medium text-success">
                      <Check className="size-3" /> Superada
                    </span>
                  )}
                  {state === "current" && (
                    <span className={cn("rounded-full px-2 py-0.5 text-[0.65rem] font-medium", c.bg, c.text)}>
                      Estás aquí
                    </span>
                  )}
                  {state === "locked" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[0.65rem] font-medium text-muted/60">
                      <Lock className="size-3" /> {etapa.threshold} OCEOM
                    </span>
                  )}
                </div>

                <p className={cn("mt-1.5 text-sm font-medium", c.text, state === "locked" && "opacity-60")}>
                  {etapa.tagline}
                </p>
                <p className="mt-1 text-sm text-muted">{etapa.description}</p>

                {/* Progreso hacia la siguiente etapa */}
                {state === "current" && traveler.nextEtapa && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">
                        Hacia {traveler.nextEtapa.name}
                      </span>
                      <span className="font-medium text-foreground">
                        {traveler.pointsToNext} OCEOM restantes
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${traveler.etapaPct}%` }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                        className={cn("h-full rounded-full bg-gradient-to-r to-white/80", c.bar)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.li>
          );
        })}
      </ol>
    </section>
  );
}
