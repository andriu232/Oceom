import Link from "next/link";
import { Radio, Clock, ArrowRight, PlayCircle, Video } from "lucide-react";
import { requireStudentArea } from "@/lib/auth";
import { listCirclesForStudent, type Circle } from "@/lib/queries/circles";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDayLabel, formatTime } from "@/lib/scheduling/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "Círculos en Vivo · OCEOM" };

export default async function CirculosPage() {
  await requireStudentArea();
  const { live, upcoming, past } = await listCirclesForStudent();

  const hasAny = live.length + upcoming.length + past.length > 0;

  return (
    <div className="space-y-9">
      <PageHeader
        title="Círculos en Vivo"
        subtitle="Encuentros en vivo con Valeria y la comunidad."
      />

      {!hasAny && (
        <EmptyState
          icon={Radio}
          title="Aún no hay círculos programados"
          description="Cuando tu mentora abra un encuentro en vivo, aparecerá aquí para que te conectes con un clic."
        />
      )}

      {/* En vivo ahora */}
      {live.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
            <span className="size-2 animate-pulse rounded-full bg-danger shadow-[0_0_10px_2px_rgba(251,113,133,0.8)]" />
            En vivo ahora
          </h2>
          <div className="space-y-3">
            {live.map((c) => (
              <Link
                key={c.id}
                href={`/circulos/${c.id}`}
                className="glass-strong group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-danger/30 p-5 transition-transform hover:-translate-y-0.5"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full opacity-50 blur-3xl"
                  style={{ background: "radial-gradient(circle, rgba(251,113,133,0.4), transparent 70%)" }}
                />
                <div className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-danger/15 text-danger ring-1 ring-inset ring-danger/30">
                  <Video className="size-6" />
                </div>
                <div className="relative min-w-0 flex-1">
                  <p className="font-display text-lg font-semibold text-foreground">{c.title}</p>
                  {c.description && <p className="truncate text-sm text-muted">{c.description}</p>}
                </div>
                <span className="relative inline-flex shrink-0 items-center gap-2 rounded-[18px] bg-[linear-gradient(135deg,#fb7185,#f5c451)] px-4 py-2.5 text-sm font-semibold text-[#2a0a10] shadow-[0_0_24px_-6px_rgba(251,113,133,0.8)]">
                  Entrar ahora <ArrowRight className="size-4" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Próximos */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-foreground">Próximos</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {upcoming.map((c) => <UpcomingCard key={c.id} c={c} />)}
          </div>
        </section>
      )}

      {/* Grabaciones */}
      {past.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-foreground">Grabaciones</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {past.map((c) => (
              <Link
                key={c.id}
                href={`/circulos/${c.id}`}
                className="glass group flex items-center gap-3 rounded-xl p-4 transition-colors hover:border-ocean-cyan/40"
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-ocean-cyan/12 text-ocean-cyan">
                  <PlayCircle className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{c.title}</p>
                  <p className="text-xs text-muted">{formatDayLabel(c.starts_at)}</p>
                </div>
                <span className="text-xs text-muted group-hover:text-ocean-cyan">
                  {c.recording_url ? "Ver grabación" : "Ver"}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function UpcomingCard({ c }: { c: Circle }) {
  return (
    <Link
      href={`/circulos/${c.id}`}
      className="glass group flex flex-col rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
    >
      <div className="grid size-11 place-items-center rounded-xl bg-ocean-violet/15 text-ocean-violet">
        <Radio className="size-5" />
      </div>
      <p className="mt-3 font-display text-base font-semibold text-foreground">{c.title}</p>
      {c.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{c.description}</p>}
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
        <Clock className="size-3.5" />
        {formatDayLabel(c.starts_at)} · {formatTime(c.starts_at)}
      </p>
    </Link>
  );
}
