import { createClient } from "@/lib/supabase/server";
import type { ContentStatus, LessonContentType } from "@/types/domain";

/* ============================================================
   Queries del CMS (admin): listar todos los programas (incl. borradores)
   y armar el árbol completo de un programa para el editor.
   ============================================================ */

export interface AdminProgramRow {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: ContentStatus;
  lessons: number;
}

export async function listAllPrograms(): Promise<AdminProgramRow[]> {
  const supabase = await createClient();
  const [programsRes, lessonsRes] = await Promise.all([
    supabase.from("programs").select("id,title,slug,type,status").order("created_at"),
    supabase.from("lessons").select("program_id"),
  ]);

  const counts = (lessonsRes.data ?? []).reduce<Record<string, number>>((acc, l) => {
    acc[l.program_id] = (acc[l.program_id] ?? 0) + 1;
    return acc;
  }, {});

  return (programsRes.data ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    type: p.type,
    status: p.status as ContentStatus,
    lessons: counts[p.id] ?? 0,
  }));
}

export interface EditorLesson {
  id: string;
  title: string;
  content_type: LessonContentType;
  status: ContentStatus;
  order_index: number;
}
export interface EditorModule {
  id: string;
  title: string;
  status: ContentStatus;
  order_index: number;
  lessons: EditorLesson[];
}
export interface EditorPhase {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  modules: EditorModule[];
}
export interface ProgramEditorData {
  program: {
    id: string;
    title: string;
    slug: string;
    subtitle: string | null;
    description: string | null;
    type: string;
    status: ContentStatus;
    level: string | null;
    duration_label: string | null;
    price_cop: number | null;
    cover_image_url: string | null;
  };
  phases: EditorPhase[];
}

/** Árbol completo (incl. borradores) de un programa para el editor admin. */
export async function getProgramForEditor(
  id: string,
): Promise<ProgramEditorData | null> {
  const supabase = await createClient();

  const [programRes, phasesRes, modulesRes, lessonsRes] = await Promise.all([
    supabase
      .from("programs")
      .select(
        "id,title,slug,subtitle,description,type,status,level,duration_label,price_cop,cover_image_url",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("program_phases")
      .select("id,title,description,order_index")
      .eq("program_id", id)
      .order("order_index"),
    supabase
      .from("modules")
      .select("id,title,status,order_index,phase_id")
      .eq("program_id", id)
      .order("order_index"),
    supabase
      .from("lessons")
      .select("id,title,content_type,status,order_index,module_id")
      .eq("program_id", id)
      .order("order_index"),
  ]);

  const program = programRes.data;
  if (!program) return null;

  const lessonsByModule = new Map<string, EditorLesson[]>();
  for (const l of lessonsRes.data ?? []) {
    const arr = lessonsByModule.get(l.module_id) ?? [];
    arr.push({
      id: l.id,
      title: l.title,
      content_type: l.content_type as LessonContentType,
      status: l.status as ContentStatus,
      order_index: l.order_index,
    });
    lessonsByModule.set(l.module_id, arr);
  }

  const modulesByPhase = new Map<string, EditorModule[]>();
  for (const m of modulesRes.data ?? []) {
    const node: EditorModule = {
      id: m.id,
      title: m.title,
      status: m.status as ContentStatus,
      order_index: m.order_index,
      lessons: lessonsByModule.get(m.id) ?? [],
    };
    const key = m.phase_id ?? "_";
    const arr = modulesByPhase.get(key) ?? [];
    arr.push(node);
    modulesByPhase.set(key, arr);
  }

  const phases: EditorPhase[] = (phasesRes.data ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    order_index: p.order_index,
    modules: modulesByPhase.get(p.id) ?? [],
  }));

  return {
    program: {
      id: program.id,
      title: program.title,
      slug: program.slug,
      subtitle: program.subtitle,
      description: program.description,
      type: program.type,
      status: program.status as ContentStatus,
      level: program.level,
      duration_label: program.duration_label,
      price_cop: program.price_cop,
      cover_image_url: program.cover_image_url,
    },
    phases,
  };
}

/** Una experiencia individual para su editor. */
export async function getLessonForEditor(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lessons")
    .select(
      "id,program_id,module_id,title,subtitle,objective,content_type,video_url,audio_url,body_content,duration_seconds,status,order_index",
    )
    .eq("id", id)
    .maybeSingle();
  return data;
}
