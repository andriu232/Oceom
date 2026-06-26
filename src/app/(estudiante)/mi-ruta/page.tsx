import Link from "next/link";
import { ArrowRight, Compass, Route as RouteIcon } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getStudentRoute } from "@/lib/queries/route";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RouteTimeline } from "@/components/ruta/route-timeline";
import { GlowOrb } from "@/components/brand/glow-orb";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mi Ruta · OCEOM" };

export default async function MiRutaPage() {
  const profile = await requireRole("student");
  const route = await getStudentRoute(profile.id);

  if (!route) {
    return (
      <div>
        <PageHeader title="Mi Ruta" subtitle="Tu viaje personalizado a través del método." />
        <EmptyState
          icon={Compass}
          title="Aún no tienes un programa activo"
          description="Cuando tu mentora abra tu acceso, tu ruta aparecerá aquí. Mientras tanto, explora los programas disponibles."
        >
          <Link href="/explorar" className={buttonVariants({})}>
            Explorar programas
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cabecera del programa */}
      <section className="glass relative overflow-hidden rounded-2xl p-8">
        <GlowOrb className="absolute -right-16 -top-12 size-56" />
        <div className="relative">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-ocean-cyan">
            Tu ruta
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
            {route.program.title}
          </h1>
          {route.program.subtitle && (
            <p className="mt-2 max-w-2xl text-muted">{route.program.subtitle}</p>
          )}

          {/* Progreso */}
          <div className="mt-6 max-w-md">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Tu evolución</span>
              <span className="font-medium text-foreground">
                {route.completedLessons}/{route.totalLessons} · {route.progressPct}%
              </span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-ocean-glow to-ocean-cyan transition-all"
                style={{ width: `${route.progressPct}%` }}
              />
            </div>
          </div>

          {route.currentLesson && (
            <Link
              href={`/experiencia/${route.currentLesson.id}`}
              className={buttonVariants({ className: "mt-6" })}
            >
              Continuar: {route.currentLesson.title}
              <ArrowRight className="size-4" />
            </Link>
          )}
          {!route.currentLesson && (
            <p className="mt-6 inline-flex items-center gap-2 rounded-xl bg-success/10 px-4 py-2 text-sm text-success">
              <RouteIcon className="size-4" /> ¡Has completado toda tu ruta! 🌊
            </p>
          )}
        </div>
      </section>

      {/* Timeline */}
      <RouteTimeline route={route} currentLessonId={route.currentLesson?.id} />
    </div>
  );
}
