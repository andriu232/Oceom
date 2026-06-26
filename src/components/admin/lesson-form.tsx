"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { updateLessonAction, type FormState } from "@/lib/actions/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const selectCls =
  "h-11 w-full rounded-xl border border-card-border bg-ocean-surface/60 px-4 text-sm text-foreground outline-none focus:border-ocean-cyan focus:ring-2 focus:ring-[var(--ring)]";
const textareaCls =
  "w-full rounded-xl border border-card-border bg-ocean-surface/60 px-4 py-3 text-sm text-foreground outline-none focus:border-ocean-cyan focus:ring-2 focus:ring-[var(--ring)]";

interface Lesson {
  id: string;
  program_id: string;
  title: string;
  subtitle: string | null;
  objective: string | null;
  content_type: string;
  video_url: string | null;
  audio_url: string | null;
  body_content: string | null;
  duration_seconds: number | null;
  status: string;
}

export function LessonForm({ lesson }: { lesson: Lesson }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateLessonAction,
    undefined,
  );

  return (
    <form action={action} className="glass space-y-5 rounded-2xl p-6">
      <input type="hidden" name="id" value={lesson.id} />
      <input type="hidden" name="program_id" value={lesson.program_id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="title">Título</Label>
          <Input id="title" name="title" defaultValue={lesson.title} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="content_type">Tipo de experiencia</Label>
          <select id="content_type" name="content_type" defaultValue={lesson.content_type} className={selectCls}>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
            <option value="meditation">Meditación</option>
            <option value="hypnosis">Hipnosis</option>
            <option value="exercise">Ejercicio</option>
            <option value="live_recording">Grabación</option>
            <option value="text">Lectura</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Estado</Label>
          <select id="status" name="status" defaultValue={lesson.status} className={selectCls}>
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
            <option value="archived">Archivado</option>
          </select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="subtitle">Subtítulo</Label>
          <Input id="subtitle" name="subtitle" defaultValue={lesson.subtitle ?? ""} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="objective">Objetivo</Label>
          <textarea id="objective" name="objective" rows={2} defaultValue={lesson.objective ?? ""} className={textareaCls} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="video_url">Video (URL o ID de Vimeo)</Label>
          <Input id="video_url" name="video_url" defaultValue={lesson.video_url ?? ""} placeholder="https://vimeo.com/…" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="audio_url">Audio (URL)</Label>
          <Input id="audio_url" name="audio_url" defaultValue={lesson.audio_url ?? ""} placeholder="https://…" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="body_content">Contenido / sub-temas</Label>
          <textarea id="body_content" name="body_content" rows={5} defaultValue={lesson.body_content ?? ""} className={textareaCls} placeholder={"• Tema 1\n• Tema 2\n• Tema 3"} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="duration_seconds">Duración (segundos)</Label>
          <Input id="duration_seconds" name="duration_seconds" type="number" defaultValue={lesson.duration_seconds ?? ""} placeholder="1800" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar experiencia"}
        </Button>
        {state?.ok && (
          <span className="inline-flex items-center gap-1 text-sm text-success">
            <Check className="size-4" /> Guardado
          </span>
        )}
        {state?.error && <span className="text-sm text-danger">{state.error}</span>}
      </div>
    </form>
  );
}
