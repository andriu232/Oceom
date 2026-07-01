"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notifyEnrollment } from "@/lib/email/notify";

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
  const mentor = await requireRole("mentor", "super_admin");
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

  // Correo de acceso al estudiante. No bloquea la inscripción: hace no-op
  // silencioso si falta RESEND_API_KEY y captura cualquier fallo de envío.
  try {
    const [studentRes, programRes] = await Promise.all([
      supabase.from("profiles").select("full_name, email").eq("id", studentId).single(),
      supabase.from("programs").select("title").eq("id", programId).single(),
    ]);
    const email = studentRes.data?.email;
    if (email) {
      await notifyEnrollment({
        studentName: studentRes.data?.full_name ?? "Viajero",
        studentEmail: email,
        programTitle: programRes.data?.title ?? "tu programa",
        mentorName: mentor.full_name ?? "Tu mentora",
        mentorEmail: mentor.email ?? "",
      });
    }
  } catch (e) {
    console.error("[enrollment] correo de acceso falló:", e);
  }
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
