import Link from "next/link";
import {
  Sparkles,
  Radio,
  Route,
  ArrowRight,
  CalendarClock,
  ClipboardList,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getStudentRoute } from "@/lib/queries/route";
import { Card, CardTitle } from "@/components/ui/card";
import { GlowOrb } from "@/components/brand/glow-orb";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Santuario · OCEOM" };

export default async function SantuarioPage() {
  const profile = await requireRole("student");
  const firstName = (profile.full_name ?? "Viajero").split(" ")[0];
  const route = await getStudentRoute(profile.id);

  return (
    <div className="space-y-8">
      {/* Hero de bienvenida */}
      <section className="glass relative overflow-hidden rounded-2xl p-8">
        <GlowOrb className="absolute -right-16 -top-10 size-64" />
        <div className="relative">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-ocean-cyan">
            Tu santuario
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold text-foreground">
            Hola, {firstName}. ¿Qué quieres explorar hoy?
          </h1>
          <p className="mt-3 max-w-xl text-muted">
            Tu océano interior sigue despertando. Cada experiencia es un paso más
            profundo en tu proceso de transformación.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/mi-ruta"
              className="inline-flex items-center gap-2 rounded-xl bg-ocean-cyan px-5 py-3 text-sm font-semibold text-[var(--ocean-abyss)] shadow-[0_0_28px_-6px_var(--ocean-cyan)] transition hover:brightness-110"
            >
              Continuar mi ruta <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/aura"
              className="glass inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-foreground transition hover:text-ocean-cyan"
            >
              <Sparkles className="size-4" /> Hablar con AURA
            </Link>
          </div>
        </div>
      </section>

      {/* Progreso + próxima experiencia */}
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

      {/* Accesos + estado emocional */}
      <section className="grid gap-5 md:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Estado emocional del día</CardTitle>
            <span className="text-xs text-muted">Check-in</span>
          </div>
          <p className="mt-2 text-sm text-muted">
            Antes de explorar, conéctate contigo. ¿Cómo te sientes hoy?
          </p>
          <Link
            href="/bitacora"
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-ocean-cyan hover:underline"
          >
            Hacer mi check-in <ArrowRight className="size-4" />
          </Link>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-ocean-violet/15 text-ocean-violet">
              <Radio className="size-5" />
            </div>
            <div>
              <CardTitle>Deep Waves</CardTitle>
              <p className="text-sm text-muted">Meditaciones, hipnosis y respiraciones.</p>
            </div>
          </div>
          <Link
            href="/deep-waves"
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-ocean-cyan hover:underline"
          >
            Entrar a Deep Waves <ArrowRight className="size-4" />
          </Link>
        </Card>
      </section>
    </div>
  );
}

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
    <Card>
      <div className="flex items-center gap-2 text-muted">
        <Route className="size-4" />
        <span className="text-sm">Mi evolución</span>
      </div>
      <div className="mt-4 flex items-end gap-2">
        <span className="font-display text-4xl font-bold text-foreground">
          {percentage}%
        </span>
        <span className="mb-1 text-sm text-muted">completado</span>
      </div>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className={cn("h-full rounded-full bg-gradient-to-r from-ocean-glow to-ocean-cyan")}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="mt-3 text-xs text-muted">
        {total > 0
          ? `${completed} de ${total} experiencias completadas.`
          : "Tu progreso aparecerá cuando comiences tu primera experiencia."}
      </p>
    </Card>
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
    <Card>
      <div className="flex items-center gap-2 text-muted">
        <ClipboardList className="size-4" />
        <span className="text-sm">Continúa tu viaje</span>
      </div>
      {lesson ? (
        <>
          <p className="mt-4 font-display text-lg font-semibold text-foreground">
            {lesson.title}
          </p>
          {programTitle && (
            <p className="mt-1 text-sm text-muted">{programTitle}</p>
          )}
          <Link
            href={`/experiencia/${lesson.id}`}
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-ocean-cyan hover:underline"
          >
            Continuar <ArrowRight className="size-4" />
          </Link>
        </>
      ) : (
        <>
          <p className="mt-4 font-display text-lg font-semibold text-foreground">
            {done ? "¡Ruta completada! 🌊" : "Aún no tienes programa activo"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {done ? "Has recorrido todo tu camino." : "Explora los programas disponibles."}
          </p>
          <Link
            href={done ? "/mi-evolucion" : "/explorar"}
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-ocean-cyan hover:underline"
          >
            {done ? "Ver mi evolución" : "Explorar"} <ArrowRight className="size-4" />
          </Link>
        </>
      )}
    </Card>
  );
}

function NextSessionCard() {
  return (
    <Card>
      <div className="flex items-center gap-2 text-muted">
        <CalendarClock className="size-4" />
        <span className="text-sm">Próximo Círculo en Vivo</span>
      </div>
      <p className="mt-4 text-sm text-muted">
        Aún no tienes sesiones programadas. Tu mentora las publicará aquí.
      </p>
      <Link
        href="/circulos"
        className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-ocean-cyan hover:underline"
      >
        Ver Círculos <ArrowRight className="size-4" />
      </Link>
    </Card>
  );
}
