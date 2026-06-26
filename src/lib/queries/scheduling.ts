import { createClient } from "@/lib/supabase/server";

/* ============================================================
   Queries de la agenda 1:1.
   ============================================================ */

export interface MentorSlot {
  id: string;
  startsAt: string;
  durationMinutes: number;
  status: string;
  studentName: string | null;
  note: string | null;
}

export interface OpenSlot {
  id: string;
  startsAt: string;
  durationMinutes: number;
}

export interface MyBooking {
  id: string;
  startsAt: string;
  durationMinutes: number;
  note: string | null;
}

/** Todas las franjas próximas (para la mentora), con nombre del estudiante. */
export async function listMentorSlots(): Promise<MentorSlot[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

  const { data: slots } = await supabase
    .from("class_slots")
    .select("id,starts_at,duration_minutes,status,student_id,note")
    .gte("starts_at", since)
    .order("starts_at");

  const rows = slots ?? [];
  const studentIds = [
    ...new Set(rows.map((s) => s.student_id).filter(Boolean) as string[]),
  ];

  const names = new Map<string, string>();
  if (studentIds.length) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id,full_name")
      .in("id", studentIds);
    for (const p of profs ?? []) names.set(p.id, p.full_name ?? "Estudiante");
  }

  return rows.map((s) => ({
    id: s.id,
    startsAt: s.starts_at,
    durationMinutes: s.duration_minutes,
    status: s.status,
    studentName: s.student_id ? names.get(s.student_id) ?? "Estudiante" : null,
    note: s.note,
  }));
}

/** Franjas disponibles futuras (para el estudiante). */
export async function listOpenSlots(): Promise<OpenSlot[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("class_slots")
    .select("id,starts_at,duration_minutes")
    .eq("status", "available")
    .gte("starts_at", now)
    .order("starts_at");
  return (data ?? []).map((s) => ({
    id: s.id,
    startsAt: s.starts_at,
    durationMinutes: s.duration_minutes,
  }));
}

/** Reservas del estudiante (próximas). */
export async function listMyBookings(studentId: string): Promise<MyBooking[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("class_slots")
    .select("id,starts_at,duration_minutes,note")
    .eq("student_id", studentId)
    .eq("status", "booked")
    .gte("starts_at", since)
    .order("starts_at");
  return (data ?? []).map((s) => ({
    id: s.id,
    startsAt: s.starts_at,
    durationMinutes: s.duration_minutes,
    note: s.note,
  }));
}
