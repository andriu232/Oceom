"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, CheckCircle2, Waves, Brain } from "lucide-react";

export interface ProgramSummary {
  title: string;
  subtitle: string | null;
  type: string;
  lessons: number;
  href: string;
}

const NEXT_STEPS = [
  "Crea y publica las experiencias de cada programa (Sprint 2–3).",
  "Inscribe a tus estudiantes y abre sus accesos (Sprint 6).",
  "Programa tus Círculos en Vivo (Sprint 7).",
  "Alimenta a AURA con tus fuentes autorizadas (Sprint 9).",
];

const fade = {
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
};

/** Bloques inferiores del Panel: próximos pasos + programas base. */
export function PanelBlocks({ programs }: { programs: ProgramSummary[] }) {
  return (
    <section className="grid gap-5 lg:grid-cols-5">
      {/* Próximos pasos */}
      <motion.div
        {...fade}
        transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="glass rounded-2xl p-6 lg:col-span-2"
      >
        <h3 className="font-display text-lg font-semibold text-foreground">
          Próximos pasos
        </h3>
        <ul className="mt-5 space-y-3">
          {NEXT_STEPS.map((step, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              className="flex items-start gap-3 rounded-xl px-2 py-1.5 text-sm text-muted transition-colors hover:bg-white/5"
            >
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ocean-cyan/70" />
              <span>{step}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Programas base */}
      <motion.div
        {...fade}
        transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="glass rounded-2xl p-6 lg:col-span-3"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-foreground">
            Programas base
          </h3>
          <Link
            href="/programas"
            className="inline-flex items-center gap-1 text-sm font-medium text-ocean-cyan hover:underline"
          >
            Ver todos <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {programs.map((p, i) => {
            const Icon = p.type === "neuropsychic" ? Brain : Waves;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + i * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Link
                  href={p.href}
                  className="group relative block overflow-hidden rounded-xl border border-card-border bg-ocean-surface/40 p-5 transition-colors hover:border-ocean-cyan/40"
                >
                  <div
                    className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                    style={{ background: "radial-gradient(circle, rgba(34,211,238,0.4), transparent 70%)" }}
                  />
                  <div className="relative">
                    <div className="grid size-10 place-items-center rounded-xl bg-ocean-cyan/12 text-ocean-cyan ring-1 ring-inset ring-ocean-cyan/20">
                      <Icon className="size-5" />
                    </div>
                    <p className="mt-4 font-medium leading-snug text-foreground">
                      {p.title}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {p.lessons} experiencias
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
          {programs.length === 0 && (
            <p className="text-sm text-muted">Aún no hay programas.</p>
          )}
        </div>
      </motion.div>
    </section>
  );
}
