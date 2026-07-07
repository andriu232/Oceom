import { BookOpenText, Sparkles, Lock, Trash2, CalendarDays, Gauge } from "lucide-react";
import { requireStudentArea } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { EntryComposer } from "@/components/bitacora/entry-composer";
import { deleteEntryAction } from "@/lib/actions/bitacora";
import { getBitacora } from "@/lib/queries/bitacora";
import { EMOTION_BY_KEY, TONE_STYLE, emotionLabel } from "@/config/bitacora";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bitácora Interior · OCEOM" };

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function toneOf(emotion: string | null) {
  const tone = (emotion && EMOTION_BY_KEY[emotion]?.tone) || "neutral";
  return TONE_STYLE[tone];
}

export default async function BitacoraPage() {
  const profile = await requireStudentArea();
  const { entries, stats, series } = await getBitacora(profile.id);

  const kpis = [
    { icon: BookOpenText, label: "Entradas", value: String(stats.total) },
    { icon: Sparkles, label: "Insights", value: String(stats.insights) },
    {
      icon: Gauge,
      label: "Intensidad media",
      value: stats.avgIntensity != null ? `${stats.avgIntensity}/10` : "—",
    },
    { icon: CalendarDays, label: "Días activos", value: String(stats.activeDays) },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Bitácora Interior"
        subtitle="Tu espacio privado de escritura y check-in emocional. Escribe, nombra lo que sientes y observa tu evolución."
      />

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="glass rounded-2xl p-5">
              <div className="grid size-10 place-items-center rounded-xl bg-ocean-cyan/12 text-ocean-cyan">
                <Icon className="size-5" />
              </div>
              <p className="mt-4 font-display text-3xl font-bold tabular-nums text-foreground">
                {k.value}
              </p>
              <p className="text-sm text-muted">{k.label}</p>
            </div>
          );
        })}
      </section>

      {/* Compositor */}
      <EntryComposer />

      {/* Evolución emocional */}
      {series.length > 1 && (
        <section className="glass rounded-2xl p-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Evolución emocional
              </h2>
              <p className="text-sm text-muted">
                Intensidad de tus últimas {series.length} entradas.
              </p>
            </div>
          </div>
          <div className="mt-6 flex h-32 items-end gap-1.5">
            {series.map((s) => {
              const t = toneOf(s.emotion);
              const h = Math.max(6, (s.intensity / 10) * 100);
              return (
                <div
                  key={s.id}
                  className="group relative flex-1"
                  title={`${emotionLabel(s.emotion) || "Sin emoción"} · ${s.intensity}/10 · ${fmtDate(s.created_at)}`}
                >
                  <div
                    className={cn("w-full rounded-t-md transition-all", t.bar)}
                    style={{ height: `${h}%`, opacity: 0.85 }}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Lista de entradas */}
      <section className="space-y-3">
        <h2 className="font-display text-base font-semibold tracking-tight text-foreground">
          Tus entradas
        </h2>

        {entries.length === 0 ? (
          <div className="glass rounded-2xl border-dashed px-8 py-14 text-center">
            <p className="text-sm text-muted">
              Aún no has escrito nada. Tu primera entrada es el primer paso de tu viaje interior.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((e) => {
              const em = e.emotion ? EMOTION_BY_KEY[e.emotion] : null;
              const t = toneOf(e.emotion);
              return (
                <article key={e.id} className="glass rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {em && (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                            t.chip,
                          )}
                        >
                          <span aria-hidden>{em.emoji}</span>
                          {em.label}
                        </span>
                      )}
                      {typeof e.intensity === "number" && (
                        <span className="font-mono text-xs text-muted tabular-nums">
                          {e.intensity}/10
                        </span>
                      )}
                      {e.is_insight && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-oceom-gold/12 px-2.5 py-1 text-xs font-medium text-oceom-gold">
                          <Sparkles className="size-3" /> Insight
                        </span>
                      )}
                      {e.is_private && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted/70">
                          <Lock className="size-3" /> Privada
                        </span>
                      )}
                    </div>
                    <form action={deleteEntryAction}>
                      <input type="hidden" name="id" value={e.id} />
                      <button
                        type="submit"
                        aria-label="Borrar entrada"
                        className="grid size-8 place-items-center rounded-lg text-muted/60 transition-colors hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </form>
                  </div>

                  {e.title && (
                    <h3 className="mt-3 font-display text-base font-semibold text-foreground">
                      {e.title}
                    </h3>
                  )}
                  {e.content && (
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
                      {e.content}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-muted/70">{fmtDate(e.created_at)}</p>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
