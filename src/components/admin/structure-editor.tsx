import Link from "next/link";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Pencil,
  Layers,
} from "lucide-react";
import {
  createPhaseAction,
  updatePhaseAction,
  deletePhaseAction,
  createModuleAction,
  updateModuleAction,
  deleteModuleAction,
  createLessonAction,
  moveLessonAction,
  deleteLessonAction,
} from "@/lib/actions/content";
import { EditableTitle } from "@/components/admin/editable-title";
import type { EditorPhase } from "@/lib/queries/admin-content";

const TYPE_LABEL: Record<string, string> = {
  video: "Video",
  audio: "Audio",
  text: "Lectura",
  meditation: "Meditación",
  hypnosis: "Hipnosis",
  live_recording: "Grabación",
  exercise: "Ejercicio",
};

function IconForm({
  action,
  children,
  danger,
  title,
}: {
  action: () => Promise<void>;
  children: React.ReactNode;
  danger?: boolean;
  title: string;
}) {
  return (
    <form action={action}>
      <button
        title={title}
        className={`grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-white/5 ${danger ? "hover:text-danger" : "hover:text-ocean-cyan"}`}
      >
        {children}
      </button>
    </form>
  );
}

export function StructureEditor({
  programId,
  phases,
}: {
  programId: string;
  phases: EditorPhase[];
}) {
  return (
    <div className="space-y-4">
      {phases.map((phase) => (
        <div key={phase.id} className="glass rounded-2xl p-5">
          {/* Fase */}
          <div className="flex items-center gap-2">
            <Layers className="size-4 shrink-0 text-ocean-cyan" />
            <EditableTitle
              initial={phase.title}
              save={updatePhaseAction.bind(null, phase.id, programId)}
              className="font-display text-base font-semibold"
            />
            <IconForm
              title="Eliminar fase"
              danger
              action={deletePhaseAction.bind(null, phase.id, programId)}
            >
              <Trash2 className="size-4" />
            </IconForm>
          </div>

          {/* Módulos */}
          <div className="mt-3 space-y-3 pl-6">
            {phase.modules.map((mod) => (
              <div key={mod.id} className="rounded-xl border border-card-border bg-ocean-surface/30 p-3">
                <div className="flex items-center gap-2">
                  <EditableTitle
                    initial={mod.title}
                    save={updateModuleAction.bind(null, mod.id, programId)}
                    className="text-sm font-medium"
                  />
                  <IconForm
                    title="Eliminar módulo"
                    danger
                    action={deleteModuleAction.bind(null, mod.id, programId)}
                  >
                    <Trash2 className="size-3.5" />
                  </IconForm>
                </div>

                {/* Experiencias */}
                <ul className="mt-2 space-y-1">
                  {mod.lessons.map((lesson) => (
                    <li
                      key={lesson.id}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5"
                    >
                      <span
                        className={`size-1.5 rounded-full ${lesson.status === "published" ? "bg-success" : "bg-muted/50"}`}
                      />
                      <Link
                        href={`/programas/${programId}/lecciones/${lesson.id}`}
                        className="min-w-0 flex-1 truncate text-sm text-foreground hover:text-ocean-cyan"
                      >
                        {lesson.title}
                      </Link>
                      <span className="hidden rounded-full bg-white/5 px-2 py-0.5 text-[0.65rem] text-muted sm:inline">
                        {TYPE_LABEL[lesson.content_type] ?? lesson.content_type}
                      </span>
                      <IconForm
                        title="Subir"
                        action={moveLessonAction.bind(null, lesson.id, programId, "up")}
                      >
                        <ChevronUp className="size-3.5" />
                      </IconForm>
                      <IconForm
                        title="Bajar"
                        action={moveLessonAction.bind(null, lesson.id, programId, "down")}
                      >
                        <ChevronDown className="size-3.5" />
                      </IconForm>
                      <Link
                        href={`/programas/${programId}/lecciones/${lesson.id}`}
                        title="Editar"
                        className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-ocean-cyan"
                      >
                        <Pencil className="size-3.5" />
                      </Link>
                      <IconForm
                        title="Eliminar experiencia"
                        danger
                        action={deleteLessonAction.bind(null, lesson.id, programId)}
                      >
                        <Trash2 className="size-3.5" />
                      </IconForm>
                    </li>
                  ))}
                </ul>

                <form action={createLessonAction.bind(null, programId, mod.id)}>
                  <button className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-ocean-cyan hover:underline">
                    <Plus className="size-3.5" /> Añadir experiencia
                  </button>
                </form>
              </div>
            ))}

            <form action={createModuleAction.bind(null, programId, phase.id)}>
              <button className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted hover:text-ocean-cyan">
                <Plus className="size-3.5" /> Añadir módulo
              </button>
            </form>
          </div>
        </div>
      ))}

      <form action={createPhaseAction.bind(null, programId)}>
        <button className="glass inline-flex w-full items-center justify-center gap-2 rounded-2xl border-dashed py-4 text-sm font-medium text-muted transition-colors hover:border-ocean-cyan/40 hover:text-ocean-cyan">
          <Plus className="size-4" /> Añadir fase
        </button>
      </form>
    </div>
  );
}
