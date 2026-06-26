"use client";

import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

/** Hero "centro de mando" del Panel: glass profundo, orbe de energía,
 *  línea de luz con barrido y entrada cinematográfica. */
export function PanelHero({
  name,
  roleLabel,
  chips,
}: {
  name: string;
  roleLabel: string;
  chips: string[];
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="glass-strong relative overflow-hidden rounded-3xl p-8 sm:p-10"
    >
      {/* Orbe de energía decorativo */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-28 size-96 rounded-full blur-[90px]"
        style={{
          background:
            "radial-gradient(circle at 40% 40%, rgba(94,234,212,0.5) 0%, rgba(34,211,238,0.25) 40%, transparent 72%)",
        }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0.95, 0.6] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Halo en giro lento */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-40 size-[34rem] rounded-full opacity-20 blur-2xl [animation:spin-slow_40s_linear_infinite]"
        style={{
          background:
            "conic-gradient(from 0deg, transparent, rgba(34,211,238,0.35), transparent 60%)",
        }}
      />

      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-ocean-cyan/30 bg-ocean-cyan/10 px-3 py-1">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-ocean-glow opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-ocean-glow" />
          </span>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-ocean-cyan">
            Panel de mentoría · {roleLabel}
          </span>
        </div>

        <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Hola,{" "}
          <span className="bg-gradient-to-r from-ocean-glow via-ocean-cyan to-ocean-violet bg-clip-text text-transparent">
            {name}
          </span>
        </h1>
        <p className="mt-4 flex items-center gap-2 text-muted">
          <Sparkles className="size-4 text-ocean-cyan" />
          Guía el océano interior de cada estudiante: contenido, procesos, sesiones y acompañamiento.
        </p>

        {chips.length > 0 && (
          <div className="mt-7 flex flex-wrap gap-2.5">
            {chips.map((c, i) => (
              <motion.span
                key={c}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className="rounded-full border border-card-border bg-ocean-surface/50 px-4 py-1.5 text-sm text-foreground/80"
              >
                {c}
              </motion.span>
            ))}
          </div>
        )}

        {/* Línea de luz inferior */}
        <div className="shimmer-line mt-8 h-px w-full rounded-full" />
      </div>
    </motion.section>
  );
}
