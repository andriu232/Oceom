import { createClient } from "@/lib/supabase/server";
import type { LessonContentType } from "@/types/domain";

/* ============================================================
   Capa de queries: la RUTA del estudiante (Programa → Fase →
   Módulo → Experiencia) con su progreso. La usan tanto el modo
   estudiante (Mi Ruta) como el modo admin (perfil del estudiante).
   ============================================================ */

export interface LessonNode {
  id: string;
  title: string;
  subtitle: string | null;
  objective: string | null;
  content_type: LessonContentType;
  duration_seconds: number | null;
  order_index: number;
  completed: boolean;
}

export interface ModuleNode {
  id: string;
  title: string;
  order_index: number;
  lessons: LessonNode[];
}

export interface PhaseNode {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  modules: ModuleNode[];
}

export interface ProgramRoute {
  program: {
    id: string;
    title: string;
    slug: string;
    subtitle: string | null;
    type: string;
    level: string | null;
    duration_label: string | null;
  };
  phases: PhaseNode[];
  totalLessons: number;
  completedLessons: number;
  progressPct: number;
  currentLesson: { id: string; title: string } | null;
}

export interface ActiveEnrollment {
  id: string;
  status: string;
  programId: string;
}

/** Enrollment activo del estudiante (o null si no tiene). */
export async function getActiveEnrollment(
  studentId: string,
): Promise<ActiveEnrollment | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("enrollments")
    .select("id,status,program_id")
    .eq("student_id", studentId)
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return { id: data.id, status: data.status, programId: data.program_id };
}

/** Arma la ruta completa de un programa con el progreso de un estudiante. */
export async function getProgramRoute(
  programId: string,
  studentId: string,
): Promise<ProgramRoute | null> {
  const supabase = await createClient();

  const [programRes, phasesRes, modulesRes, lessonsRes, progressRes] =
    await Promise.all([
      supabase
        .from("programs")
        .select("id,title,slug,subtitle,type,level,duration_label")
        .eq("id", programId)
        .maybeSingle(),
      supabase
        .from("program_phases")
        .select("id,title,description,order_index")
        .eq("program_id", programId)
        .order("order_index"),
      supabase
        .from("modules")
        .select("id,title,order_index,phase_id")
        .eq("program_id", programId)
        .eq("status", "published")
        .order("order_index"),
      supabase
        .from("lessons")
        .select(
          "id,title,subtitle,objective,content_type,duration_seconds,order_index,module_id",
        )
        .eq("program_id", programId)
        .eq("status", "published")
        .order("order_index"),
      supabase
        .from("lesson_progress")
        .select("lesson_id,completed_at")
        .eq("student_id", studentId),
    ]);

  const program = programRes.data;
  if (!program) return null;

  const completedSet = new Set(
    (progressRes.data ?? [])
      .filter((p) => p.completed_at)
      .map((p) => p.lesson_id),
  );

  const lessons = lessonsRes.data ?? [];
  const modules = modulesRes.data ?? [];
  const phases = phasesRes.data ?? [];

  // Lecciones agrupadas por módulo.
  const lessonsByModule = new Map<string, LessonNode[]>();
  for (const l of lessons) {
    const node: LessonNode = {
      id: l.id,
      title: l.title,
      subtitle: l.subtitle,
      objective: l.objective,
      content_type: l.content_type as LessonContentType,
      duration_seconds: l.duration_seconds,
      order_index: l.order_index,
      completed: completedSet.has(l.id),
    };
    const arr = lessonsByModule.get(l.module_id) ?? [];
    arr.push(node);
    lessonsByModule.set(l.module_id, arr);
  }

  // Módulos agrupados por fase.
  const modulesByPhase = new Map<string, ModuleNode[]>();
  for (const m of modules) {
    const node: ModuleNode = {
      id: m.id,
      title: m.title,
      order_index: m.order_index,
      lessons: lessonsByModule.get(m.id) ?? [],
    };
    const key = m.phase_id ?? "_";
    const arr = modulesByPhase.get(key) ?? [];
    arr.push(node);
    modulesByPhase.set(key, arr);
  }

  const phaseNodes: PhaseNode[] = phases.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    order_index: p.order_index,
    modules: modulesByPhase.get(p.id) ?? [],
  }));

  const totalLessons = lessons.length;
  const completedLessons = lessons.filter((l) => completedSet.has(l.id)).length;
  const progressPct = totalLessons
    ? Math.round((completedLessons / totalLessons) * 100)
    : 0;

  // Clase actual = primera no completada (en orden).
  const current = lessons.find((l) => !completedSet.has(l.id));

  return {
    program: {
      id: program.id,
      title: program.title,
      slug: program.slug,
      subtitle: program.subtitle,
      type: program.type,
      level: program.level,
      duration_label: program.duration_label,
    },
    phases: phaseNodes,
    totalLessons,
    completedLessons,
    progressPct,
    currentLesson: current ? { id: current.id, title: current.title } : null,
  };
}

/** Ruta del estudiante a partir de su enrollment activo. */
export async function getStudentRoute(
  studentId: string,
): Promise<ProgramRoute | null> {
  const enrollment = await getActiveEnrollment(studentId);
  if (!enrollment) return null;
  return getProgramRoute(enrollment.programId, studentId);
}
