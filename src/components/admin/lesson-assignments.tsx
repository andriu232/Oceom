"use client";

import { useActionState, useEffect, useRef } from "react";
import { ClipboardList, Plus, Trash2, FileUp, PenLine } from "lucide-react";
import {
  createAssignmentAction,
  deleteAssignmentAction,
  type AssignmentState,
} from "@/lib/actions/assignments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AssignmentItem } from "@/lib/queries/assignments";

const FIELD =
  "h-11 w-full rounded-xl border border-card-border bg-ocean-surface/40 px-3 text-sm text-foreground outline-none focus:border-ocean-cyan/40";

/** Gestor de tareas (integraciones) de una lección — lado mentora. */
export function LessonAssignments({
  lessonId,
  programId,
  assignments,
}: {
  lessonId: string;
  programId: string;
  assignments: AssignmentItem[];
}) {
  const [state, action, pending] = useActionState<AssignmentState, FormData>(
    createAssignmentAction,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state?.ok]);

  return (
    <section className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2">
        <ClipboardList className="size-4 text-ocean-cyan" />
        <h2 className="font-display text-lg font-semibold text-foreground">
          Integraciones (tareas)
        </h2>
      </div>
      <p className="mt-1 text-sm text-muted">
        El estudiante las entrega desde esta experiencia (texto y/o archivo).
        Tú las revisas en Entregas.
      </p>

      {assignments.length > 0 ? (
        <ul className="mt-5 space-y-2">
          {assignments.map((a) => (
            <li
              key={a.id}
              className="flex items-start gap-3 rounded-xl border border-card-border bg-ocean-surface/40 p-3"
            >
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-ocean-cyan/12 text-ocean-cyan">
                {a.assignment_type === "text" ? (
                  <PenLine className="size-5" />
                ) : (
                  <FileUp className="size-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{a.title}</p>
                {a.instructions && (
                  <p className="mt-0.5 text-xs text-muted">{a.instructions}</p>
                )}
              </div>
              <form
                action={deleteAssignmentAction.bind(null, a.id, lessonId, programId)}
              >
                <button
                  className="grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                  aria-label="Eliminar tarea"
                >
                  <Trash2 className="size-4" />
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 rounded-xl border border-dashed border-card-border p-4 text-sm text-muted">
          Aún no hay tareas en esta experiencia.
        </p>
      )}

      <form
        ref={formRef}
        action={action}
        className="mt-6 space-y-4 border-t border-card-border pt-6"
      >
        <input type="hidden" name="lessonId" value={lessonId} />
        <input type="hidden" name="programId" value={programId} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="a-title">Título de la tarea</Label>
            <Input
              id="a-title"
              name="title"
              placeholder="Ej: Escribe tu carta de liberación"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a-type">¿Qué debe entregar?</Label>
            <select id="a-type" name="assignment_type" defaultValue="file" className={FIELD}>
              <option value="file">Archivo (PDF, foto, audio…)</option>
              <option value="text">Texto / reflexión</option>
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="a-instr">Instrucciones (opcional)</Label>
          <textarea
            id="a-instr"
            name="instructions"
            rows={2}
            placeholder="Qué debe hacer el estudiante"
            className="w-full resize-none rounded-xl border border-card-border bg-ocean-surface/40 p-3 text-sm text-foreground placeholder:text-muted/60 focus:border-ocean-cyan/40 focus:outline-none"
          />
        </div>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}
        {state?.ok && <p className="text-sm text-success">Tarea creada ✓</p>}

        <Button type="submit" disabled={pending}>
          <Plus className="size-4" /> {pending ? "Creando…" : "Agregar tarea"}
        </Button>
      </form>
    </section>
  );
}
