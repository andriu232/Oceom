import { createClient } from "@/lib/supabase/server";
import { emotionLabel } from "@/config/bitacora";

/* ============================================================
   Contexto del estudiante para OMI. Se inyecta en el system prompt para que
   OMI acompañe con precisión (nombre, estación actual, progreso, estado
   emocional reciente) sin alucinar "no tienes datos". Es el equivalente al
   "dataset del trader" de QuanTrade, adaptado a OCEOM. Solo datos del propio
   usuario (RLS). Barato: 4 selects pequeños + agregación en JS.
   ============================================================ */

export interface OmiRecentEmotion {
  label: string;
  intensity: number | null;
  when: string;
  snippet: string | null;
}

export interface OmiUserContext {
  name: string;
  firstName: string;
  program: string | null;
  station: string | null;
  completed: number;
  total: number;
  progressPct: number;
  recentEmotions: OmiRecentEmotion[];
}

function relative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days > 1) return `hace ${days} días`;
  if (days === 1) return "ayer";
  const hours = Math.floor(diff / 3_600_000);
  if (hours >= 1) return `hace ${hours} h`;
  return "hoy";
}

export async function getOmiUserContext(userId: string): Promise<OmiUserContext> {
  const supabase = await createClient();

  const [profileRes, enrollmentRes, journalRes] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
    supabase
      .from("enrollments")
      .select("program_id, programs(title)")
      .eq("student_id", userId)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("journal_entries")
      .select("emotion, intensity, content, created_at")
      .eq("student_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const name = profileRes.data?.full_name?.trim() || "Viajero";
  const firstName = name.split(" ")[0];

  const enr = enrollmentRes.data;
  const program = enr
    ? (Array.isArray(enr.programs)
        ? enr.programs[0]?.title
        : (enr.programs as { title?: string } | null)?.title) ?? null
    : null;

  let station: string | null = null;
  let completed = 0;
  let total = 0;
  if (enr?.program_id) {
    const [lessonsRes, progressRes] = await Promise.all([
      supabase
        .from("lessons")
        .select("id, title, order_index")
        .eq("program_id", enr.program_id)
        .eq("status", "published")
        .order("order_index"),
      supabase
        .from("lesson_progress")
        .select("lesson_id, completed_at")
        .eq("student_id", userId),
    ]);
    const lessons = lessonsRes.data ?? [];
    const done = new Set(
      (progressRes.data ?? [])
        .filter((p) => p.completed_at)
        .map((p) => p.lesson_id),
    );
    total = lessons.length;
    completed = lessons.filter((l) => done.has(l.id)).length;
    const current = lessons.find((l) => !done.has(l.id));
    station = current?.title ?? (total > 0 ? "Programa completado" : null);
  }

  const recentEmotions: OmiRecentEmotion[] = (journalRes.data ?? []).map((e) => ({
    label: emotionLabel(e.emotion) || "—",
    intensity: typeof e.intensity === "number" ? e.intensity : null,
    when: relative(e.created_at),
    snippet: e.content ? e.content.trim().slice(0, 140) : null,
  }));

  return {
    name,
    firstName,
    program,
    station,
    completed,
    total,
    progressPct: total ? Math.round((completed / total) * 100) : 0,
    recentEmotions,
  };
}
