import { MoonStar, Repeat2, Trash2, CalendarDays } from "lucide-react";
import { requireStudentArea } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { NotebookTabs } from "@/components/bitacora/notebook-tabs";
import { DreamComposer } from "@/components/bitacora/dream-composer";
import { OmiEntryPanel } from "@/components/bitacora/omi-entry-panel";
import { deleteDreamAction } from "@/lib/actions/suenos";
import { EMOTION_BY_KEY, TONE_STYLE } from "@/config/bitacora";
import { DREAM_TYPE_BY_KEY } from "@/config/suenos";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Diario de sueños · OCEOM" };

interface DreamRow {
  id: string;
  title: string | null;
  content: string;
  emotion: string | null;
  intensity: number | null;
  dream_type: string;
  symbols: string | null;
  omi_interpretation: string | null;
  created_at: string;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function SuenosPage() {
  const profile = await requireStudentArea();
  const supabase = await createClient();
  const { data } = await supabase
    .from("dream_entries")
    .select("id, title, content, emotion, intensity, dream_type, symbols, omi_interpretation, created_at")
    .eq("student_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(100);
  const dreams = (data ?? []) as DreamRow[];

  const recurrentes = dreams.filter((d) => d.dream_type === "recurrente").length;
  const activeDays = new Set(dreams.map((d) => d.created_at.slice(0, 10))).size;

  const kpis = [
    { icon: MoonStar, label: "Sueños registrados", value: String(dreams.length) },
    { icon: Repeat2, label: "Recurrentes", value: String(recurrentes) },
    { icon: CalendarDays, label: "Noches registradas", value: String(activeDays) },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Diario de sueños"
        subtitle="Registra tus sueños al despertar: lo que viste, lo que sentiste y los símbolos que aparecieron. Tu mundo onírico también habla de tu proceso."
      />

      <NotebookTabs active="suenos" />

      {/* KPIs */}
      <section className="grid grid-cols-3 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="glass rounded-2xl p-5">
              <div className="grid size-10 place-items-center rounded-xl bg-ocean-violet/12 text-ocean-violet">
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
      <DreamComposer />

      {/* Lista de sueños */}
      <section className="space-y-3">
        <h2 className="font-display text-base font-semibold tracking-tight text-foreground">
          Tus sueños
        </h2>

        {dreams.length === 0 ? (
          <div className="glass rounded-2xl border-dashed px-8 py-14 text-center">
            <p className="text-sm text-muted">
              Aún no has registrado ningún sueño. Mañana al despertar, escribe lo
              primero que recuerdes — aunque sea un fragmento.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {dreams.map((d) => {
              const em = d.emotion ? EMOTION_BY_KEY[d.emotion] : null;
              const tone = TONE_STYLE[(em?.tone ?? "neutral") as keyof typeof TONE_STYLE];
              const type = DREAM_TYPE_BY_KEY[d.dream_type];
              return (
                <article key={d.id} className="glass rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {type && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-ocean-violet/12 px-2.5 py-1 text-xs font-medium text-ocean-violet">
                          <span aria-hidden>{type.emoji}</span>
                          {type.label}
                        </span>
                      )}
                      {em && (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                            tone.chip,
                          )}
                        >
                          <span aria-hidden>{em.emoji}</span>
                          {em.label}
                        </span>
                      )}
                      {typeof d.intensity === "number" && (
                        <span className="font-mono text-xs text-muted tabular-nums">
                          {d.intensity}/10
                        </span>
                      )}
                    </div>
                    <form action={deleteDreamAction}>
                      <input type="hidden" name="id" value={d.id} />
                      <button
                        type="submit"
                        aria-label="Borrar sueño"
                        className="grid size-8 place-items-center rounded-lg text-muted/60 transition-colors hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </form>
                  </div>

                  {d.title && (
                    <h3 className="mt-3 font-display text-base font-semibold text-foreground">
                      {d.title}
                    </h3>
                  )}
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
                    {d.content}
                  </p>
                  {d.symbols && (
                    <p className="mt-2 text-xs text-ocean-violet/90">
                      Símbolos: {d.symbols}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-muted/70">{fmtDate(d.created_at)}</p>
                  <OmiEntryPanel
                    kind="dream"
                    entryId={d.id}
                    initial={d.omi_interpretation}
                  />
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
