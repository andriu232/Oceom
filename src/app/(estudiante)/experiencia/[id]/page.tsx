import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Play,
  FileText,
  Download,
  Target,
  Sparkles,
} from "lucide-react";
import { requireStudentArea } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle } from "@/components/ui/card";
import { GlowOrb } from "@/components/brand/glow-orb";
import { CompleteToggle } from "@/components/ruta/complete-toggle";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  video: "Video",
  audio: "Audio",
  text: "Lectura",
  meditation: "Meditación",
  hypnosis: "Hipnosis",
  live_recording: "Grabación",
  exercise: "Ejercicio",
};

export default async function ExperienciaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireStudentArea();
  const supabase = await createClient();

  const { data: lesson } = await supabase
    .from("lessons")
    .select(
      "id,title,subtitle,objective,content_type,video_url,audio_url,body_content,duration_seconds",
    )
    .eq("id", id)
    .maybeSingle();

  if (!lesson) notFound();

  const [{ data: resources }, { data: prog }] = await Promise.all([
    supabase
      .from("resources")
      .select("id,title,description,file_url,file_type")
      .eq("lesson_id", id),
    supabase
      .from("lesson_progress")
      .select("completed_at")
      .eq("student_id", profile.id)
      .eq("lesson_id", id)
      .maybeSingle(),
  ]);

  const completed = Boolean(prog?.completed_at);
  const typeLabel = TYPE_LABEL[lesson.content_type] ?? lesson.content_type;

  return (
    <div className="space-y-6">
      <Link
        href="/mi-ruta"
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ocean-cyan"
      >
        <ArrowLeft className="size-4" /> Volver a Mi Ruta
      </Link>

      {/* Reproductor / contenido principal */}
      <div className="glass relative aspect-video w-full overflow-hidden rounded-2xl">
        <GlowOrb className="absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2" />
        <div className="relative flex h-full flex-col items-center justify-center gap-3 text-center">
          <div className="grid size-16 place-items-center rounded-full bg-ocean-cyan/15 text-ocean-cyan ring-1 ring-ocean-cyan/30">
            <Play className="size-7" />
          </div>
          <p className="text-sm text-muted">
            {typeLabel} · Reproductor premium (Vimeo) en el Sprint 5
          </p>
        </div>
      </div>

      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="rounded-full bg-ocean-cyan/12 px-3 py-1 text-xs font-medium text-ocean-cyan">
            {typeLabel}
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold text-foreground">
            {lesson.title}
          </h1>
          {lesson.subtitle && (
            <p className="mt-1 text-muted">{lesson.subtitle}</p>
          )}
        </div>
        <CompleteToggle lessonId={lesson.id} initialCompleted={completed} />
      </div>

      {/* Objetivo */}
      {lesson.objective && (
        <Card className="border-ocean-cyan/20">
          <div className="flex items-start gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-ocean-cyan/12 text-ocean-cyan">
              <Target className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base">Objetivo de la experiencia</CardTitle>
              <p className="mt-1 text-sm text-muted">{lesson.objective}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Cuerpo (si hay texto) */}
      {lesson.body_content && (
        <Card>
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
            {lesson.body_content}
          </p>
        </Card>
      )}

      {/* Contenido de apoyo / recursos */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
          <Sparkles className="size-4 text-ocean-cyan" /> Contenido de apoyo
        </h2>
        {resources && resources.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {resources.map((r) => (
              <a
                key={r.id}
                href={r.file_url ?? "#"}
                className="glass group flex items-center gap-3 rounded-xl p-4 transition-colors hover:border-ocean-cyan/40"
              >
                <div className="grid size-10 place-items-center rounded-xl bg-ocean-violet/15 text-ocean-violet">
                  <FileText className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
                  {r.description && (
                    <p className="truncate text-xs text-muted">{r.description}</p>
                  )}
                </div>
                <Download className="size-4 text-muted group-hover:text-ocean-cyan" />
              </a>
            ))}
          </div>
        ) : (
          <p className="glass rounded-xl p-4 text-sm text-muted">
            Tu mentora añadirá recursos de apoyo (PDFs, audios, ejercicios) a esta
            experiencia.
          </p>
        )}
      </div>
    </div>
  );
}
