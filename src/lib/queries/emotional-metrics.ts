import { createClient } from "@/lib/supabase/server";
import { EMOTION_BY_KEY } from "@/config/bitacora";
import { DREAM_TYPE_BY_KEY } from "@/config/suenos";

/* ============================================================
   Métricas emocionales para el panel de la mentora: agregados de
   Sueños (dream_entries) y Bitácora (journal_entries). La mentora
   ve todas las entradas por RLS ("mentora ve todas" / "suenos: mentora ve").
   ============================================================ */

export interface Slice {
  key: string;
  label: string;
  emoji: string;
  count: number;
}

export interface EmotionalMetrics {
  dreams: {
    total: number;
    interpreted: number; // con interpretación de OMI
    students: number; // estudiantes distintos que registran sueños
    byType: Slice[];
    topEmotions: Slice[];
  };
  journal: {
    total: number;
    withFeedback: number; // con feedback de OMI
    students: number;
    insights: number;
    avgIntensity: number | null;
    topEmotions: Slice[];
  };
}

function tallyEmotions(rows: { emotion: string | null }[]): Slice[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    if (!r.emotion) continue;
    map.set(r.emotion, (map.get(r.emotion) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([key, count]) => {
      const e = EMOTION_BY_KEY[key];
      return { key, label: e?.label ?? key, emoji: e?.emoji ?? "•", count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

export async function getEmotionalMetrics(): Promise<EmotionalMetrics> {
  const supabase = await createClient();

  const [{ data: dreamRows }, { data: journalRows }] = await Promise.all([
    supabase
      .from("dream_entries")
      .select("student_id, emotion, dream_type, omi_at")
      .limit(3000),
    supabase
      .from("journal_entries")
      .select("student_id, emotion, intensity, is_insight, omi_at")
      .limit(3000),
  ]);

  const dreams = (dreamRows ?? []) as {
    student_id: string;
    emotion: string | null;
    dream_type: string | null;
    omi_at: string | null;
  }[];
  const journal = (journalRows ?? []) as {
    student_id: string;
    emotion: string | null;
    intensity: number | null;
    is_insight: boolean | null;
    omi_at: string | null;
  }[];

  // Sueños por tipo
  const typeMap = new Map<string, number>();
  for (const d of dreams) {
    const k = d.dream_type ?? "normal";
    typeMap.set(k, (typeMap.get(k) ?? 0) + 1);
  }
  const byType = [...typeMap.entries()]
    .map(([key, count]) => {
      const t = DREAM_TYPE_BY_KEY[key];
      return { key, label: t?.label ?? key, emoji: t?.emoji ?? "•", count };
    })
    .sort((a, b) => b.count - a.count);

  const withIntensity = journal.filter((j) => typeof j.intensity === "number");
  const avgIntensity =
    withIntensity.length > 0
      ? Math.round(
          (withIntensity.reduce((s, j) => s + (j.intensity ?? 0), 0) /
            withIntensity.length) *
            10,
        ) / 10
      : null;

  return {
    dreams: {
      total: dreams.length,
      interpreted: dreams.filter((d) => d.omi_at).length,
      students: new Set(dreams.map((d) => d.student_id)).size,
      byType,
      topEmotions: tallyEmotions(dreams),
    },
    journal: {
      total: journal.length,
      withFeedback: journal.filter((j) => j.omi_at).length,
      students: new Set(journal.map((j) => j.student_id)).size,
      insights: journal.filter((j) => j.is_insight).length,
      avgIntensity,
      topEmotions: tallyEmotions(journal),
    },
  };
}
