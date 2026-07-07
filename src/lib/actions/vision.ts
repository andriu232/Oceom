"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { VISION_AREA_KEYS, type VisionGoal } from "@/config/vision";
import { normalizeGoals } from "@/lib/queries/vision";

export type VisionState = { ok?: boolean; error?: string } | undefined;
type Result = { ok: boolean; error?: string };

/** Devuelve el id del mapa activo del usuario, creándolo si no existe. */
async function ensureDreamMap(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data: existing } = await supabase
    .from("dream_maps")
    .select("id")
    .eq("student_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (existing?.id) return existing.id as string;

  const { data: created, error } = await supabase
    .from("dream_maps")
    .insert({ student_id: userId, title: null, status: "active" })
    .select("id")
    .single();
  if (error) {
    console.error("[ensureDreamMap]", error);
    return null;
  }
  return created.id as string;
}

/** Devuelve el item de un área (creándolo vacío si no existe). */
async function ensureItem(
  supabase: SupabaseClient,
  mapId: string,
  area: string,
): Promise<{ id: string; goals: VisionGoal[] } | null> {
  const { data: existing } = await supabase
    .from("dream_map_items")
    .select("id, action_steps")
    .eq("dream_map_id", mapId)
    .eq("area", area)
    .maybeSingle();
  if (existing?.id) {
    return { id: existing.id as string, goals: normalizeGoals(existing.action_steps) };
  }
  const { data: created, error } = await supabase
    .from("dream_map_items")
    .insert({ dream_map_id: mapId, area, action_steps: [] })
    .select("id, action_steps")
    .single();
  if (error) {
    console.error("[ensureItem]", error);
    return null;
  }
  return { id: created.id as string, goals: normalizeGoals(created.action_steps) };
}

async function currentUser(supabase: SupabaseClient): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

const areaSchema = z.enum(VISION_AREA_KEYS as [string, ...string[]]);

const saveAreaSchema = z.object({
  area: areaSchema,
  vision_text: z.string().trim().max(2000).optional(),
  affirmation: z.string().trim().max(300).optional(),
});

/** Guarda la visión + afirmación de un área (para useActionState). */
export async function saveVisionAreaAction(
  _prev: VisionState,
  formData: FormData,
): Promise<VisionState> {
  const parsed = saveAreaSchema.safeParse({
    area: formData.get("area"),
    vision_text: formData.get("vision_text") ?? "",
    affirmation: formData.get("affirmation") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };

  const supabase = await createClient();
  const userId = await currentUser(supabase);
  if (!userId) return { error: "Tu sesión expiró. Inicia sesión de nuevo." };

  const mapId = await ensureDreamMap(supabase, userId);
  if (!mapId) return { error: "No se pudo abrir tu mapa de visión." };
  const item = await ensureItem(supabase, mapId, parsed.data.area);
  if (!item) return { error: "No se pudo guardar. Inténtalo de nuevo." };

  const { error } = await supabase
    .from("dream_map_items")
    .update({
      vision_text: parsed.data.vision_text || null,
      affirmation: parsed.data.affirmation || null,
    })
    .eq("id", item.id);
  if (error) return { error: "No se pudo guardar. Inténtalo de nuevo." };

  revalidatePath("/mapa-vision");
  return { ok: true };
}

/** Guarda el título / visión general del tablero. */
export async function saveVisionTitleAction(
  _prev: VisionState,
  formData: FormData,
): Promise<VisionState> {
  const title = String(formData.get("title") ?? "").trim().slice(0, 160);

  const supabase = await createClient();
  const userId = await currentUser(supabase);
  if (!userId) return { error: "Tu sesión expiró. Inicia sesión de nuevo." };

  const mapId = await ensureDreamMap(supabase, userId);
  if (!mapId) return { error: "No se pudo abrir tu mapa de visión." };

  const { error } = await supabase
    .from("dream_maps")
    .update({ title: title || null })
    .eq("id", mapId);
  if (error) return { error: "No se pudo guardar. Inténtalo de nuevo." };

  revalidatePath("/mapa-vision");
  return { ok: true };
}

/** Agrega una meta (action step) a un área. */
export async function addGoalAction(area: string, text: string): Promise<Result> {
  const clean = text.trim().slice(0, 200);
  if (!clean) return { ok: false, error: "Escribe una meta." };
  if (!VISION_AREA_KEYS.includes(area)) return { ok: false, error: "Área no válida." };

  const supabase = await createClient();
  const userId = await currentUser(supabase);
  if (!userId) return { ok: false, error: "Sesión expirada." };

  const mapId = await ensureDreamMap(supabase, userId);
  if (!mapId) return { ok: false, error: "No se pudo abrir tu mapa." };
  const item = await ensureItem(supabase, mapId, area);
  if (!item) return { ok: false, error: "No se pudo guardar." };

  const goals = [...item.goals, { text: clean, done: false }];
  const { error } = await supabase
    .from("dream_map_items")
    .update({ action_steps: goals })
    .eq("id", item.id);
  if (error) return { ok: false, error: "No se pudo guardar." };

  revalidatePath("/mapa-vision");
  return { ok: true };
}

/** Marca/desmarca una meta como cumplida por índice. */
export async function toggleGoalAction(area: string, index: number): Promise<Result> {
  if (!VISION_AREA_KEYS.includes(area)) return { ok: false, error: "Área no válida." };

  const supabase = await createClient();
  const userId = await currentUser(supabase);
  if (!userId) return { ok: false, error: "Sesión expirada." };

  const mapId = await ensureDreamMap(supabase, userId);
  if (!mapId) return { ok: false, error: "No se pudo abrir tu mapa." };
  const item = await ensureItem(supabase, mapId, area);
  if (!item) return { ok: false, error: "No se pudo guardar." };

  const goals = item.goals.map((g, i) => (i === index ? { ...g, done: !g.done } : g));
  const { error } = await supabase
    .from("dream_map_items")
    .update({ action_steps: goals })
    .eq("id", item.id);
  if (error) return { ok: false, error: "No se pudo guardar." };

  revalidatePath("/mapa-vision");
  return { ok: true };
}

/** Elimina una meta por índice. */
export async function removeGoalAction(area: string, index: number): Promise<Result> {
  if (!VISION_AREA_KEYS.includes(area)) return { ok: false, error: "Área no válida." };

  const supabase = await createClient();
  const userId = await currentUser(supabase);
  if (!userId) return { ok: false, error: "Sesión expirada." };

  const mapId = await ensureDreamMap(supabase, userId);
  if (!mapId) return { ok: false, error: "No se pudo abrir tu mapa." };
  const item = await ensureItem(supabase, mapId, area);
  if (!item) return { ok: false, error: "No se pudo guardar." };

  const goals = item.goals.filter((_, i) => i !== index);
  const { error } = await supabase
    .from("dream_map_items")
    .update({ action_steps: goals })
    .eq("id", item.id);
  if (error) return { ok: false, error: "No se pudo guardar." };

  revalidatePath("/mapa-vision");
  return { ok: true };
}
