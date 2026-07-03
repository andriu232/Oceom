"use client";

import { useActionState } from "react";
import {
  ClipboardList,
  Upload,
  Download,
  CheckCircle2,
  Clock,
  MessageCircleHeart,
} from "lucide-react";
import {
  submitAssignmentAction,
  type AssignmentState,
} from "@/lib/actions/assignments";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StudentAssignment } from "@/lib/queries/assignments";

/** Tarea con su estado + formulario de entrega — lado estudiante. */
export function AssignmentSubmit({
  assignment,
  lessonId,
}: {
  assignment: StudentAssignment;
  lessonId: string;
}) {
  const [state, action, pending] = useActionState<AssignmentState, FormData>(
    submitAssignmentAction,
    undefined,
  );

  const sub = assignment.submission;
  const reviewed = sub?.status === "reviewed";
  const submitted = sub?.status === "submitted" || reviewed;

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-ocean-cyan/12 text-ocean-cyan">
            <ClipboardList className="size-5" />
          </div>
          <div>
            <p className="font-medium text-foreground">{assignment.title}</p>
            {assignment.instructions && (
              <p className="mt-0.5 text-sm text-muted">{assignment.instructions}</p>
            )}
          </div>
        </div>
        {submitted && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
              reviewed
                ? "bg-success/15 text-success"
                : "bg-ocean-cyan/12 text-ocean-cyan",
            )}
          >
            {reviewed ? (
              <>
                <CheckCircle2 className="size-3.5" /> Revisada
              </>
            ) : (
              <>
                <Clock className="size-3.5" /> Entregada
              </>
            )}
          </span>
        )}
      </div>

      {/* Feedback de la mentora (si ya revisó) */}
      {reviewed && sub?.mentorFeedback && (
        <div className="mt-4 rounded-xl border border-success/25 bg-success/5 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-success">
            <MessageCircleHeart className="size-4" /> Feedback de tu mentora
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">
            {sub.mentorFeedback}
          </p>
        </div>
      )}

      {/* Tu entrega actual */}
      {sub && (sub.text || sub.hasFile) && (
        <div className="mt-4 space-y-2 rounded-xl border border-card-border bg-ocean-surface/40 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Tu entrega
          </p>
          {sub.text && (
            <p className="whitespace-pre-wrap text-sm text-foreground/90">{sub.text}</p>
          )}
          {sub.hasFile && (
            <a
              href={`/api/submissions/${sub.id}/download`}
              className="inline-flex items-center gap-1.5 text-sm text-ocean-cyan hover:underline"
            >
              <Download className="size-4" /> Ver mi archivo
            </a>
          )}
        </div>
      )}

      {/* Formulario de (re)entrega */}
      <form action={action} className="mt-4 space-y-3">
        <input type="hidden" name="assignmentId" value={assignment.id} />
        <input type="hidden" name="lessonId" value={lessonId} />
        <textarea
          name="text"
          rows={3}
          defaultValue={sub?.text ?? ""}
          placeholder="Escribe tu respuesta o reflexión (opcional si adjuntas archivo)"
          className="w-full resize-none rounded-xl border border-card-border bg-ocean-surface/40 p-3 text-sm text-foreground placeholder:text-muted/60 focus:border-ocean-cyan/40 focus:outline-none"
        />
        <input
          name="file"
          type="file"
          className="block w-full cursor-pointer rounded-xl border border-card-border bg-ocean-surface/40 text-sm text-muted file:mr-4 file:cursor-pointer file:border-0 file:bg-ocean-cyan/15 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-ocean-cyan hover:file:bg-ocean-cyan/25"
        />

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}
        {state?.ok && (
          <p className="text-sm text-success">¡Entrega enviada! Tu mentora la revisará ✓</p>
        )}

        <Button type="submit" disabled={pending}>
          <Upload className="size-4" />
          {pending
            ? "Enviando…"
            : submitted
              ? "Actualizar entrega"
              : "Entregar"}
        </Button>
      </form>
    </div>
  );
}
