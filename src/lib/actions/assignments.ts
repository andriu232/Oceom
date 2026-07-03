"use server";

import { revalidatePath } from "next/cache";
import { requireRole, requireStudentArea } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

/* ============================================================
   Sprint 4 — Tareas (assignments) y Entregas (submissions).
   Archivos de entrega: bucket privado `materials`, prefijo
   `submissions/`. Subida con service client; descarga con signed
   URL en /api/submissions/[id]/download (acceso por RLS).
   ============================================================ */

const BUCKET = "materials";
const MAX_BYTES = 52_428_800; // 50 MB

export type AssignmentState = { error?: string; ok?: boolean } | undefined;

/* ---------- Mentora: gestiona tareas de una lección ---------- */

export async function createAssignmentAction(
  _prev: AssignmentState,
  formData: FormData,
): Promise<AssignmentState> {
  await requireRole("mentor", "super_admin");
  const lessonId = String(formData.get("lessonId") ?? "");
  const programId = String(formData.get("programId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const instructions = String(formData.get("instructions") ?? "").trim() || null;
  const type = String(formData.get("assignment_type") ?? "file");
  if (!lessonId || !title) return { error: "Falta el título de la tarea." };

  const supabase = await createClient();
  const { error } = await supabase.from("assignments").insert({
    lesson_id: lessonId,
    title,
    instructions,
    assignment_type: type,
  });
  if (error) return { error: error.message };

  revalidatePath(`/programas/${programId}/lecciones/${lessonId}`);
  revalidatePath(`/experiencia/${lessonId}`);
  return { ok: true };
}

export async function deleteAssignmentAction(
  assignmentId: string,
  lessonId: string,
  programId: string,
) {
  await requireRole("mentor", "super_admin");
  const supabase = await createClient();
  await supabase.from("assignments").delete().eq("id", assignmentId);
  revalidatePath(`/programas/${programId}/lecciones/${lessonId}`);
  revalidatePath(`/experiencia/${lessonId}`);
}

/* ---------- Estudiante: entrega una tarea (texto y/o archivo) ---------- */

export async function submitAssignmentAction(
  _prev: AssignmentState,
  formData: FormData,
): Promise<AssignmentState> {
  const profile = await requireStudentArea();
  const assignmentId = String(formData.get("assignmentId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  const file = formData.get("file");
  if (!assignmentId) return { error: "Tarea no válida." };

  const hasFile = file instanceof File && file.size > 0;
  if (!text && !hasFile)
    return { error: "Escribe una respuesta o adjunta un archivo." };

  let fileUrl: string | undefined;
  if (hasFile) {
    const f = file as File;
    if (f.size > MAX_BYTES) return { error: "El archivo supera los 50 MB." };
    const safe = f.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
    const rand = Math.random().toString(36).slice(2, 10);
    const path = `submissions/${assignmentId}/${profile.id}/${rand}-${safe}`;
    const svc = createServiceClient();
    const buffer = Buffer.from(await f.arrayBuffer());
    const { error: upErr } = await svc.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: f.type || undefined, upsert: false });
    if (upErr) return { error: `No se pudo subir: ${upErr.message}` };
    fileUrl = path;
  }

  const row: Record<string, unknown> = {
    assignment_id: assignmentId,
    student_id: profile.id,
    content: text ? { text } : null,
    status: "submitted",
    submitted_at: new Date().toISOString(),
  };
  if (fileUrl) row.file_url = fileUrl; // si no adjunta, conserva el archivo previo

  const supabase = await createClient();
  const { error } = await supabase
    .from("submissions")
    .upsert(row, { onConflict: "assignment_id,student_id" });
  if (error) return { error: error.message };

  revalidatePath(`/experiencia/${lessonId}`);
  return { ok: true };
}

/* ---------- Mentora: revisa una entrega y da feedback ---------- */

export async function reviewSubmissionAction(
  _prev: AssignmentState,
  formData: FormData,
): Promise<AssignmentState> {
  const mentor = await requireRole("mentor", "super_admin");
  const submissionId = String(formData.get("submissionId") ?? "");
  const feedback = String(formData.get("feedback") ?? "").trim() || null;
  if (!submissionId) return { error: "Entrega no válida." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("submissions")
    .update({
      mentor_feedback: feedback,
      status: "reviewed",
      reviewed_by: mentor.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId);
  if (error) return { error: error.message };

  revalidatePath(`/entregas/${submissionId}`);
  revalidatePath("/entregas");
  return { ok: true };
}
