import Link from "next/link";
import {
  Waves,
  Shell,
  Orbit,
  Fish,
  Heart,
  Moon,
  Infinity as InfinityIcon,
  Compass,
  Gem,
  Sparkles,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { requireStudentArea } from "@/lib/auth";
import { getTravelerState } from "@/lib/queries/journey";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { GlowOrb } from "@/components/brand/glow-orb";
import { buttonVariants } from "@/components/ui/button";
import { JourneyPath } from "@/components/ruta/journey-path";
import { BadgeGrid } from "@/components/ruta/badge-grid";
import { JOURNEY_COLOR } from "@/components/ruta/journey-style";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ruta del Viajero · OCEOM" };

const SYMBOL_ICON: Record<string, LucideIcon> = {
  Ola: Waves,
  Concha: Shell,
  Espiral: Orbit,
  Ballena: Fish,
  Corazón: Heart,
  Luna: Moon,
  Infinito: InfinityIcon,
};

export default async function RutaViajeroPage() {
  const profile = await requireStudentArea();
  const traveler = await getTravelerState(profile.id);

  if (!traveler) {
    return (
      <div>
        <PageHeader
          title="Ruta del Viajero"
          subtitle="Tu travesía por el océano interior, paso a paso."
        />
        <EmptyState
          icon={Compass}
          title="Tu travesía aún no comienza"
          description="Cuando tu mentora abra tu acceso a un programa, tu viaje del viajero cobrará vida: ganarás puntos OCEOM, avanzarás de etapa y despertarás tus símbolos de evolución."
        >
          <Link href="/academia" className={buttonVariants({})}>
            Explorar programas
          </Link>
        </EmptyState>
      </div>
    );
  }

  const c = JOURNEY_COLOR[traveler.etapa.color];
  const HeroIcon = SYMBOL_ICON[traveler.etapa.symbol] ?? Waves;

  const stats = [
    { label: "Puntos OCEOM", value: traveler.points.toLocaleString("es-CO"), icon: Sparkles },
    { label: "Etapa", value: `${traveler.etapaIndex + 1}/7`, icon: Layers },
    { label: "Cristales", value: `${traveler.cristales}/${traveler.insignias.length}`, icon: Gem },
  ];

  return (
    <div className="space-y-10">
      <PageHeader
        title="Ruta del Viajero"
        subtitle={`Tu travesía a través de ${traveler.programTitle}.`}
      />

      {/* Hero del viajero */}
      <section className="glass-strong relative overflow-hidden rounded-3xl p-8">
        <GlowOrb className="absolute -right-20 -top-16 size-72" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{ background: `radial-gradient(circle at 12% 0%, ${c.hex}22, transparent 55%)` }}
        />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center">
          {/* Símbolo de etapa */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <span
                aria-hidden
                className="absolute inset-0 rounded-3xl [animation:breathe_6s_ease-in-out_infinite]"
                style={{ boxShadow: `0 0 40px 4px ${c.hex}55` }}
              />
              <div className={cn("relative grid size-20 place-items-center rounded-3xl ring-1 ring-inset", c.bg, c.ring, c.text)}>
                <HeroIcon className="size-10" />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted/60">
                Nivel {traveler.level} · {traveler.etapa.symbol}
              </p>
              <h2 className="mt-1 font-display text-3xl font-bold text-foreground">
                {traveler.etapa.name}
              </h2>
              <p className={cn("mt-1 text-sm font-medium", c.text)}>
                {traveler.etapa.tagline}
              </p>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid flex-1 grid-cols-3 gap-3">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="rounded-2xl border border-card-border bg-ocean-surface/40 p-4 text-center"
                >
                  <Icon className="mx-auto size-5 text-ocean-cyan/80" />
                  <p className="mt-2 font-display text-2xl font-bold text-foreground">
                    {s.value}
                  </p>
                  <p className="text-[0.7rem] uppercase tracking-wide text-muted/70">
                    {s.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Barra hacia la siguiente etapa */}
        <div className="relative mt-8">
          {traveler.nextEtapa ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">
                  Próxima etapa:{" "}
                  <span className="font-medium text-foreground">
                    {traveler.nextEtapa.name}
                  </span>
                </span>
                <span className="font-medium text-foreground">
                  {traveler.pointsToNext} OCEOM restantes
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className={cn("h-full rounded-full bg-gradient-to-r to-ocean-cyan transition-all", c.bar)}
                  style={{ width: `${traveler.etapaPct}%` }}
                />
              </div>
            </>
          ) : (
            <p className="inline-flex items-center gap-2 rounded-xl bg-oceom-gold/10 px-4 py-2 text-sm text-oceom-gold">
              <InfinityIcon className="size-4" /> Has alcanzado el Océano Infinito. Eres uno con el todo. 🌊
            </p>
          )}
        </div>
      </section>

      {/* Sendero de etapas */}
      <JourneyPath traveler={traveler} />

      {/* Símbolos de evolución */}
      <BadgeGrid insignias={traveler.insignias} />

      <p className="text-center text-sm text-muted/60">
        Cada experiencia, check-in y entrada de tu bitácora suma puntos OCEOM y
        acerca tu próxima evolución.
      </p>
    </div>
  );
}
