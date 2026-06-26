"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireRole, getUser } from "@/lib/auth";
import { localToIso } from "@/lib/scheduling/time";

export type SchedState = { error?: string; ok?: boolean } | undefined;

function revalidateAgenda() {
  revalidatePath("/agenda");
  revalidatePath("/agendar");
  revalidatePath("/santuario");
}

/* ---------- Mentora: gestionar disponibilidad (RLS is_mentor) ---------- */

export async function createSlotAction(
  _prev: SchedState,
  formData: FormData,
): Promise<SchedState> {
  const profile = await requireRole("mentor", "super_admin");
  const datetime = String(formData.get("datetime") ?? "");
  const duration = Number(formData.get("duration") ?? 120);
  if (!datetime) return { error: "Elige fecha y hora." };

  let startsAt: string;
  try {
    startsAt = localToIso(datetime);
  } catch {
    return { error: "Fecha no válida." };
  }
  if (new Date(startsAt).getTime() < Date.now()) {
    return { error: "Esa hora ya pasó." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("class_slots").insert({
    mentor_id: profile.id,
    starts_at: startsAt,
    duration_minutes: duration,
    status: "available",
  });
  if (error) return { error: error.message };

  revalidateAgenda();
  return { ok: true };
}

export async function deleteSlotAction(id: string) {
  await requireRole("mentor", "super_admin");
  const supabase = await createClient();
  await supabase.from("class_slots").delete().eq("id", id);
  revalidateAgenda();
}

/* ---------- Estudiante: reservar / cancelar (service client validado) ---------- */

export async function bookSlotAction(
  slotId: string,
  note: string,
  programId: string | null,
): Promise<SchedState> {
  const user = await getUser();
  if (!user) return { error: "No autenticado." };

  const admin = createServiceClient();
  const { data: slot } = await admin
    .from("class_slots")
    .select("id,status,starts_at")
    .eq("id", slotId)
    .maybeSingle();

  if (!slot || slot.status !== "available") {
    return { error: "Esa franja ya no está disponible." };
  }
  if (new Date(slot.starts_at).getTime() < Date.now()) {
    return { error: "Esa hora ya pasó." };
  }

  // Update con guard de estado para evitar doble reserva (carrera).
  const { error } = await admin
    .from("class_slots")
    .update({
      status: "booked",
      student_id: user.id,
      note: note?.trim() || null,
      program_id: programId || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", slotId)
    .eq("status", "available");

  if (error) return { error: error.message };
  revalidateAgenda();
  return { ok: true };
}

export async function cancelBookingAction(slotId: string): Promise<void> {
  const user = await getUser();
  if (!user) return;

  const admin = createServiceClient();
  const { data: slot } = await admin
    .from("class_slots")
    .select("id,student_id")
    .eq("id", slotId)
    .maybeSingle();

  if (!slot || slot.student_id !== user.id) return;

  await admin
    .from("class_slots")
    .update({
      status: "available",
      student_id: null,
      note: null,
      program_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", slotId);

  revalidateAgenda();
}
