import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getLessonForEditor } from "@/lib/queries/admin-content";
import { deleteLessonAction } from "@/lib/actions/content";
import { LessonForm } from "@/components/admin/lesson-form";
import { LessonMaterials } from "@/components/admin/lesson-materials";

export const dynamic = "force-dynamic";

export default async function LessonEditorPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id, lessonId } = await params;
  await requireRole("mentor", "super_admin");
  const lesson = await getLessonForEditor(lessonId);
  if (!lesson || lesson.program_id !== id) notFound();

  const supabase = await createClient();
  const { data: resources } = await supabase
    .from("resources")
    .select("id,title,description,file_type")
    .eq("lesson_id", lessonId)
    .order("created_at");

  return (
    <div className="space-y-6">
      <Link
        href={`/programas/${id}/editor`}
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ocean-cyan"
      >
        <ArrowLeft className="size-4" /> Volver al programa
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Editar experiencia
        </h1>
        <form action={deleteLessonAction.bind(null, lessonId, id)}>
          <button className="inline-flex items-center gap-2 rounded-xl border border-card-border px-4 py-2 text-sm text-muted transition hover:border-danger/40 hover:bg-danger/10 hover:text-danger">
            <Trash2 className="size-4" /> Eliminar
          </button>
        </form>
      </div>

      <LessonForm lesson={lesson} />

      <LessonMaterials
        lessonId={lessonId}
        programId={id}
        resources={resources ?? []}
      />
    </div>
  );
}
