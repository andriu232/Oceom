"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Search,
  X,
  ArrowRight,
  Check,
  Heart,
  Compass,
  Users,
  Activity,
  Palette,
  Sparkles,
  Brain,
  Gem,
  AudioLines,
  GraduationCap,
  Hammer,
  Waves,
  Flame,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CATEGORIES,
  KINDS,
  CURATED,
  type CategoryKey,
  type ExploreKind,
  type ExploreItem,
  type ExploreColor,
} from "@/config/explore";

const COLOR: Record<ExploreColor, { text: string; bg: string; ring: string; grad: string; hex: string }> = {
  turquoise: { text: "text-oceom-turquoise", bg: "bg-oceom-turquoise/12", ring: "ring-oceom-turquoise/30", grad: "from-oceom-turquoise/25", hex: "#2dd4bf" },
  green: { text: "text-oceom-green", bg: "bg-oceom-green/12", ring: "ring-oceom-green/30", grad: "from-oceom-green/25", hex: "#34d399" },
  cyan: { text: "text-ocean-cyan", bg: "bg-ocean-cyan/12", ring: "ring-ocean-cyan/30", grad: "from-ocean-cyan/25", hex: "#22d3ee" },
  blue: { text: "text-oceom-blue", bg: "bg-oceom-blue/12", ring: "ring-oceom-blue/30", grad: "from-oceom-blue/25", hex: "#38bdf8" },
  violet: { text: "text-ocean-violet", bg: "bg-ocean-violet/12", ring: "ring-ocean-violet/30", grad: "from-ocean-violet/25", hex: "#818cf8" },
  magenta: { text: "text-oceom-magenta", bg: "bg-oceom-magenta/12", ring: "ring-oceom-magenta/30", grad: "from-oceom-magenta/25", hex: "#e879f9" },
  gold: { text: "text-oceom-gold", bg: "bg-oceom-gold/12", ring: "ring-oceom-gold/30", grad: "from-oceom-gold/25", hex: "#f5c451" },
};

const CATEGORY_ICON: Record<CategoryKey, LucideIcon> = {
  bienestar: Heart,
  conciencia: Compass,
  relaciones: Users,
  cuerpo: Activity,
  creatividad: Palette,
  espiritualidad: Sparkles,
  mentalidad: Brain,
  finanzas: Gem,
};

const KIND_ICON: Record<ExploreKind, LucideIcon> = {
  Meditaciones: AudioLines,
  Cursos: GraduationCap,
  Talleres: Hammer,
  Experiencias: Waves,
  Retos: Flame,
  Comunidad: Users,
};

export function ExploreClient({ programs }: { programs: ExploreItem[] }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<ExploreKind | "Todo">("Todo");
  const [category, setCategory] = useState<CategoryKey | null>(null);

  const all = useMemo(() => [...programs, ...CURATED], [programs]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((it) => {
      if (kind !== "Todo" && it.kind !== kind) return false;
      if (category && it.category !== category) return false;
      if (q && !`${it.title} ${it.blurb}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [all, query, kind, category]);

  const activeCat = category ? CATEGORIES.find((c) => c.key === category) : null;

  return (
    <div className="space-y-10">
      {/* Buscador */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted/60" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="¿Qué deseas explorar hoy?"
          className="w-full rounded-2xl border border-card-border bg-ocean-surface/40 py-3.5 pl-12 pr-11 text-sm text-foreground placeholder:text-muted/60 outline-none transition-colors focus:border-ocean-cyan/40"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-white/5 hover:text-foreground"
            aria-label="Limpiar"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Filtros por tipo */}
      <div className="-mt-4 flex flex-wrap gap-2">
        {(["Todo", ...KINDS] as const).map((k) => {
          const active = kind === k;
          return (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-ocean-cyan/40 bg-ocean-cyan/12 text-ocean-cyan"
                  : "border-card-border text-muted hover:border-white/20 hover:text-foreground",
              )}
            >
              {k}
            </button>
          );
        })}
      </div>

      {/* Categorías */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Categorías
          </h2>
          {category && (
            <button
              onClick={() => setCategory(null)}
              className="inline-flex items-center gap-1 text-xs font-medium text-ocean-cyan hover:underline"
            >
              <X className="size-3.5" /> Quitar filtro
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map((cat) => {
            const c = COLOR[cat.color];
            const Icon = CATEGORY_ICON[cat.key];
            const active = category === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setCategory(active ? null : cat.key)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border p-4 text-left transition-colors",
                  active ? cn(c.bg, c.ring, "ring-1") : "border-card-border bg-ocean-surface/30 hover:border-white/20",
                )}
              >
                <div
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute -right-6 -top-6 size-20 rounded-full bg-gradient-to-br to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100",
                    c.grad,
                    active && "opacity-100",
                  )}
                />
                <div className={cn("relative grid size-10 place-items-center rounded-xl ring-1 ring-inset", c.bg, c.ring, c.text)}>
                  <Icon className="size-5" />
                </div>
                <p className="relative mt-3 text-sm font-semibold text-foreground">
                  {cat.label}
                </p>
                <p className="relative mt-0.5 text-xs text-muted">{cat.blurb}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Experiencias */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {activeCat ? activeCat.label : kind !== "Todo" ? kind : "Experiencias para ti"}
          </h2>
          <span className="text-sm text-muted">{items.length} resultados</span>
        </div>

        {items.length === 0 ? (
          <div className="glass rounded-2xl px-6 py-16 text-center">
            <p className="text-sm text-muted">
              No encontramos experiencias con ese filtro. Prueba con otra categoría o tipo.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((it, i) => (
              <ExperienceCard key={it.id} item={it} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ExperienceCard({ item, index }: { item: ExploreItem; index: number }) {
  const c = COLOR[item.color];
  const KindIcon = KIND_ICON[item.kind];
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
    >
      <Link
        href={item.href}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-card-border bg-ocean-surface/40 transition-colors hover:border-white/20"
      >
        {/* Franja superior con gradiente de color */}
        <div className="relative h-24 overflow-hidden">
          <div className={cn("absolute inset-0 bg-gradient-to-br to-transparent", c.grad)} />
          <div
            aria-hidden
            className="absolute -right-6 -top-8 size-28 rounded-full opacity-60 blur-2xl"
            style={{ background: `radial-gradient(circle, ${c.hex}55, transparent 70%)` }}
          />
          <div className={cn("absolute left-4 top-4 grid size-11 place-items-center rounded-xl ring-1 ring-inset backdrop-blur-sm", c.bg, c.ring, c.text)}>
            <KindIcon className="size-5" />
          </div>
          <span className="absolute right-3 top-3 rounded-full bg-black/30 px-2.5 py-1 text-[0.65rem] font-medium text-foreground/90 backdrop-blur-sm">
            {item.kind}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="font-display text-base font-semibold leading-snug text-foreground">
            {item.title}
          </h3>
          <p className="mt-1.5 flex-1 text-sm text-muted">{item.blurb}</p>

          <div className="mt-4 flex items-center justify-between">
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", c.bg, c.text)}>
              {item.meta}
            </span>
            {item.status === "live" ? (
              item.enrolled ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                  <Check className="size-3.5" /> Inscrito
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-ocean-cyan transition-transform group-hover:translate-x-0.5">
                  Ver <ArrowRight className="size-3.5" />
                </span>
              )
            ) : (
              <span className="text-xs font-medium text-muted/70">Próximamente</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
