"use client";

import { motion } from "motion/react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TravelerInsignia } from "@/config/journey";
import { JOURNEY_COLOR, BADGE_ICON } from "@/components/ruta/journey-style";

/** Galería de símbolos de evolución (insignias / cristales). */
export function BadgeGrid({ insignias }: { insignias: TravelerInsignia[] }) {
  const unlocked = insignias.filter((b) => b.unlocked).length;

  return (
    <section>
      <div className="mb-5 flex items-end justify-between">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Símbolos de evolución
        </h2>
        <span className="text-sm text-muted">
          {unlocked}/{insignias.length} despertados
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {insignias.map((b, i) => {
          const c = JOURNEY_COLOR[b.color];
          const Icon = BADGE_ICON[b.key];
          return (
            <motion.div
              key={b.key}
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              className={cn(
                "group relative flex flex-col items-center overflow-hidden rounded-2xl border p-5 text-center transition-colors",
                b.unlocked
                  ? "glass border-card-border"
                  : "border-white/5 bg-white/[0.02]",
              )}
            >
              {b.unlocked && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-8 left-1/2 size-24 -translate-x-1/2 rounded-full opacity-40 blur-2xl transition-opacity duration-500 group-hover:opacity-70"
                  style={{ background: `radial-gradient(circle, ${c.hex}55, transparent 70%)` }}
                />
              )}

              <div
                className={cn(
                  "relative grid size-14 place-items-center rounded-full ring-1 ring-inset transition-transform group-hover:scale-110",
                  b.unlocked ? cn(c.bg, c.ring, c.text) : "bg-white/[0.03] text-muted/40 ring-white/10",
                )}
              >
                <Icon className="size-7" />
                {!b.unlocked && (
                  <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-ocean-surface text-muted/70 ring-1 ring-card-border">
                    <Lock className="size-3" />
                  </span>
                )}
              </div>

              <p className={cn("relative mt-3 font-display text-sm font-semibold", b.unlocked ? "text-foreground" : "text-foreground/60")}>
                {b.name}
              </p>
              <p className={cn("relative mt-0.5 text-xs font-medium", b.unlocked ? c.text : "text-muted/50")}>
                {b.title}
              </p>
              <p className="relative mt-2 text-[0.7rem] leading-relaxed text-muted/70">
                {b.unlocked ? "Despertado ✓" : b.goal}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
