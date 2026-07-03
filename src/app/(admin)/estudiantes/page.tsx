import { GraduationCap } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listStudentsOverview } from "@/lib/queries/admin";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import {
  StudentsPanel,
  type StudentRow,
} from "@/components/admin/students-panel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Estudiantes · OCEOM" };

const ATTENTION_DAYS = 14;

function relative(iso: string | null): string {
  if (!iso) return "Sin actividad";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `hace ${days} día${days > 1 ? "s" : ""}`;
  const hours = Math.floor(diff / 3600000);
  if (hours > 0) return `hace ${hours} h`;
  const mins = Math.floor(diff / 60000);
  return mins > 1 ? `hace ${mins} min` : "ahora mismo";
}

export default async function EstudiantesPage() {
  await requireRole("mentor", "super_admin");
  const students = await listStudentsOverview();

  const now = Date.now();
  const rows: StudentRow[] = students.map((s) => {
    const active = s.enrollmentStatus === "active";
    const activityMs = s.lastActivity ? new Date(s.lastActivity).getTime() : null;
    const stale = activityMs == null || now - activityMs > ATTENTION_DAYS * 86400000;
    return {
      ...s,
      lastActivityLabel: relative(s.lastActivity),
      // Inscrito pero sin señales de vida en las últimas 2 semanas → atención.
      needsAttention: active && stale,
    };
  });

  const activeRows = rows.filter((r) => r.enrollmentStatus === "active");
  const progressValues = activeRows
    .filter((r) => r.totalLessons > 0)
    .map((r) => r.progressPct);
  const stats = {
    total: rows.length,
    active: activeRows.length,
    avgProgress: progressValues.length
      ? Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length)
      : null,
    attention: rows.filter((r) => r.needsAttention).length,
  };

  return (
    <div>
      <PageHeader
        title="Estudiantes"
        subtitle="Tu ecosistema: quién va dónde y cómo avanza cada proceso."
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Aún no hay estudiantes"
          description="Cuando alguien se registre y lo inscribas en un programa, aparecerá aquí con su progreso."
        />
      ) : (
        <StudentsPanel students={rows} stats={stats} />
      )}
    </div>
  );
}
