import Link from "next/link";
import { GraduationCap, ChevronRight } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listStudentsOverview } from "@/lib/queries/admin";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const dynamic = "force-dynamic";
export const metadata = { title: "Estudiantes · OCEOM" };

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

  return (
    <div>
      <PageHeader
        title="Estudiantes"
        subtitle="Tu ecosistema: quién va dónde y cómo avanza cada proceso."
        action={
          <span className="rounded-full border border-card-border bg-ocean-surface/50 px-4 py-2 text-sm text-muted">
            {students.length} estudiante{students.length === 1 ? "" : "s"}
          </span>
        }
      />

      {students.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Aún no hay estudiantes"
          description="Cuando inscribas estudiantes en un programa, aparecerán aquí con su progreso."
        />
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          {/* Encabezado (desktop) */}
          <div className="hidden grid-cols-12 gap-4 border-b border-card-border px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted lg:grid">
            <span className="col-span-3">Estudiante</span>
            <span className="col-span-3">Programa</span>
            <span className="col-span-3">Progreso · clase actual</span>
            <span className="col-span-2">Última actividad</span>
            <span className="col-span-1 text-right">Acceso</span>
          </div>

          <ul className="divide-y divide-card-border">
            {students.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/estudiantes/${s.id}`}
                  className="grid grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-white/5 lg:grid-cols-12 lg:items-center lg:gap-4"
                >
                  {/* Estudiante */}
                  <div className="flex items-center gap-3 lg:col-span-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-ocean-glow to-ocean-violet text-sm font-semibold text-[var(--ocean-abyss)]">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{s.name}</p>
                      <p className="truncate text-xs text-muted">{s.email}</p>
                    </div>
                  </div>

                  {/* Programa */}
                  <div className="lg:col-span-3">
                    <p className="text-sm text-foreground/90">
                      {s.programTitle ?? "Sin programa"}
                    </p>
                  </div>

                  {/* Progreso + clase */}
                  <div className="lg:col-span-3">
                    {s.totalLessons > 0 ? (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/5">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-ocean-glow to-ocean-cyan"
                              style={{ width: `${s.progressPct}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted">
                            {s.completedLessons}/{s.totalLessons}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-ocean-cyan">
                          {s.currentLesson}
                        </p>
                      </>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </div>

                  {/* Última actividad */}
                  <div className="text-xs text-muted lg:col-span-2">
                    {relative(s.lastActivity)}
                  </div>

                  {/* Acceso */}
                  <div className="flex items-center justify-between lg:col-span-1 lg:justify-end">
                    <span
                      className={
                        s.enrollmentStatus === "active"
                          ? "rounded-full bg-success/15 px-2.5 py-0.5 text-xs text-success"
                          : "rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-muted"
                      }
                    >
                      {s.enrollmentStatus === "active" ? "Activo" : "Inactivo"}
                    </span>
                    <ChevronRight className="ml-2 hidden size-4 text-muted lg:block" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
