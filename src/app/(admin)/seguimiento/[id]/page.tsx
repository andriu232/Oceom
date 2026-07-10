import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  HeartPulse,
  BookOpenText,
  MapPin,
  MoonStar,
  Sparkles,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getStudentWellbeing } from "@/lib/queries/wellbeing";
import { EmotionChip, fmtDateTime } from "@/components/admin/emotion";
import { dreamTypeLabel } from "@/config/suenos";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seguimiento del estudiante · OCEOM" };

export default async function SeguimientoEstudiantePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("mentor", "super_admin");
  const { id } = await params;
  const { student, checkins, entries, dreams } = await getStudentWellbeing(id);

  if (!student) notFound();

  return (
    <div className="space-y-8">
      <Link
        href="/seguimiento"
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ocean-cyan"
      >
        <ArrowLeft className="size-4" /> Seguimiento
      </Link>

      {/* Encabezado del estudiante */}
      <div className="glass flex flex-wrap items-center gap-4 rounded-2xl p-6">
        <div className="grid size-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-ocean-glow to-ocean-violet text-lg font-semibold text-[var(--ocean-abyss)]">
          {student.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold text-foreground">
            {student.name}
          </h1>
          {student.email && (
            <p className="truncate text-sm text-muted">{student.email}</p>
          )}
        </div>
        <div className="flex gap-6 text-sm">
          <div className="text-center">
            <p className="font-display text-2xl font-bold text-foreground">
              {checkins.length}
            </p>
            <p className="text-xs text-muted">check-ins</p>
          </div>
          <div className="text-center">
            <p className="font-display text-2xl font-bold text-foreground">
              {entries.length}
            </p>
            <p className="text-xs text-muted">bitácora</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Línea de tiempo emocional */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
            <HeartPulse className="size-5 text-ocean-cyan" /> Estado emocional
          </h2>
          {checkins.length === 0 ? (
            <div className="glass rounded-2xl p-6 text-sm text-muted">
              Aún no ha registrado check-ins emocionales.
            </div>
          ) : (
            <ul className="space-y-3">
              {checkins.map((c) => (
                <li key={c.id} className="glass rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-2">
                    <EmotionChip emotion={c.emotion} intensity={c.intensity} />
                    <span className="shrink-0 text-xs text-muted/70">
                      {fmtDateTime(c.at)}
                    </span>
                  </div>
                  {c.bodyLocation && (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted">
                      <MapPin className="size-3.5 text-ocean-cyan/70" />
                      {c.bodyLocation}
                    </p>
                  )}
                  {c.note && (
                    <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                      {c.note}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Bitácora */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
            <BookOpenText className="size-5 text-ocean-cyan" /> Bitácora
          </h2>
          {entries.length === 0 ? (
            <div className="glass rounded-2xl p-6 text-sm text-muted">
              Aún no ha escrito en su bitácora.
            </div>
          ) : (
            <ul className="space-y-3">
              {entries.map((e) => (
                <li key={e.id} className="glass rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {e.isInsight && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-ocean-glow/12 px-2 py-0.5 text-[0.65rem] font-medium text-ocean-glow">
                          <Sparkles className="size-3" /> Insight
                        </span>
                      )}
                      {e.emotion && (
                        <EmotionChip emotion={e.emotion} intensity={e.intensity} />
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-muted/70">
                      {fmtDateTime(e.at)}
                    </span>
                  </div>
                  {e.title && (
                    <p className="mt-2 font-display font-semibold text-foreground">
                      {e.title}
                    </p>
                  )}
                  {e.content && (
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                      {e.content}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Diario de sueños */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
          <MoonStar className="size-5 text-ocean-violet" /> Diario de sueños
        </h2>
        {dreams.length === 0 ? (
          <div className="glass rounded-2xl p-6 text-sm text-muted">
            Aún no ha registrado sueños.
          </div>
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2">
            {dreams.map((d) => (
              <li key={d.id} className="glass rounded-2xl p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-ocean-violet/12 px-2.5 py-0.5 text-[0.65rem] font-medium text-ocean-violet">
                      {dreamTypeLabel(d.dreamType)}
                    </span>
                    {d.emotion && (
                      <EmotionChip emotion={d.emotion} intensity={d.intensity} />
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-muted/70">
                    {fmtDateTime(d.at)}
                  </span>
                </div>
                {d.title && (
                  <p className="mt-2 font-display font-semibold text-foreground">
                    {d.title}
                  </p>
                )}
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                  {d.content}
                </p>
                {d.symbols && (
                  <p className="mt-2 text-xs text-ocean-violet/90">
                    Símbolos: {d.symbols}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
