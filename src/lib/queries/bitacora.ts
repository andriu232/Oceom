import { createClient } from "@/lib/supabase/server";

export interface JournalEntry {
  id: string;
  title: string | null;
  content: string | null;
  emotion: string | null;
  intensity: number | null;
  is_insight: boolean;
  is_private: boolean;
  created_at: string;
}

export interface BitacoraOverview {
  entries: JournalEntry[];
  stats: {
    total: number;
    insights: number;
    /** Promedio de intensidad (0-10) de las entradas que la registran. */
    avgIntensity: number | null;
    /** Días distintos con al menos una entrada. */
    activeDays: number;
  };
  /** Serie cronológica (asc) para la gráfica de evolución emocional. */
  series: Array<{ id: string; emotion: string | null; intensity: number; created_at: string }>;
}

/** Carga las entradas de la bitácora del estudiante + agregados para el panel. */
export async function getBitacora(studentId: string, limit = 60): Promise<BitacoraOverview> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("journal_entries")
    .select("id, title, content, emotion, intensity, is_insight, is_private, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(limit);

  const entries = (data ?? []) as JournalEntry[];

  const insights = entries.filter((e) => e.is_insight).length;
  const withIntensity = entries.filter((e) => typeof e.intensity === "number");
  const avgIntensity =
    withIntensity.length > 0
      ? Math.round(
          (withIntensity.reduce((s, e) => s + (e.intensity ?? 0), 0) / withIntensity.length) * 10,
        ) / 10
      : null;
  const activeDays = new Set(entries.map((e) => e.created_at.slice(0, 10))).size;

  // Serie para la gráfica: últimas ~20 con intensidad, en orden cronológico asc.
  const series = withIntensity
    .slice(0, 20)
    .reverse()
    .map((e) => ({
      id: e.id,
      emotion: e.emotion,
      intensity: e.intensity ?? 0,
      created_at: e.created_at,
    }));

  return {
    entries,
    stats: { total: entries.length, insights, avgIntensity, activeDays },
    series,
  };
}
