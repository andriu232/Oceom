import Link from "next/link";
import {
  Sparkles,
  Radio,
  Route,
  ArrowRight,
  CalendarClock,
  ClipboardList,
  Heart,
} from "lucide-react";
import { requireStudentArea } from "@/lib/auth";
import { getStudentRoute } from "@/lib/queries/route";
import { OceomEnergyOrb } from "@/components/brand/oceom-energy-orb";
import { OceomButton } from "@/components/ui/oceom-button";
import { OceomProgressBar } from "@/components/ui/oceom-progress";
import {
  PortalCard,
  OrbIcon,
  SectionLabel,
} from "@/components/ui/oceom-card";
import type { Accent } from "@/lib/accents";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Santuario · OCEOM" };

export default async function SantuarioPage() {
  const profile = await requireStudentArea();
  const firstName = (profile.full_name ?? "Viajero").split(" ")[0];
  const route = await getStudentRoute(profile.id);

  return (
    <div className="space-y-10 [animation:surface_0.7s_ease-out]">
      {/* ---------- Hero / portal del santuario ---------- */}
      <section
        className="relative overflow-hidden rounded-[26px] p-px"
        style={{ background: "linear-gradient(150deg, rgba(34,211,238,0.4), rgba(255,255,255,0.05) 36%, rgba(129,140,248,0.28))" }}
      >
        <div className="glass-strong relative overflow-hidden rounded-[25px] px-8 py-10 sm:px-10 sm:py-12">
          {/* Luz submarina interior */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{ background: "radial-gradient(80% 120% at 88% 0%, rgba(34,211,238,0.16), transparent 55%)" }}
          />
          <span aria-hidden className="grain pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay" />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
          />

          {/* Orbe oceánico flotante */}
          <OceomEnergyOrb className="pointer-events-none absolute -right-20 -top-24 w-64 opacity-45 sm:-right-4 sm:top-1/2 sm:w-[22rem] sm:-translate-y-1/2 sm:opacity-90 lg:w-[25rem]" />

          <div className="relative max-w-2xl">
            <SectionLabel>Tu Santuario</SectionLabel>
            <h1 className="mt-4 font-display text-3xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-[2.6rem]">
              Hola, {firstName}.{" "}
              <span className="bg-gradient-to-r from-ocean-foam via-ocean-glow to-ocean-cyan bg-clip-text text-transparent">
                ¿Qué dimensión de tu mundo interior quieres explorar hoy?
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-muted">
              Tu océano interior sigue despertando. Cada experiencia abre una nueva
              capa de consciencia, sanación y expansión.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <OceomButton href="/mi-ruta">
                Continuar mi ruta <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </OceomButton>
              <OceomButton href="/omi" variant="glass">
                <Sparkles className="size-4" /> Hablar con OMI
              </OceomButton>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Progreso + próxima experiencia ---------- */}
      <section className="grid gap-5 md:grid-cols-3">
        <ProgressCard
          percentage={route?.progressPct ?? 0}
          completed={route?.completedLessons ?? 0}
          total={route?.totalLessons ?? 0}
        />
        <RecommendationCard
          lesson={route?.currentLesson ?? null}
          programTitle={route?.program.title ?? null}
          done={!route?.currentLesson && !!route}
        />
        <NextSessionCard />
      </section>

      {/* ---------- Estado emocional + Deep Waves ---------- */}
      <section className="grid gap-5 md:grid-cols-2">
        <PortalCard accent="rose">
          <div className="flex items-start gap-4">
            <OrbIcon accent="rose">
              <Heart />
            </OrbIcon>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Estado emocional del día
                </h3>
                <span className="text-[0.7rem] uppercase tracking-wider text-muted/70">Check-in</span>
              </div>
              <p className="mt-1.5 text-sm text-muted">
                Antes de avanzar, vuelve a ti. ¿Cómo se mueve hoy tu océano interior?
              </p>
              <CardLink href="/bitacora" accent="rose">Hacer mi check-in</CardLink>
            </div>
          </div>
        </PortalCard>

        <PortalCard accent="violet">
          <div className="flex items-start gap-4">
            <OrbIcon accent="violet">
              <Radio />
            </OrbIcon>
            <div className="flex-1">
              <h3 className="font-display text-lg font-semibold text-foreground">Deep Waves</h3>
              <p className="mt-1.5 text-sm text-muted">
                Meditaciones, hipnosis y respiraciones para entrar en profundidad.
              </p>
              <CardLink href="/deep-waves" accent="violet">Entrar a Deep Waves</CardLink>
            </div>
          </div>
        </PortalCard>
      </section>
    </div>
  );
}

/* ---------- Enlace de card con acento ---------- */
function CardLink({
  href,
  accent,
  children,
}: {
  href: string;
  accent: Accent;
  children: React.ReactNode;
}) {
  const color = { cyan: "text-ocean-cyan", rose: "text-[#fb7185]", violet: "text-ocean-violet", magenta: "text-oceom-magenta", blue: "text-oceom-blue", gold: "text-oceom-gold", green: "text-oceom-green", turquoise: "text-oceom-turquoise" }[accent];
  return (
    <Link
      href={href}
      className={cn("group/l mt-5 inline-flex items-center gap-1.5 text-sm font-medium hover:underline", color)}
    >
      {children}
      <ArrowRight className="size-4 transition-transform group-hover/l:translate-x-0.5" />
    </Link>
  );
}

/* ---------- Cards de la fila de progreso ---------- */
function ProgressCard({
  percentage,
  completed,
  total,
}: {
  percentage: number;
  completed: number;
  total: number;
}) {
  return (
    <PortalCard accent="cyan">
      <div className="flex items-center gap-3">
        <OrbIcon accent="cyan">
          <Route />
        </OrbIcon>
        <div>
          <SectionLabel>Mi evolución</SectionLabel>
        </div>
      </div>
      <div className="mt-5 flex items-end gap-2">
        <span className="font-display text-[2.75rem] font-bold leading-none text-foreground">
          {percentage}%
        </span>
        <span className="mb-1 text-sm text-muted">completado</span>
      </div>
      <OceomProgressBar value={percentage} accent="cyan" className="mt-4" />
      <p className="mt-3 text-xs text-muted">
        {total > 0
          ? `Tu transformación toma forma experiencia por experiencia · ${completed}/${total}.`
          : "Tu transformación toma forma con tu primera experiencia."}
      </p>
    </PortalCard>
  );
}

function RecommendationCard({
  lesson,
  programTitle,
  done,
}: {
  lesson: { id: string; title: string } | null;
  programTitle: string | null;
  done: boolean;
}) {
  return (
    <PortalCard accent="magenta">
      <div className="flex items-center gap-3">
        <OrbIcon accent="magenta">
          <ClipboardList />
        </OrbIcon>
        <SectionLabel accent="magenta">Continúa tu viaje</SectionLabel>
      </div>
      {lesson ? (
        <>
          <p className="mt-5 font-display text-lg font-semibold leading-snug text-foreground">
            {lesson.title}
          </p>
          {programTitle && <p className="mt-1 text-sm text-muted">{programTitle}</p>}
          <CardLink href={`/experiencia/${lesson.id}`} accent="magenta">Continuar</CardLink>
        </>
      ) : (
        <>
          <p className="mt-5 font-display text-lg font-semibold text-foreground">
            {done ? "¡Ruta completada! 🌊" : "Aún no tienes programa activo"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {done ? "Has recorrido todo tu camino interior." : "Explora los programas disponibles."}
          </p>
          <CardLink href={done ? "/mi-evolucion" : "/academia"} accent="magenta">
            {done ? "Ver mi evolución" : "Explorar"}
          </CardLink>
        </>
      )}
    </PortalCard>
  );
}

function NextSessionCard() {
  return (
    <PortalCard accent="blue">
      <div className="flex items-center gap-3">
        <OrbIcon accent="blue">
          <CalendarClock />
        </OrbIcon>
        <SectionLabel accent="blue">Próximo Círculo en Vivo</SectionLabel>
      </div>
      <p className="mt-5 text-sm text-muted">
        Aún no tienes encuentros programados. Tu mentora abrirá aquí las próximas
        sesiones en vivo.
      </p>
      <CardLink href="/circulos" accent="blue">Ver Círculos</CardLink>
    </PortalCard>
  );
}
