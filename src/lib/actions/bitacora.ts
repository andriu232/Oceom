"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { EMOTION_BY_KEY } from "@/config/bitacora";
import { giveJournalFeedback } from "@/lib/omi/analyze";

export type BitacoraState = { ok?: boolean; error?: string } | undefined;

const entrySchema = z.object({
  title: z.string().trim().max(120, "El título es demasiado largo").optional(),
  content: z.string().trim().min(1, "Escribe algo antes de guardar").max(8000, "La entrada es muy larga"),
  emotion: z.string().trim().optional(),
  intensity: z.coerce.number().int().min(0).max(10).optional(),
  is_insight: z.coerce.boolean().optional(),
});

/** Crea una entrada de bitácora del usuario actual. */
export async function createEntryAction(
  _prev: BitacoraState,
  formData: FormData,
): Promise<BitacoraState> {
  const parsed = entrySchema.safeParse({
    title: formData.get("title") ?? "",
    content: formData.get("content") ?? "",
    emotion: formData.get("emotion") ?? "",
    intensity: formData.get("intensity") ?? undefined,
    is_insight: formData.get("is_insight") === "on" || formData.get("is_insight") === "true",
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

  const { error } = await supabase.from("journal_entries").insert({
    student_id: user.id,
    title: parsed.data.title || null,
    content: parsed.data.content,
    emotion,
    intensity: typeof parsed.data.intensity === "number" ? parsed.data.intensity : null,
    is_insight: !!parsed.data.is_insight,
    // La bitácora siempre es visible para la mentora (acompaña el proceso).
    is_private: false,
  });
  if (error) return { error: "No se pudo guardar tu entrada. Inténtalo de nuevo." };

  revalidatePath("/bitacora");
  return { ok: true };
}

/** OMI da feedback sobre una entrada de bitácora y lo guarda en la entrada. */
export async function journalFeedbackAction(
  id: string,
): Promise<{ ok: boolean; text?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Tu sesión expiró." };

  const { data: entry } = await supabase
    .from("journal_entries")
    .select("content, emotion, intensity")
    .eq("id", id)
    .eq("student_id", user.id)
    .maybeSingle();
  if (!entry) return { ok: false, error: "No encontramos esa entrada." };

  const res = await giveJournalFeedback({
    content: entry.content as string,
    emotion: entry.emotion as string | null,
    intensity: entry.intensity as number | null,
  });
  if (!res.ok) return { ok: false, error: res.message };

  await supabase
    .from("journal_entries")
    .update({ omi_feedback: res.report, omi_at: new Date().toISOString() })
    .eq("id", id)
    .eq("student_id", user.id);

  revalidatePath("/bitacora");
  return { ok: true, text: res.report };
}

/** Borra una entrada del usuario actual (RLS garantiza que sea suya). */
export async function deleteEntryAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("journal_entries").delete().eq("id", id).eq("student_id", user.id);
  revalidatePath("/bitacora");
}
