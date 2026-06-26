import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PanelHero } from "@/components/admin/panel-hero";
import { MetricCard, type Metric } from "@/components/admin/metric-card";
import { PanelBlocks, type ProgramSummary } from "@/components/admin/panel-blocks";

export const dynamic = "force-dynamic";
export const metadata = { title: "Panel · OCEOM" };

export default async function PanelPage() {
  const profile = await requireRole("mentor", "super_admin");
  const firstName = (profile.full_name ?? "Mentora").split(" ")[0];
  const roleLabel = profile.role === "super_admin" ? "Super Admin" : "Mentora";

  const supabase = await createClient();

  // Datos reales (RLS permite a mentora/admin). Robusto ante tablas vacías.
  const [programsRes, lessonsRes, studentsRes, pendingRes, progressRes] =
    await Promise.all([
      supabase
        .from("programs")
        .select("id,title,subtitle,type")
        .eq("status", "published")
        .order("created_at"),
      supabase.from("lessons").select("program_id"),
      supabase
        .from("enrollments")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("status", "submitted"),
      supabase.from("enrollments").select("progress_percentage"),
    ]);

  const programs = programsRes.data ?? [];
  const lessonCounts = (lessonsRes.data ?? []).reduce<Record<string, number>>(
    (acc, l) => {
      acc[l.program_id] = (acc[l.program_id] ?? 0) + 1;
      return acc;
    },
    {},
  );
  const activeStudents = studentsRes.count ?? 0;
  const pendingSubs = pendingRes.count ?? 0;
  const progressRows = progressRes.data ?? [];
  const avgProgress = progressRows.length
    ? Math.round(
        progressRows.reduce((a, r) => a + Number(r.progress_percentage ?? 0), 0) /
          progressRows.length,
      )
    : null;

  const metrics: Metric[] = [
    { label: "Estudiantes activos", value: String(activeStudents), icon: "users", href: "/estudiantes", caption: activeStudents === 0 ? "Inscribe a tu primer estudiante" : undefined },
    { label: "Programas activos", value: String(programs.length), icon: "library", href: "/programas", caption: "E-MOTION® · Neuropsíquica" },
    { label: "Entregas por revisar", value: String(pendingSubs), icon: "clipboard", href: "/entregas", caption: pendingSubs === 0 ? "Todo al día" : undefined },
    { label: "Progreso promedio", value: avgProgress === null ? "—" : `${avgProgress}%`, icon: "activity", href: "/metricas" },
  ];

  const programSummaries: ProgramSummary[] = programs.map((p) => ({
    title: p.title,
    subtitle: p.subtitle,
    type: p.type,
    lessons: lessonCounts[p.id] ?? 0,
    href: "/programas",
  }));

  return (
    <div className="space-y-8">
      <PanelHero
        name={firstName}
        roleLabel={roleLabel}
        chips={[
          `${programs.length} programas`,
          `${activeStudents} estudiantes activos`,
          "Sprint 1 ✓",
        ]}
      />

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m, i) => (
          <MetricCard key={m.label} metric={m} index={i} />
        ))}
      </section>

      <PanelBlocks programs={programSummaries} />
    </div>
  );
}
