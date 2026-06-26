import { createClient } from "@/lib/supabase/server";

/* ============================================================
   Catálogo de programas publicados (vista Explorar del estudiante).
   ============================================================ */

export interface CatalogProgram {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  type: string;
  level: string | null;
  duration_label: string | null;
  benefits: string[];
  lessons: number;
  enrolled: boolean;
}

export async function listCatalog(studentId: string): Promise<CatalogProgram[]> {
  const supabase = await createClient();

  const [programsRes, lessonsRes, enrollRes] = await Promise.all([
    supabase
      .from("programs")
      .select("id,title,slug,subtitle,description,type,level,duration_label,benefits")
      .eq("status", "published")
      .order("created_at"),
    supabase.from("lessons").select("program_id").eq("status", "published"),
    supabase
      .from("enrollments")
      .select("program_id,status")
      .eq("student_id", studentId),
  ]);

  const lessonCounts = (lessonsRes.data ?? []).reduce<Record<string, number>>(
    (acc, l) => {
      acc[l.program_id] = (acc[l.program_id] ?? 0) + 1;
      return acc;
    },
    {},
  );
  const enrolledSet = new Set(
    (enrollRes.data ?? [])
      .filter((e) => e.status === "active")
      .map((e) => e.program_id),
  );

  return (programsRes.data ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    subtitle: p.subtitle,
    description: p.description,
    type: p.type,
    level: p.level,
    duration_label: p.duration_label,
    benefits: Array.isArray(p.benefits) ? (p.benefits as string[]) : [],
    lessons: lessonCounts[p.id] ?? 0,
    enrolled: enrolledSet.has(p.id),
  }));
}
