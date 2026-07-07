import type { LucideIcon } from "lucide-react";
import {
  Users,
  GraduationCap,
  TrendingUp,
  ClipboardCheck,
  Wallet,
  Clock,
  CalendarClock,
  Layers,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { getAdminMetrics } from "@/lib/queries/metrics";

export const dynamic = "force-dynamic";
export const metadata = { title: "Métricas · OCEOM" };

const cop = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleString("es-CO", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

/* ---------- Tarjeta KPI ---------- */
function StatTile({
  icon: Icon,
  label,
  value,
  caption,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  caption?: string;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <span className="grid size-9 place-items-center rounded-xl bg-ocean-cyan/10 text-ocean-cyan">
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

/* ---------- Panel con título ---------- */
function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">
          {title}
        </h2>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

/* ---------- Fila de barra ---------- */
function BarRow({
  label,
  valueLabel,
  pct,
}: {
  label: string;
  valueLabel: string;
  pct: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="truncate text-foreground/90">{label}</span>
        <span className="shrink-0 text-muted">{valueLabel}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ocean-surface/70">
        <div
          className="h-full rounded-full bg-gradient-to-r from-ocean-glow to-ocean-cyan"
          style={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
        />
      </div>
    </div>
  );
}

export default async function MetricasPage() {
  await requireRole("mentor", "super_admin");
  const m = await getAdminMetrics();

  const maxEnroll = Math.max(1, ...m.programs.map((p) => p.activeEnrollments));
  const es = m.enrollmentStatus;
  const statusTotal = Math.max(1, es.total);
  const statusSegments = [
    { key: "active", label: "Activas", count: es.active, cls: "bg-ocean-cyan" },
    { key: "completed", label: "Completadas", count: es.completed, cls: "bg-ocean-glow" },
    { key: "paused", label: "Pausadas", count: es.paused, cls: "bg-ocean-violet" },
    {
      key: "cancelled",
      label: "Canceladas / inactivas",
      count: es.cancelled + es.inactive,
      cls: "bg-danger/70",
    },
  ].filter((s) => s.count > 0);

  const subsTotal = Math.max(1, m.submissions.pending + m.submissions.reviewed);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Métricas"
        subtitle="La salud de tu mentoría, de un vistazo."
      />

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile
          icon={Users}
          label="Estudiantes"
          value={String(m.students.total)}
          caption={
            m.students.new30d > 0
              ? `+${m.students.new30d} nuevos (30 días)`
              : "Sin nuevos en 30 días"
          }
        />
        <StatTile
          icon={GraduationCap}
          label="Inscripciones activas"
          value={String(es.active)}
          caption={`de ${es.total} en total`}
        />
        <StatTile
          icon={TrendingUp}
          label="Progreso promedio"
          value={`${m.avgProgress}%`}
          caption="de estudiantes activos"
        />
        <StatTile
          icon={ClipboardCheck}
          label="Entregas por revisar"
          value={String(m.submissions.pending)}
          caption={`${m.submissions.reviewed} ya revisadas`}
        />
        <StatTile
          icon={Wallet}
          label="Ingresos aprobados"
          value={cop(m.revenue.approvedCop)}
          caption={`${cop(m.revenue.monthCop)} este mes`}
        />
        <StatTile
          icon={Clock}
          label="Por cobrar"
          value={cop(m.revenue.pendingCop)}
          caption={`${m.revenue.pendingCount} órdenes pendientes`}
        />
      </section>

      {/* Por programa + Estado de inscripciones */}
      <section className="grid gap-5 lg:grid-cols-2">
        <Panel title="Rendimiento por programa" hint="inscripciones activas · ingresos">
          {m.programs.length === 0 ? (
            <p className="text-sm text-muted">
              Todavía no hay inscripciones ni ventas registradas.
            </p>
          ) : (
            <div className="space-y-5">
              {m.programs.map((p) => (
                <BarRow
                  key={p.id}
                  label={p.title}
                  valueLabel={`${p.activeEnrollments} · ${cop(p.revenueCop)}`}
                  pct={(p.activeEnrollments / maxEnroll) * 100}
                />
              ))}
            </div>
          )}
        </Panel>

        <div className="space-y-5">
          <Panel title="Estado de las inscripciones">
            {es.total === 0 ? (
              <p className="text-sm text-muted">Aún no hay inscripciones.</p>
            ) : (
              <>
                <div className="flex h-3 overflow-hidden rounded-full bg-ocean-surface/70">
                  {statusSegments.map((s) => (
                    <div
                      key={s.key}
                      className={s.cls}
                      style={{ width: `${(s.count / statusTotal) * 100}%` }}
                    />
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                  {statusSegments.map((s) => (
                    <div
                      key={s.key}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className={`size-2.5 rounded-full ${s.cls}`} />
                      <span className="text-muted">{s.label}</span>
                      <span className="ml-auto font-medium text-foreground">
                        {s.count}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Panel>

          <Panel title="Entregas">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <BarRow
                  label="Por revisar"
                  valueLabel={String(m.submissions.pending)}
                  pct={(m.submissions.pending / subsTotal) * 100}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-6 text-sm">
              <span className="text-muted">
                Revisadas:{" "}
                <span className="font-medium text-foreground">
                  {m.submissions.reviewed}
                </span>
              </span>
              <span className="text-muted">
                Total:{" "}
                <span className="font-medium text-foreground">
                  {m.submissions.total}
                </span>
              </span>
            </div>
          </Panel>
        </div>
      </section>

      {/* Próximas sesiones */}
      <Panel
        title="Próximas sesiones"
        hint={`${m.upcoming1on1} clases 1:1 reservadas`}
      >
        {m.upcomingSessions.length === 0 ? (
          <div className="flex items-center gap-3 text-sm text-muted">
            <CalendarClock className="size-5 text-muted/60" />
            No hay sesiones programadas próximamente.
          </div>
        ) : (
          <ul className="divide-y divide-card-border">
            {m.upcomingSessions.map((s, i) => (
              <li key={i} className="flex items-center gap-3 py-3 first:pt-0">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ocean-cyan/10 text-ocean-cyan">
                  <Layers className="size-4" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                  {s.title}
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {dateFmt(s.startsAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
