"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/* ============================================================
   Inscripción: la mentora abre o quita el acceso de un estudiante
   a un programa. Es lo que hace que el estudiante vea su ruta,
   experiencias y materiales (RLS: has_program_access).
   ============================================================ */

function revalidate(studentId: string) {
  revalidatePath(`/estudiantes/${studentId}`);
  revalidatePath("/estudiantes");
}

export async function enrollStudentAction(studentId: string, programId: string) {
  await requireRole("mentor", "super_admin");
  if (!programId) return;
  const supabase = await createClient();
  await supabase.from("enrollments").upsert(
    {
      student_id: studentId,
      program_id: programId,
      status: "active",
      started_at: new Date().toISOString(),
    },
    { onConflict: "student_id,program_id" },
  );
  revalidate(studentId);
}

export async function revokeEnrollmentAction(
  studentId: string,
  programId: string,
) {
  await requireRole("mentor", "super_admin");
  const supabase = await createClient();
  await supabase
    .from("enrollments")
    .delete()
    .eq("student_id", studentId)
    .eq("program_id", programId);
  revalidate(studentId);
}
