import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  HeartPulse,
  ClipboardList,
  BookOpenText,
  Users,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { getWellbeingOverview } from "@/lib/queries/wellbeing";
import { EmotionChip, timeAgo } from "@/components/admin/emotion";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seguimiento · OCEOM" };

function StatTile({
  icon: Icon,
  label,
  value,
  caption,
  alert,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  caption?: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`glass rounded-2xl p-5 ${alert ? "ring-1 ring-danger/40" : ""}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <span
          className={`grid size-9 place-items-center rounded-xl ${
            alert
              ? "bg-danger/15 text-danger"
              : "bg-ocean-cyan/10 text-ocean-cyan"
          }`}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-bold text-foreground">
        {value}
      </p>
      {caption && <p className="mt-1 text-xs text-muted">{caption}</p>}
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
        {title}
      </h2>
      {children}
    </div>
  );
}

export default async function SeguimientoPage() {
  await requireRole("mentor", "super_admin");
  const { kpis, students, recentCheckins, recentEntries } =
    await getWellbeingOverview();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Seguimiento"
        subtitle="Bitácoras y estado emocional de tus estudiantes, para acompañarlos de cerca."
      />

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={AlertTriangle}
          label="Requieren atención"
          value={String(kpis.needAttention)}
          caption="emoción difícil reciente o inactivos"
          alert={kpis.needAttention > 0}
        />
        <StatTile
          icon={HeartPulse}
          label="Check-ins (7 días)"
          value={String(kpis.checkinsWeek)}
          caption="registros emocionales"
        />
        <StatTile
          icon={BookOpenText}
          label="Bitácora (7 días)"
          value={String(kpis.entriesWeek)}
          caption="entradas nuevas"
        />
        <StatTile
          icon={Users}
          label="Con actividad"
          value={`${kpis.withActivity}/${kpis.totalStudents}`}
          caption="estudiantes activos"
        />
      </section>

      {/* Estudiantes */}
      <section>
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
          Estudiantes
        </h2>
        {students.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
            Todavía no hay estudiantes registrados.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {students.map((s) => (
              <Link
                key={s.id}
                href={`/seguimiento/${s.id}`}
                className={`group glass rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:border-ocean-cyan/40 ${
                  s.needsAttention ? "ring-1 ring-danger/40" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-ocean-glow to-ocean-violet text-sm font-semibold text-[var(--ocean-abyss)]">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {s.name}
                    </p>
                    <p className="text-xs text-muted">
                      {s.lastActivity
                        ? `Última actividad ${timeAgo(s.lastActivity)}`
                        : "Sin registros aún"}
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted/50 transition-colors group-hover:text-ocean-cyan" />
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  {s.latest ? (
                    <EmotionChip
                      emotion={s.latest.emotion}
                      intensity={s.latest.intensity}
                    />
                  ) : (
                    <span className="text-xs text-muted">Sin check-ins</span>
                  )}
                  {s.needsAttention && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-danger/12 px-2 py-0.5 text-[0.65rem] font-medium text-danger">
                      <AlertTriangle className="size-3" /> Atención
                    </span>
                  )}
                </div>

                <div className="mt-3 flex gap-4 text-xs text-muted">
                  <span>{s.checkins} check-ins</span>
                  <span>{s.entries} en bitácora</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Feeds recientes */}
      <section className="grid gap-5 lg:grid-cols-2">
        <Panel title="Check-ins recientes">
          {recentCheckins.length === 0 ? (
            <p className="text-sm text-muted">Aún no hay check-ins emocionales.</p>
          ) : (
            <ul className="space-y-4">
              {recentCheckins.map((c) => (
                <li key={c.id} className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/seguimiento/${c.studentId}`}
                        className="text-sm font-medium text-foreground hover:text-ocean-cyan"
                      >
                        {c.studentName}
                      </Link>
                      <EmotionChip emotion={c.emotion} intensity={c.intensity} />
                    </div>
                    {c.note && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted">
                        {c.note}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-muted/70">
                    {timeAgo(c.at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Bitácora reciente">
          {recentEntries.length === 0 ? (
            <p className="text-sm text-muted">
              Aún no hay entradas de bitácora compartidas.
            </p>
          ) : (
            <ul className="space-y-4">
              {recentEntries.map((e) => (
                <li key={e.id} className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-ocean-cyan/10 text-ocean-cyan">
                    {e.isInsight ? (
                      <Sparkles className="size-4" />
                    ) : (
                      <ClipboardList className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/seguimiento/${e.studentId}`}
                        className="text-sm font-medium text-foreground hover:text-ocean-cyan"
                      >
                        {e.studentName}
                      </Link>
                      {e.emotion && <EmotionChip emotion={e.emotion} />}
                    </div>
                    {e.title && (
                      <p className="mt-0.5 text-sm font-medium text-foreground/90">
                        {e.title}
                      </p>
                    )}
                    {e.excerpt && (
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted">
                        {e.excerpt}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-muted/70">
                    {timeAgo(e.at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>
    </div>
  );
}
