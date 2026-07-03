import { createClient } from "@/lib/supabase/server";

/* ============================================================
   Tareas (assignments) y Entregas (submissions).
   • Estudiante: ve las tareas de la lección + su propia entrega.
   • Mentora: revisa todas las entregas y da feedback.
   Visibilidad por RLS (ver 0002_rls.sql).
   ============================================================ */

export interface AssignmentItem {
  id: string;
  title: string;
  instructions: string | null;
  assignment_type: string;
}

/** Tareas de una lección (para el editor de la mentora). */
export async function listLessonAssignments(
  lessonId: string,
): Promise<AssignmentItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assignments")
    .select("id,title,instructions,assignment_type")
    .eq("lesson_id", lessonId)
    .order("created_at");
  return (data as AssignmentItem[]) ?? [];
}

export interface StudentAssignment extends AssignmentItem {
  submission: {
    id: string;
    status: string; // draft | submitted | reviewed
    text: string | null;
    hasFile: boolean;
    mentorFeedback: string | null;
  } | null;
}

/** Tareas de la lección + la entrega propia del estudiante (si existe). */
export async function listStudentAssignments(
  lessonId: string,
  studentId: string,
): Promise<StudentAssignment[]> {
  const supabase = await createClient();
  const [{ data: assignments }, { data: subs }] = await Promise.all([
    supabase
      .from("assignments")
      .select("id,title,instructions,assignment_type")
      .eq("lesson_id", lessonId)
      .eq("status", "published")
      .order("created_at"),
    supabase
      .from("submissions")
      .select("id,assignment_id,status,content,file_url,mentor_feedback")
      .eq("student_id", studentId),
  ]);

  const smap = new Map((subs ?? []).map((s) => [s.assignment_id, s]));
  return (assignments ?? []).map((a) => {
    const s = smap.get(a.id);
    return {
      ...a,
      submission: s
        ? {
            id: s.id,
            status: s.status,
            text: (s.content as { text?: string } | null)?.text ?? null,
            hasFile: Boolean(s.file_url),
            mentorFeedback: s.mentor_feedback,
          }
        : null,
    };
  }) as StudentAssignment[];
}

export interface ReviewRow {
  id: string;
  status: string;
  submittedAt: string | null;
  studentName: string;
  assignmentTitle: string;
  lessonTitle: string;
  hasFile: boolean;
  textPreview: string | null;
}

/** Todas las entregas para la bandeja de revisión de la mentora. */
export async function listSubmissionsForReview(): Promise<{
  pending: ReviewRow[];
  reviewed: ReviewRow[];
}> {
  const supabase = await createClient();
  const { data: subs } = await supabase
    .from("submissions")
    .select("id,assignment_id,student_id,status,content,file_url,submitted_at")
    .in("status", ["submitted", "reviewed"])
    .order("submitted_at", { ascending: false });

  const list = subs ?? [];
  if (list.length === 0) return { pending: [], reviewed: [] };

  const studentIds = [...new Set(list.map((s) => s.student_id))];
  const assignmentIds = [...new Set(list.map((s) => s.assignment_id))];
  const [{ data: profs }, { data: asgs }] = await Promise.all([
    supabase.from("profiles").select("id,full_name,email").in("id", studentIds),
    supabase.from("assignments").select("id,title,lesson_id").in("id", assignmentIds),
  ]);
  const lessonIds = [...new Set((asgs ?? []).map((a) => a.lesson_id))];
  const { data: lessons } = lessonIds.length
    ? await supabase.from("lessons").select("id,title").in("id", lessonIds)
    : { data: [] as { id: string; title: string }[] };

  const pmap = new Map(
    (profs ?? []).map((p) => [p.id, p.full_name ?? p.email ?? "Estudiante"]),
  );
  const amap = new Map((asgs ?? []).map((a) => [a.id, a]));
  const lmap = new Map((lessons ?? []).map((l) => [l.id, l.title]));

  const rows: ReviewRow[] = list.map((s) => {
    const a = amap.get(s.assignment_id);
    return {
      id: s.id,
      status: s.status,
      submittedAt: s.submitted_at,
      studentName: pmap.get(s.student_id) ?? "Estudiante",
      assignmentTitle: a?.title ?? "Tarea",
      lessonTitle: a ? lmap.get(a.lesson_id) ?? "" : "",
      hasFile: Boolean(s.file_url),
      textPreview:
        (s.content as { text?: string } | null)?.text?.slice(0, 140) ?? null,
    };
  });

  return {
    pending: rows.filter((r) => r.status === "submitted"),
    reviewed: rows.filter((r) => r.status === "reviewed"),
  };
}

export interface ReviewDetail {
  id: string;
  status: string;
  submittedAt: string | null;
  studentName: string;
  studentEmail: string | null;
  assignmentTitle: string;
  instructions: string | null;
  lessonTitle: string;
  text: string | null;
  hasFile: boolean;
  mentorFeedback: string | null;
}

/** Detalle de una entrega para revisarla. */
export async function getSubmissionForReview(
  id: string,
): Promise<ReviewDetail | null> {
  const supabase = await createClient();
  const { data: s } = await supabase
    .from("submissions")
    .select(
      "id,assignment_id,student_id,status,content,file_url,mentor_feedback,submitted_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (!s) return null;

  const [{ data: prof }, { data: a }] = await Promise.all([
    supabase.from("profiles").select("full_name,email").eq("id", s.student_id).maybeSingle(),
    supabase
      .from("assignments")
      .select("title,instructions,lesson_id")
      .eq("id", s.assignment_id)
      .maybeSingle(),
  ]);
  const { data: lesson } = a
    ? await supabase.from("lessons").select("title").eq("id", a.lesson_id).maybeSingle()
    : { data: null };

  return {
    id: s.id,
    status: s.status,
    submittedAt: s.submitted_at,
    studentName: prof?.full_name ?? prof?.email ?? "Estudiante",
    studentEmail: prof?.email ?? null,
    assignmentTitle: a?.title ?? "Tarea",
    instructions: a?.instructions ?? null,
    lessonTitle: lesson?.title ?? "",
    text: (s.content as { text?: string } | null)?.text ?? null,
    hasFile: Boolean(s.file_url),
    mentorFeedback: s.mentor_feedback,
  };
}
