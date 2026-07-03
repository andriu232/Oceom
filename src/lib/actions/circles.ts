"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole, requireStudentArea } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { localToIso } from "@/lib/scheduling/time";

/* ============================================================
   Círculos en Vivo: gestión (mentora) + registro de asistencia.
   ============================================================ */

export type CircleFormState = { error?: string; ok?: boolean } | undefined;

function revalidateCircles(id?: string) {
  revalidatePath("/circulos-admin");
  revalidatePath("/circulos");
  if (id) {
    revalidatePath(`/circulos-admin/${id}`);
    revalidatePath(`/circulos/${id}`);
  }
}

function parseForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const startLocal = String(formData.get("starts_at") ?? "");
  const durationMin = Number(formData.get("duration") ?? 90) || 90;
  const meeting_url = String(formData.get("meeting_url") ?? "").trim() || null;
  const program_id = String(formData.get("program_id") ?? "") || null;
  return { title, description, startLocal, durationMin, meeting_url, program_id };
}

export async function createCircleAction(
  _prev: CircleFormState,
  formData: FormData,
): Promise<CircleFormState> {
  const profile = await requireRole("mentor", "super_admin");
  const f = parseForm(formData);
  if (!f.title) return { error: "Falta el título." };

  const mode = String(formData.get("mode") ?? "schedule");
  let starts_at: string;
  if (mode === "now") {
    // Empieza ya: 1 min atrás para que quede EN VIVO al instante (no "próximo").
    starts_at = new Date(Date.now() - 60_000).toISOString();
  } else {
    if (!f.startLocal) return { error: "Elige la fecha y la hora." };
    starts_at = localToIso(f.startLocal);
  }

  const ends_at = new Date(
    new Date(starts_at).getTime() + f.durationMin * 60000,
  ).toISOString();

  const supabase = await createClient();
  const { error } = await supabase.from("live_sessions").insert({
    title: f.title,
    description: f.description,
    starts_at,
    ends_at,
    meeting_url: f.meeting_url,
    program_id: f.program_id,
    status: mode === "now" ? "live" : "scheduled",
    created_by: profile.id,
  });
  if (error) return { error: error.message };
  revalidateCircles();
  return { ok: true };
}

export async function updateCircleAction(
  _prev: CircleFormState,
  formData: FormData,
): Promise<CircleFormState> {
  await requireRole("mentor", "super_admin");
  const id = String(formData.get("id") ?? "");
  const f = parseForm(formData);
  if (!id) return { error: "Círculo no válido." };
  if (!f.title || !f.startLocal) return { error: "Falta el título o la fecha." };

  const starts_at = localToIso(f.startLocal);
  const ends_at = new Date(
    new Date(starts_at).getTime() + f.durationMin * 60000,
  ).toISOString();

  const supabase = await createClient();
  const { error } = await supabase
    .from("live_sessions")
    .update({
      title: f.title,
      description: f.description,
      starts_at,
      ends_at,
      meeting_url: f.meeting_url,
      program_id: f.program_id,
      recording_url: String(formData.get("recording_url") ?? "").trim() || null,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidateCircles(id);
  return { ok: true };
}

export async function deleteCircleAction(id: string) {
  await requireRole("mentor", "super_admin");
  const supabase = await createClient();
  await supabase.from("live_sessions").delete().eq("id", id);
  revalidateCircles();
  redirect("/circulos-admin");
}

/** Registra (o actualiza) la asistencia del estudiante al entrar al círculo. */
export async function joinCircleAction(circleId: string) {
  const profile = await requireStudentArea();
  const supabase = await createClient();
  await supabase.from("session_attendance").upsert(
    {
      session_id: circleId,
      student_id: profile.id,
      joined_at: new Date().toISOString(),
    },
    { onConflict: "session_id,student_id" },
  );
}
