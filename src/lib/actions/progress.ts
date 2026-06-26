"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

/** Marca/desmarca una experiencia como completada para el estudiante actual.
 *  Escribe en lesson_progress (RLS: solo el dueño). Cierra el loop con el
 *  modo admin, que lee este mismo progreso. */
export async function setLessonComplete(lessonId: string, completed: boolean) {
  const user = await getUser();
  if (!user) return { ok: false };

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error } = await supabase.from("lesson_progress").upsert(
    {
      student_id: user.id,
      lesson_id: lessonId,
      completed_at: completed ? now : null,
      progress_percentage: completed ? 100 : 0,
      updated_at: now,
    },
    { onConflict: "student_id,lesson_id" },
  );

  if (error) return { ok: false, error: error.message };

  revalidatePath("/mi-ruta");
  revalidatePath("/mi-evolucion");
  revalidatePath("/santuario");
  revalidatePath(`/experiencia/${lessonId}`);
  return { ok: true };
}
