import Link from "next/link";
import { CheckCircle2, Play, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProgramRoute, LessonNode } from "@/lib/queries/route";

const TYPE_LABEL: Record<string, string> = {
  video: "Video",
  audio: "Audio",
  text: "Lectura",
  meditation: "Meditación",
  hypnosis: "Hipnosis",
  live_recording: "Grabación",
  exercise: "Ejercicio",
};

function duration(sec: number | null) {
  if (!sec) return null;
  const m = Math.round(sec / 60);
  return `${m} min`;
}

/** Timeline de la ruta: Fase → Módulo → Experiencia con progreso.
 *  `interactive`: si true, cada experiencia enlaza a su detalle. */
export function RouteTimeline({
  route,
  currentLessonId,
  interactive = true,
}: {
  route: ProgramRoute;
  currentLessonId?: string | null;
  interactive?: boolean;
}) {
  return (
    <div className="space-y-6">
      {route.phases.map((phase, pi) => {
        const phaseLessons = phase.modules.flatMap((m) => m.lessons);
        const done = phaseLessons.filter((l) => l.completed).length;
        return (
          <div key={phase.id} className="glass rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-ocean-cyan">
                  Fase {pi + 1}
                </p>
                <h3 className="mt-1 font-display text-lg font-semibold text-foreground">
                  {phase.title}
                </h3>
                {phase.description && (
                  <p className="mt-1 text-sm text-muted">{phase.description}</p>
                )}
              </div>
              <span className="shrink-0 rounded-full bg-ocean-surface/60 px-3 py-1 text-xs text-muted">
                {done}/{phaseLessons.length}
              </span>
            </div>

            <div className="mt-5 space-y-5">
              {phase.modules.map((m) => (
                <div key={m.id}>
                  {phase.modules.length > 1 && (
                    <p className="mb-2 text-sm font-medium text-foreground/70">
                      {m.title}
                    </p>
                  )}
                  <ul className="space-y-1.5">
                    {m.lessons.map((lesson) => (
                      <LessonRow
                        key={lesson.id}
                        lesson={lesson}
                        current={lesson.id === currentLessonId}
                        interactive={interactive}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LessonRow({
  lesson,
  current,
  interactive,
}: {
  lesson: LessonNode;
  current: boolean;
  interactive: boolean;
}) {
  const dur = duration(lesson.duration_seconds);
  const inner = (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
        interactive && "hover:bg-white/5",
        current && "bg-ocean-cyan/10 ring-1 ring-inset ring-ocean-cyan/30",
      )}
    >
      <span className="shrink-0">
        {lesson.completed ? (
          <CheckCircle2 className="size-5 text-success" />
        ) : current ? (
          <span className="grid size-5 place-items-center rounded-full bg-ocean-cyan text-[var(--ocean-abyss)]">
            <Play className="size-3" />
          </span>
        ) : (
          <span className="block size-5 rounded-full border border-card-border" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm",
            lesson.completed ? "text-muted" : "text-foreground",
          )}
        >
          {lesson.title}
        </p>
        {current && (
          <p className="flex items-center gap-1 text-xs text-ocean-cyan">
            <Sparkles className="size-3" /> Tu clase actual
          </p>
        )}
      </div>
      <span className="hidden shrink-0 items-center gap-2 text-xs text-muted sm:flex">
        <span className="rounded-full bg-white/5 px-2 py-0.5">
          {TYPE_LABEL[lesson.content_type] ?? lesson.content_type}
        </span>
        {dur && <span>{dur}</span>}
      </span>
    </div>
  );

  if (!interactive) return <li>{inner}</li>;
  return (
    <li>
      <Link href={`/experiencia/${lesson.id}`}>{inner}</Link>
    </li>
  );
}
