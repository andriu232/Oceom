import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/domain";

/* ============================================================
   Queries del MODO ADMIN: lo que ve Valeria. Lista de estudiantes
   con su programa, progreso, "a qué clase van" y última actividad.
   ============================================================ */

export interface StudentOverview {
  id: string;
  name: string;
  email: string | null;
  programTitle: string | null;
  programId: string | null;
  enrollmentStatus: string | null;
  totalLessons: number;
  completedLessons: number;
  progressPct: number;
  currentLesson: string | null;
  lastActivity: string | null; // ISO
}

/** Lista de estudiantes con su panorama para el CRM de la mentora. */
export async function listStudentsOverview(): Promise<StudentOverview[]> {
  const supabase = await createClient();

  const [profilesRes, enrollmentsRes, lessonsRes, progressRes] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id,full_name,email,created_at")
        .eq("role", "student")
        .order("created_at"),
      supabase
        .from("enrollments")
        .select("student_id,program_id,status,programs(title)")
        .eq("status", "active"),
      supabase
        .from("lessons")
        .select("id,program_id,title,order_index")
        .eq("status", "published")
        .order("order_index"),
      supabase
        .from("lesson_progress")
        .select("student_id,lesson_id,completed_at,updated_at"),
    ]);

  const profiles = profilesRes.data ?? [];
  const enrollments = enrollmentsRes.data ?? [];
  const lessons = lessonsRes.data ?? [];
  const progress = progressRes.data ?? [];

  // Lecciones por programa (en orden).
  const lessonsByProgram = new Map<string, { id: string; title: string }[]>();
  for (const l of lessons) {
    const arr = lessonsByProgram.get(l.program_id) ?? [];
    arr.push({ id: l.id, title: l.title });
    lessonsByProgram.set(l.program_id, arr);
  }

  // Progreso por estudiante.
  const completedByStudent = new Map<string, Set<string>>();
  const lastActivityByStudent = new Map<string, string>();
  for (const p of progress) {
    if (p.completed_at) {
      const set = completedByStudent.get(p.student_id) ?? new Set<string>();
      set.add(p.lesson_id);
      completedByStudent.set(p.student_id, set);
    }
    const prev = lastActivityByStudent.get(p.student_id);
    if (!prev || (p.updated_at && p.updated_at > prev)) {
      lastActivityByStudent.set(p.student_id, p.updated_at);
    }
  }

  const enrollmentByStudent = new Map<string, (typeof enrollments)[number]>();
  for (const e of enrollments) enrollmentByStudent.set(e.student_id, e);

  return profiles.map((prof) => {
    const enr = enrollmentByStudent.get(prof.id);
    const programId = enr?.program_id ?? null;
    const programLessons = programId
      ? lessonsByProgram.get(programId) ?? []
      : [];
    const completed = completedByStudent.get(prof.id) ?? new Set<string>();
    const completedLessons = programLessons.filter((l) =>
      completed.has(l.id),
    ).length;
    const totalLessons = programLessons.length;
    const current = programLessons.find((l) => !completed.has(l.id));
    // programs puede venir como objeto o arreglo según el join.
    const programTitle = enr
      ? (Array.isArray(enr.programs)
          ? enr.programs[0]?.title
          : (enr.programs as { title?: string } | null)?.title) ?? null
      : null;

    return {
      id: prof.id,
      name: prof.full_name ?? "Sin nombre",
      email: prof.email,
      programTitle,
      programId,
      enrollmentStatus: enr?.status ?? null,
      totalLessons,
      completedLessons,
      progressPct: totalLessons
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0,
      currentLesson: current?.title ?? (totalLessons ? "Completado" : null),
      lastActivity: lastActivityByStudent.get(prof.id) ?? null,
    };
  });
}

/** Perfil base de un estudiante (para la cabecera del detalle admin). */
export async function getStudentProfile(
  studentId: string,
): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", studentId)
    .maybeSingle();
  return (data as Profile) ?? null;
}
