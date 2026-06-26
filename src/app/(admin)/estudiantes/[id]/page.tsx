import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  TrendingUp,
  CheckCircle2,
  Heart,
  Sparkles,
  Mail,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getStudentProfile } from "@/lib/queries/admin";
import { getActiveEnrollment, getProgramRoute } from "@/lib/queries/route";
import { Card } from "@/components/ui/card";
import { RouteTimeline } from "@/components/ruta/route-timeline";
import { GlowOrb } from "@/components/brand/glow-orb";

export const dynamic = "force-dynamic";

export default async function EstudianteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireRole("mentor", "super_admin");

  const profile = await getStudentProfile(id);
  if (!profile) notFound();

  const enrollment = await getActiveEnrollment(id);
  const route = enrollment
    ? await getProgramRoute(enrollment.programId, id)
    : null;

  const supabase = await createClient();
  const { count: checkins } = await supabase
    .from("emotional_checkins")
    .select("id", { count: "exact", head: true })
    .eq("student_id", id);

  return (
    <div className="space-y-7">
      <Link
        href="/estudiantes"
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ocean-cyan"
      >
        <ArrowLeft className="size-4" /> Volver a Estudiantes
      </Link>

      {/* Cabecera */}
      <section className="glass relative overflow-hidden rounded-2xl p-7">
        <GlowOrb className="absolute -right-14 -top-12 size-48" />
        <div className="relative flex flex-wrap items-center gap-5">
          <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-ocean-glow to-ocean-violet text-2xl font-bold text-[var(--ocean-abyss)]">
            {(profile.full_name ?? "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-bold text-foreground">
              {profile.full_name ?? "Sin nombre"}
            </h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted">
              <Mail className="size-3.5" /> {profile.email}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted">Programa</p>
            <p className="font-medium text-foreground">
              {route?.program.title ?? "Sin programa activo"}
            </p>
          </div>
        </div>
      </section>

      {/* Métricas */}
      <section className="grid gap-5 sm:grid-cols-3">
        <Metric
          icon={TrendingUp}
          value={route ? `${route.progressPct}%` : "—"}
          label="Progreso del programa"
        />
        <Metric
          icon={CheckCircle2}
          value={route ? `${route.completedLessons}/${route.totalLessons}` : "—"}
          label="Experiencias completadas"
        />
        <Metric icon={Heart} value={String(checkins ?? 0)} label="Check-ins emocionales" />
      </section>

      {/* Clase actual */}
      {route?.currentLesson && (
        <Card className="border-ocean-cyan/20">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-ocean-cyan/12 text-ocean-cyan">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted">Va en la clase</p>
              <p className="font-medium text-foreground">{route.currentLesson.title}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Ruta del estudiante (lectura) */}
      {route ? (
        <section>
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
            Su ruta
          </h2>
          <RouteTimeline
            route={route}
            currentLessonId={route.currentLesson?.id}
            interactive={false}
          />
        </section>
      ) : (
        <Card>
          <p className="text-sm text-muted">
            Este estudiante aún no tiene un programa activo.
          </p>
        </Card>
      )}
    </div>
  );
}

function Metric({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof TrendingUp;
  value: string;
  label: string;
}) {
  return (
    <Card>
      <div className="grid size-10 place-items-center rounded-xl bg-ocean-cyan/12 text-ocean-cyan">
        <Icon className="size-5" />
      </div>
      <p className="mt-4 font-display text-3xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </Card>
  );
}
