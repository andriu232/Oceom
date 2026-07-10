import { createClient } from "@/lib/supabase/server";
import { EMOTION_BY_KEY } from "@/config/bitacora";

/* ============================================================
   Seguimiento emocional (admin) — bitácoras + check-ins.
   RLS ya permite a la mentora leer todos los `emotional_checkins`
   y las `journal_entries` NO privadas. Agregación en JS.
   ============================================================ */

const HARD_KEYS = new Set(
  Object.values(EMOTION_BY_KEY)
    .filter((e) => e.tone === "hard")
    .map((e) => e.key),
);

function isHard(emotion: string | null): boolean {
  return !!emotion && HARD_KEYS.has(emotion);
}

function excerpt(content: string | null, len = 180): string {
  if (!content) return "";
  const t = content.trim().replace(/\s+/g, " ");
  return t.length > len ? `${t.slice(0, len)}…` : t;
}

export interface StudentWellbeing {
  id: string;
  name: string;
  avatarUrl: string | null;
  latest: { emotion: string | null; intensity: number | null; at: string } | null;
  checkins: number;
  entries: number;
  lastActivity: string | null;
  needsAttention: boolean;
}

export interface CheckinFeedItem {
  id: string;
  studentId: string;
  studentName: string;
  emotion: string | null;
  intensity: number | null;
  note: string | null;
  at: string;
}

export interface EntryFeedItem {
  id: string;
  studentId: string;
  studentName: string;
  title: string | null;
  excerpt: string;
  emotion: string | null;
  isInsight: boolean;
  at: string;
}

export interface WellbeingOverview {
  kpis: {
    checkinsWeek: number;
    entriesWeek: number;
    needAttention: number;
    withActivity: number;
    totalStudents: number;
  };
  students: StudentWellbeing[];
  recentCheckins: CheckinFeedItem[];
  recentEntries: EntryFeedItem[];
}

export async function getWellbeingOverview(): Promise<WellbeingOverview> {
  const supabase = await createClient();
  const now = Date.now();
  const weekAgo = new Date(now - 7 * 864e5).toISOString();
  const staleThreshold = now - 14 * 864e5;

  const [studentsRes, checkinsRes, entriesRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("role", "student"),
    supabase
      .from("emotional_checkins")
      .select("id, student_id, emotion, intensity, note, created_at")
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase
      .from("journal_entries")
      .select("id, student_id, title, content, emotion, is_insight, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const students = (studentsRes.data ?? []) as {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  }[];
  const checkins = (checkinsRes.data ?? []) as {
    id: string;
    student_id: string;
    emotion: string | null;
    intensity: number | null;
    note: string | null;
    created_at: string;
  }[];
  const entries = (entriesRes.data ?? []) as {
    id: string;
    student_id: string;
    title: string | null;
    content: string | null;
    emotion: string | null;
    is_insight: boolean;
    created_at: string;
  }[];

  const nameById = new Map(
    students.map((s) => [s.id, s.full_name ?? "Estudiante"]),
  );

  const perStudent = new Map<string, StudentWellbeing>();
  for (const s of students) {
    perStudent.set(s.id, {
      id: s.id,
      name: s.full_name ?? "Estudiante",
      avatarUrl: s.avatar_url,
      latest: null,
      checkins: 0,
      entries: 0,
      lastActivity: null,
      needsAttention: false,
    });
  }

  // check-ins y entries vienen ya ordenados desc por created_at
  for (const c of checkins) {
    const sw = perStudent.get(c.student_id);
    if (!sw) continue;
    sw.checkins++;
    if (!sw.latest) {
      sw.latest = { emotion: c.emotion, intensity: c.intensity, at: c.created_at };
    }
    if (!sw.lastActivity || c.created_at > sw.lastActivity) {
      sw.lastActivity = c.created_at;
    }
  }
  for (const e of entries) {
    const sw = perStudent.get(e.student_id);
    if (!sw) continue;
    sw.entries++;
    if (!sw.lastActivity || e.created_at > sw.lastActivity) {
      sw.lastActivity = e.created_at;
    }
  }
  for (const sw of perStudent.values()) {
    const hardLatest =
      !!sw.latest && isHard(sw.latest.emotion) && (sw.latest.intensity ?? 0) >= 6;
    const stale =
      sw.lastActivity != null &&
      new Date(sw.lastActivity).getTime() < staleThreshold;
    sw.needsAttention = hardLatest || stale;
  }

  const studentList = [...perStudent.values()].sort((a, b) => {
    if (a.needsAttention !== b.needsAttention) return a.needsAttention ? -1 : 1;
    if (!a.lastActivity && !b.lastActivity) return a.name.localeCompare(b.name);
    if (!a.lastActivity) return 1;
    if (!b.lastActivity) return -1;
    return b.lastActivity.localeCompare(a.lastActivity);
  });

  const recentCheckins: CheckinFeedItem[] = checkins.slice(0, 12).map((c) => ({
    id: c.id,
    studentId: c.student_id,
    studentName: nameById.get(c.student_id) ?? "Estudiante",
    emotion: c.emotion,
    intensity: c.intensity,
    note: c.note,
    at: c.created_at,
  }));

  const recentEntries: EntryFeedItem[] = entries.slice(0, 10).map((e) => ({
    id: e.id,
    studentId: e.student_id,
    studentName: nameById.get(e.student_id) ?? "Estudiante",
    title: e.title,
    excerpt: excerpt(e.content),
    emotion: e.emotion,
    isInsight: e.is_insight,
    at: e.created_at,
  }));

  return {
    kpis: {
      checkinsWeek: checkins.filter((c) => c.created_at >= weekAgo).length,
      entriesWeek: entries.filter((e) => e.created_at >= weekAgo).length,
      needAttention: studentList.filter((s) => s.needsAttention).length,
      withActivity: studentList.filter((s) => s.lastActivity != null).length,
      totalStudents: students.length,
    },
    students: studentList,
    recentCheckins,
    recentEntries,
  };
}

export interface StudentWellbeingDetail {
  student: {
    id: string;
    name: string;
    avatarUrl: string | null;
    email: string | null;
  } | null;
  checkins: {
    id: string;
    emotion: string | null;
    intensity: number | null;
    bodyLocation: string | null;
    note: string | null;
    at: string;
  }[];
  entries: {
    id: string;
    title: string | null;
    content: string | null;
    emotion: string | null;
    intensity: number | null;
    isInsight: boolean;
    at: string;
  }[];
  dreams: {
    id: string;
    title: string | null;
    content: string;
    emotion: string | null;
    intensity: number | null;
    dreamType: string;
    symbols: string | null;
    at: string;
  }[];
}

export async function getStudentWellbeing(
  studentId: string,
): Promise<StudentWellbeingDetail> {
  const supabase = await createClient();

  const [profRes, checkinsRes, entriesRes, dreamsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url, email")
      .eq("id", studentId)
      .maybeSingle(),
    supabase
      .from("emotional_checkins")
      .select("id, emotion, intensity, body_location, note, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(120),
    supabase
      .from("journal_entries")
      .select("id, title, content, emotion, intensity, is_insight, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(120),
    supabase
      .from("dream_entries")
      .select("id, title, content, emotion, intensity, dream_type, symbols, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(120),
  ]);

  const prof = profRes.data as {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;

  return {
    student: prof
      ? {
          id: prof.id,
          name: prof.full_name ?? "Estudiante",
          avatarUrl: prof.avatar_url,
          email: prof.email,
        }
      : null,
    checkins: (
      (checkinsRes.data ?? []) as {
        id: string;
        emotion: string | null;
        intensity: number | null;
        body_location: string | null;
        note: string | null;
        created_at: string;
      }[]
    ).map((c) => ({
      id: c.id,
      emotion: c.emotion,
      intensity: c.intensity,
      bodyLocation: c.body_location,
      note: c.note,
      at: c.created_at,
    })),
    entries: (
      (entriesRes.data ?? []) as {
        id: string;
        title: string | null;
        content: string | null;
        emotion: string | null;
        intensity: number | null;
        is_insight: boolean;
        created_at: string;
      }[]
    ).map((e) => ({
      id: e.id,
      title: e.title,
      content: e.content,
      emotion: e.emotion,
      intensity: e.intensity,
      isInsight: e.is_insight,
      at: e.created_at,
    })),
    // El diario de sueños puede no existir aún (migración 0013 pendiente):
    // en ese caso data viene null y degradamos a lista vacía.
    dreams: (
      (dreamsRes.data ?? []) as {
        id: string;
        title: string | null;
        content: string;
        emotion: string | null;
        intensity: number | null;
        dream_type: string;
        symbols: string | null;
        created_at: string;
      }[]
    ).map((d) => ({
      id: d.id,
      title: d.title,
      content: d.content,
      emotion: d.emotion,
      intensity: d.intensity,
      dreamType: d.dream_type,
      symbols: d.symbols,
      at: d.created_at,
    })),
  };
}
