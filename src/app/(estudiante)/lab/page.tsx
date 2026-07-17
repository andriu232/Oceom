import Link from "next/link";
import { FlaskConical, Sparkles, Gem, Shell, Lock, Play } from "lucide-react";
import { requireStudentArea, isMentor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LAB_WORLDS, travelerForXp } from "@/config/lab";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "OCEOM LAB · OCEOM" };

export default async function LabPage() {
  const profile = await requireStudentArea();
  const supabase = await createClient();
  const { data: prog } = await supabase
    .from("lab_progress")
    .select("xp, crystals, pearls, sessions_count")
    .eq("user_id", profile.id)
    .maybeSingle();

  const xp = prog?.xp ?? 0;
  const traveler = travelerForXp(xp);
  const firstName = (profile.full_name ?? "Viajero").split(" ")[0];
  // La mentora/admin puede probar los juegos en beta; el estudiante los ve "Pronto".
  const mentora = isMentor(profile.role);

  return (
    <div className="space-y-8">
      {/* Portada del LAB */}
      <section className="glass relative overflow-hidden rounded-2xl p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(45,212,191,0.3), transparent 70%)" }}
        />
        <div className="relative">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-oceom-turquoise">
            <FlaskConical className="size-4" /> OCEOM LAB
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground">
            Laboratorio de Percepción y Expansión de la Consciencia
          </h1>
          <p className="mt-2 max-w-2xl text-muted">
            {firstName}, cada entrenamiento es una inmersión en tu océano interior:
            atención, intuición, concentración y calma — jugando.
          </p>

          {/* Tarjeta del Viajero */}
          <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto]">
            <div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-display text-xl font-bold text-ocean-cyan">
                  {traveler.level.name}
                </span>
                <span className="text-sm text-muted">Nivel {traveler.level.n} de 7 · {xp} XP</span>
              </div>
              <div className="mt-2 h-2.5 max-w-md overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-ocean-glow to-ocean-cyan"
                  style={{ width: `${traveler.pct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted/70">
                {traveler.next
                  ? `Energía oceánica al ${traveler.pct}% · siguiente nivel: ${traveler.next.name} (${traveler.next.minXp} XP)`
                  : "Has alcanzado la máxima profundidad."}
              </p>
            </div>
            <div className="flex items-center gap-4 text-center">
              <div>
                <Gem className="mx-auto size-5 text-ocean-violet" />
                <p className="mt-1 font-display text-lg font-bold text-foreground">
                  {prog?.crystals ?? 0}
                </p>
                <p className="text-[0.65rem] text-muted">Cristales</p>
              </div>
              <div>
                <Shell className="mx-auto size-5 text-oceom-turquoise" />
                <p className="mt-1 font-display text-lg font-bold text-foreground">
                  {prog?.pearls ?? 0}
                </p>
                <p className="text-[0.65rem] text-muted">Perlas</p>
              </div>
              <div>
                <Sparkles className="mx-auto size-5 text-ocean-cyan" />
                <p className="mt-1 font-display text-lg font-bold text-foreground">
                  {prog?.sessions_count ?? 0}
                </p>
                <p className="text-[0.65rem] text-muted">Inmersiones</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mapa de mundos */}
      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Los mundos del océano
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {LAB_WORLDS.map((w) => (
            <div key={w.key} id={`mundo-${w.n}`} className="glass scroll-mt-24 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-xl font-display text-sm font-bold ring-1 ring-inset",
                    w.accent,
                  )}
                >
                  {w.n}
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-base font-semibold leading-snug text-foreground">
                    {w.name}
                  </h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">{w.objetivo}</p>
                </div>
              </div>

              <ul className="mt-4 space-y-2">
                {w.games.map((g) =>
                  g.href && (!g.beta || mentora) ? (
                    <li key={g.key}>
                      <Link
                        href={g.href}
                        className="group flex items-center gap-3 rounded-xl border border-card-border bg-ocean-surface/35 px-3.5 py-2.5 transition-colors hover:border-ocean-cyan/40"
                      >
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ocean-cyan/15 text-ocean-cyan">
                          <Play className="size-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-foreground group-hover:text-ocean-cyan">
                            {g.name}
                          </span>
                          <span className="block truncate text-xs text-muted">{g.desc}</span>
                        </span>
                        {g.beta && (
                          <span className="shrink-0 rounded-full bg-oceom-gold/15 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-oceom-gold">
                            Beta
                          </span>
                        )}
                      </Link>
                    </li>
                  ) : (
                    <li
                      key={g.key}
                      className="flex items-center gap-3 rounded-xl border border-dashed border-card-border/70 px-3.5 py-2.5 opacity-60"
                    >
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/5 text-muted">
                        <Lock className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-foreground/70">{g.name}</span>
                        <span className="block truncate text-xs text-muted/70">{g.desc}</span>
                      </span>
                      <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-muted">
                        Pronto
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
