import { createClient } from "@/lib/supabase/server";
import type { VisionGoal } from "@/config/vision";

export interface VisionItem {
  id: string;
  area: string;
  vision_text: string | null;
  affirmation: string | null;
  goals: VisionGoal[];
}

export interface VisionBoard {
  mapId: string | null;
  title: string | null;
  itemsByArea: Record<string, VisionItem>;
  /** Total de metas y cuántas están cumplidas (para el resumen). */
  totalGoals: number;
  doneGoals: number;
}

/** Normaliza el jsonb `action_steps` a VisionGoal[] tolerando formatos viejos
 *  (array de strings) o datos corruptos. */
export function normalizeGoals(raw: unknown): VisionGoal[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((g): VisionGoal | null => {
      if (typeof g === "string") return { text: g, done: false };
      if (g && typeof g === "object" && "text" in g) {
        const t = String((g as { text: unknown }).text ?? "").trim();
        if (!t) return null;
        return { text: t, done: Boolean((g as { done?: unknown }).done) };
      }
      return null;
    })
    .filter((g): g is VisionGoal => g !== null);
}

/** Carga el tablero de visión activo del estudiante (sin crearlo). */
export async function getVisionBoard(studentId: string): Promise<VisionBoard> {
  const supabase = await createClient();

  const { data: map } = await supabase
    .from("dream_maps")
    .select("id, title")
    .eq("student_id", studentId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const empty: VisionBoard = {
    mapId: null,
    title: null,
    itemsByArea: {},
    totalGoals: 0,
    doneGoals: 0,
  };
  if (!map) return empty;

  const { data: rows } = await supabase
    .from("dream_map_items")
    .select("id, area, vision_text, affirmation, action_steps")
    .eq("dream_map_id", map.id);

  const itemsByArea: Record<string, VisionItem> = {};
  let totalGoals = 0;
  let doneGoals = 0;

  for (const r of (rows ?? []) as Array<{
    id: string;
    area: string;
    vision_text: string | null;
    affirmation: string | null;
    action_steps: unknown;
  }>) {
    const goals = normalizeGoals(r.action_steps);
    totalGoals += goals.length;
    doneGoals += goals.filter((g) => g.done).length;
    itemsByArea[r.area] = {
      id: r.id,
      area: r.area,
      vision_text: r.vision_text,
      affirmation: r.affirmation,
      goals,
    };
  }

  return {
    mapId: map.id as string,
    title: (map.title as string | null) ?? null,
    itemsByArea,
    totalGoals,
    doneGoals,
  };
}
