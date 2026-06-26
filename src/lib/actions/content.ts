"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { programSchema, lessonSchema } from "@/lib/validations/content";

export type FormState = { error?: string; ok?: boolean } | undefined;

function revalidateContent(programId?: string) {
  revalidatePath("/programas");
  if (programId) revalidatePath(`/programas/${programId}/editor`);
  // El contenido publicado impacta al estudiante:
  revalidatePath("/academia");
  revalidatePath("/mi-ruta");
  revalidatePath("/santuario");
}

/* ---------------- Programas ---------------- */

export async function createProgramAction() {
  const profile = await requireRole("mentor", "super_admin");
  const supabase = await createClient();
  const suffix = Date.now().toString(36).slice(-4);
  const { data, error } = await supabase
    .from("programs")
    .insert({
      title: "Nuevo programa",
      slug: `nuevo-programa-${suffix}`,
      type: "custom",
      status: "draft",
      created_by: profile.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidateContent();
  redirect(`/programas/${data.id}/editor`);
}

export async function updateProgramAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("mentor", "super_admin");
  const id = String(formData.get("id"));
  const parsed = programSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("programs")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    return {
      error: error.message.includes("duplicate")
        ? "Ese slug ya existe, usa otro."
        : error.message,
    };
  }
  revalidateContent(id);
  return { ok: true };
}

export async function setProgramStatusAction(id: string, status: string) {
  await requireRole("mentor", "super_admin");
  const supabase = await createClient();
  await supabase.from("programs").update({ status }).eq("id", id);
  revalidateContent(id);
}

export async function deleteProgramAction(id: string) {
  await requireRole("mentor", "super_admin");
  const supabase = await createClient();
  await supabase.from("programs").delete().eq("id", id);
  revalidateContent();
  redirect("/programas");
}

/* ---------------- Fases ---------------- */

export async function createPhaseAction(programId: string) {
  await requireRole("mentor", "super_admin");
  const supabase = await createClient();
  const { count } = await supabase
    .from("program_phases")
    .select("id", { count: "exact", head: true })
    .eq("program_id", programId);
  await supabase.from("program_phases").insert({
    program_id: programId,
    title: "Nueva fase",
    order_index: count ?? 0,
  });
  revalidateContent(programId);
}

export async function updatePhaseAction(
  id: string,
  programId: string,
  title: string,
) {
  await requireRole("mentor", "super_admin");
  const supabase = await createClient();
  await supabase.from("program_phases").update({ title }).eq("id", id);
  revalidateContent(programId);
}

export async function deletePhaseAction(id: string, programId: string) {
  await requireRole("mentor", "super_admin");
  const supabase = await createClient();
  await supabase.from("program_phases").delete().eq("id", id);
  revalidateContent(programId);
}

/* ---------------- Módulos ---------------- */

export async function createModuleAction(programId: string, phaseId: string) {
  await requireRole("mentor", "super_admin");
  const supabase = await createClient();
  const { count } = await supabase
    .from("modules")
    .select("id", { count: "exact", head: true })
    .eq("program_id", programId);
  await supabase.from("modules").insert({
    program_id: programId,
    phase_id: phaseId,
    title: "Nuevo módulo",
    status: "published",
    order_index: count ?? 0,
  });
  revalidateContent(programId);
}

export async function updateModuleAction(
  id: string,
  programId: string,
  title: string,
) {
  await requireRole("mentor", "super_admin");
  const supabase = await createClient();
  await supabase.from("modules").update({ title }).eq("id", id);
  revalidateContent(programId);
}

export async function deleteModuleAction(id: string, programId: string) {
  await requireRole("mentor", "super_admin");
  const supabase = await createClient();
  await supabase.from("modules").delete().eq("id", id);
  revalidateContent(programId);
}

/* ---------------- Experiencias (lessons) ---------------- */

export async function createLessonAction(programId: string, moduleId: string) {
  await requireRole("mentor", "super_admin");
  const supabase = await createClient();
  const { count } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("program_id", programId);
  const { data, error } = await supabase
    .from("lessons")
    .insert({
      program_id: programId,
      module_id: moduleId,
      title: "Nueva experiencia",
      content_type: "video",
      status: "draft",
      order_index: count ?? 0,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidateContent(programId);
  redirect(`/programas/${programId}/lecciones/${data.id}`);
}

export async function updateLessonAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("mentor", "super_admin");
  const id = String(formData.get("id"));
  const programId = String(formData.get("program_id"));
  const parsed = lessonSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("lessons")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidateContent(programId);
  return { ok: true };
}

export async function deleteLessonAction(id: string, programId: string) {
  await requireRole("mentor", "super_admin");
  const supabase = await createClient();
  await supabase.from("lessons").delete().eq("id", id);
  revalidateContent(programId);
  redirect(`/programas/${programId}/editor`);
}

/** Mueve una experiencia arriba/abajo dentro de su módulo (intercambia order). */
export async function moveLessonAction(
  id: string,
  programId: string,
  dir: "up" | "down",
) {
  await requireRole("mentor", "super_admin");
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("lessons")
    .select("id,module_id,order_index")
    .eq("id", id)
    .single();
  if (!current) return;

  const { data: siblings } = await supabase
    .from("lessons")
    .select("id,order_index")
    .eq("module_id", current.module_id)
    .order("order_index");
  if (!siblings) return;

  const idx = siblings.findIndex((s) => s.id === id);
  const swapIdx = dir === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= siblings.length) return;

  const neighbor = siblings[swapIdx];
  await Promise.all([
    supabase.from("lessons").update({ order_index: neighbor.order_index }).eq("id", current.id),
    supabase.from("lessons").update({ order_index: current.order_index }).eq("id", neighbor.id),
  ]);
  revalidateContent(programId);
}
