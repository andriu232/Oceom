import * as React from "react";
import { cn } from "@/lib/utils";
import { ACCENT, type Accent } from "@/lib/accents";

/* ============================================================
   Primitivos visuales OCEOM: tarjetas-portal con profundidad,
   íconos en orbe, etiquetas de sección y badges. RSC-safe.
   ============================================================ */

/** Tarjeta con borde gradiente, glow interno, highlight superior y grano. */
export function PortalCard({
  accent = "cyan",
  interactive = true,
  className,
  children,
}: {
  accent?: Accent;
  interactive?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const a = ACCENT[accent];
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[22px] p-px transition-transform duration-300",
        interactive && "hover:-translate-y-1",
        className,
      )}
      style={{ background: `linear-gradient(150deg, ${a.hex}59, rgba(255,255,255,0.04) 38%, ${a.hex2}33)` }}
    >
      <div className="glass-strong relative h-full rounded-[21px] p-6">
        {/* Grano fino */}
        <span aria-hidden className="grain pointer-events-none absolute inset-0 rounded-[21px] opacity-[0.05] mix-blend-overlay" />
        {/* Highlight superior */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent"
        />
        {/* Glow de acento */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-12 size-44 rounded-full opacity-45 blur-3xl transition-opacity duration-500 group-hover:opacity-80"
          style={{ background: `radial-gradient(circle, ${a.hex}40, transparent 70%)` }}
        />
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}

/** Ícono dentro de un orbe luminoso con acento. */
export function OrbIcon({
  accent = "cyan",
  className,
  children,
}: {
  accent?: Accent;
  className?: string;
  children: React.ReactNode;
}) {
  const a = ACCENT[accent];
  return (
    <span
      className={cn("relative grid size-12 shrink-0 place-items-center rounded-2xl", className)}
      style={{
        background: `radial-gradient(circle at 34% 28%, ${a.hex2}3d, ${a.hex}24 58%, rgba(255,255,255,0.02))`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.22), inset 0 0 0 1px ${a.hex}40, 0 0 24px -10px ${a.hex}`,
      }}
    >
      <span className={cn("relative [&_svg]:size-5", a.text)}>{children}</span>
    </span>
  );
}

/** Etiqueta de sección: ceremonial, mayúsculas, con línea y punto de energía. */
export function SectionLabel({
  accent = "cyan",
  className,
  children,
}: {
  accent?: Accent;
  className?: string;
  children: React.ReactNode;
}) {
  const a = ACCENT[accent];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.3em]",
        className,
      )}
      style={{ color: a.hex }}
    >
      <span className="inline-block h-px w-6" style={{ background: `linear-gradient(90deg, transparent, ${a.hex})` }} />
      <span className="size-1.5 rounded-full" style={{ background: a.hex, boxShadow: `0 0 8px ${a.hex}` }} />
      {children}
    </span>
  );
}

/** Badge sutil con acento. */
export function OceomBadge({
  accent = "cyan",
  className,
  children,
}: {
  accent?: Accent;
  className?: string;
  children: React.ReactNode;
}) {
  const a = ACCENT[accent];
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[0.7rem] font-medium", className)}
      style={{ color: a.hex, background: `${a.hex}1a`, boxShadow: `inset 0 0 0 1px ${a.hex}33` }}
    >
      {children}
    </span>
  );
}
