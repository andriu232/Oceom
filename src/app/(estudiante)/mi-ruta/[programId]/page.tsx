import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Route as RouteIcon } from "lucide-react";
import { requireStudentArea } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getProgramRoute } from "@/lib/queries/route";
import { PageHeader } from "@/components/shared/page-header";
import { RouteTimeline } from "@/components/ruta/route-timeline";
import { GlowOrb } from "@/components/brand/glow-orb";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mi Ruta · OCEOM" };

/** Ruta de un programa específico (para estudiantes inscritos en varios). */
export default async function ProgramRoutePage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  const profile = await requireStudentArea();
  const supabase = await createClient();

  // El estudiante debe estar inscrito en este programa.
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("student_id", profile.id)
    .eq("program_id", programId)
    .maybeSingle();
  if (!enrollment) redirect("/academia");

  const route = await getProgramRoute(programId, profile.id);
  if (!route) notFound();

  return (
    <div className="space-y-8">
      <Link
        href="/academia"
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ocean-cyan"
      >
        <ArrowLeft className="size-4" /> Volver a Academia
      </Link>

      {/* Portada del programa */}
      {route.program.cover_image_url && (
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl ring-1 ring-card-border">
          <Image
            src={route.program.cover_image_url}
            alt={route.program.title}
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        </div>
      )}

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
