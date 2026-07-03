"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/* ============================================================
   Notas privadas de la mentora sobre un estudiante. NUNCA visibles
   para el estudiante (RLS: solo is_mentor()). Tabla: mentor_notes.
   ============================================================ */

export async function addMentorNoteAction(studentId: string, formData: FormData) {
  const mentor = await requireRole("mentor", "super_admin");
  const note = String(formData.get("note") ?? "").trim();
  if (!note) return;

  const supabase = await createClient();
  await supabase.from("mentor_notes").insert({
    student_id: studentId,
    mentor_id: mentor.id,
    note,
  });
  revalidatePath(`/estudiantes/${studentId}`);
}

export async function deleteMentorNoteAction(noteId: string, studentId: string) {
  await requireRole("mentor", "super_admin");
  const supabase = await createClient();
  await supabase.from("mentor_notes").delete().eq("id", noteId);
  revalidatePath(`/estudiantes/${studentId}`);
}
