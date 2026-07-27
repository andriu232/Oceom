import { MoonStar, BookOpenText, Sparkles, Gauge } from "lucide-react";
import { getEmotionalMetrics, type Slice } from "@/lib/queries/emotional-metrics";

function Tile({
  icon: Icon,
  label,
  value,
  caption,
}: {
  icon: typeof MoonStar;
  label: string;
  value: string;
  caption?: string;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <span className="grid size-9 place-items-center rounded-xl bg-ocean-violet/12 text-ocean-violet">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-bold text-foreground">{value}</p>
      {caption && <p className="mt-1 text-xs text-muted">{caption}</p>}
    </div>
  );
}

function Bars({ items, max }: { items: Slice[]; max: number }) {
  if (items.length === 0)
    return <p className="text-sm text-muted">Aún no hay registros.</p>;
  return (
    <div className="space-y-4">
      {items.map((s) => (
        <div key={s.key}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-foreground/90">
              <span aria-hidden className="mr-1.5">
                {s.emoji}
              </span>
              {s.label}
            </span>
            <span className="shrink-0 text-muted">{s.count}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ocean-surface/70">
            <div
              className="h-full rounded-full bg-gradient-to-r from-ocean-violet to-ocean-cyan"
              style={{ width: `${Math.max(2, (s.count / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Sección "Bienestar emocional" para el panel de métricas de la mentora:
 *  agregados de Sueños y Bitácora, incluyendo cuántos acompañó OMI. */
export async function EmotionalMetrics() {
  const m = await getEmotionalMetrics();
  const dMax = Math.max(1, ...m.dreams.byType.map((s) => s.count));
  const jMax = Math.max(1, ...m.journal.topEmotions.map((s) => s.count));

  return (
    <section className="space-y-5">
      <h2 className="font-display text-lg font-semibold text-foreground">
        Bienestar emocional
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          icon={MoonStar}
          label="Sueños registrados"
          value={String(m.dreams.total)}
          caption={`${m.dreams.interpreted} interpretados por OMI · ${m.dreams.students} estudiantes`}
        />
        <Tile
          icon={BookOpenText}
          label="Entradas de bitácora"
          value={String(m.journal.total)}
          caption={`${m.journal.withFeedback} con feedback de OMI · ${m.journal.students} estudiantes`}
        />
        <Tile
          icon={Gauge}
          label="Intensidad media"
          value={m.journal.avgIntensity != null ? `${m.journal.avgIntensity}/10` : "—"}
          caption="en la bitácora"
        />
        <Tile
          icon={Sparkles}
          label="Insights"
          value={String(m.journal.insights)}
          caption="marcados por estudiantes"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <h3 className="mb-5 font-display text-base font-semibold text-foreground">
            Tipos de sueño
          </h3>
          <Bars items={m.dreams.byType} max={dMax} />
        </div>
        <div className="glass rounded-2xl p-6">
          <h3 className="mb-5 font-display text-base font-semibold text-foreground">
            Emociones en la bitácora
          </h3>
          <Bars items={m.journal.topEmotions} max={jMax} />
        </div>
      </div>
    </section>
  );
}
