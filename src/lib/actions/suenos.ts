"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { EMOTION_BY_KEY } from "@/config/bitacora";
import { DREAM_TYPE_BY_KEY } from "@/config/suenos";

/* ============================================================
   Diario de sueños (dream_entries): cuaderno aparte dentro de la
   Bitácora. Mismo patrón que las entradas de bitácora. Visible para
   la mentora (RLS) como parte del acompañamiento.
   ============================================================ */

export type DreamState = { ok?: boolean; error?: string } | undefined;

const dreamSchema = z.object({
  title: z.string().trim().max(120, "El título es demasiado largo").optional(),
  content: z
    .string()
    .trim()
    .min(1, "Cuenta tu sueño antes de guardar")
    .max(8000, "El relato es muy largo"),
  emotion: z.string().trim().optional(),
  intensity: z.coerce.number().int().min(0).max(10).optional(),
  dream_type: z.string().trim().optional(),
  symbols: z.string().trim().max(300, "Los símbolos son muy largos").optional(),
});

/** Guarda un sueño del usuario actual. */
export async function createDreamAction(
  _prev: DreamState,
  formData: FormData,
): Promise<DreamState> {
  const parsed = dreamSchema.safeParse({
    title: formData.get("title") ?? "",
    content: formData.get("content") ?? "",
    emotion: formData.get("emotion") ?? "",
    intensity: formData.get("intensity") ?? undefined,
    dream_type: formData.get("dream_type") ?? "",
    symbols: formData.get("symbols") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Inicia sesión de nuevo." };

  const emotion =
    parsed.data.emotion && EMOTION_BY_KEY[parsed.data.emotion] ? parsed.data.emotion : null;
  const dreamType =
    parsed.data.dream_type && DREAM_TYPE_BY_KEY[parsed.data.dream_type]
      ? parsed.data.dream_type
      : "normal";

  const { error } = await supabase.from("dream_entries").insert({
    student_id: user.id,
    title: parsed.data.title || null,
    content: parsed.data.content,
    emotion,
    intensity: typeof parsed.data.intensity === "number" ? parsed.data.intensity : null,
    dream_type: dreamType,
    symbols: parsed.data.symbols || null,
  });
  if (error) return { error: "No se pudo guardar tu sueño. Inténtalo de nuevo." };

  revalidatePath("/bitacora/suenos");
  return { ok: true };
}

/** Borra un sueño del usuario actual (RLS garantiza que sea suyo). */
export async function deleteDreamAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("dream_entries").delete().eq("id", id).eq("student_id", user.id);
  revalidatePath("/bitacora/suenos");
}
