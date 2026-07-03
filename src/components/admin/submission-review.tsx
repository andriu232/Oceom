"use client";

import { useActionState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import {
  reviewSubmissionAction,
  type AssignmentState,
} from "@/lib/actions/assignments";
import { Button } from "@/components/ui/button";

/** Formulario de feedback de la mentora sobre una entrega. */
export function SubmissionReview({
  submissionId,
  defaultFeedback,
  alreadyReviewed,
}: {
  submissionId: string;
  defaultFeedback: string | null;
  alreadyReviewed: boolean;
}) {
  const [state, action, pending] = useActionState<AssignmentState, FormData>(
    reviewSubmissionAction,
    undefined,
  );

  return (
    <section className="glass rounded-2xl p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
        <CheckCircle2 className="size-5 text-ocean-cyan" /> Tu feedback
      </h2>
      <p className="mt-1 text-sm text-muted">
        El estudiante lo verá en su experiencia. Al guardar, la entrega queda
        marcada como <strong className="text-foreground">revisada</strong>.
      </p>

      <form action={action} className="mt-4 space-y-3">
        <input type="hidden" name="submissionId" value={submissionId} />
        <textarea
          name="feedback"
          rows={5}
          defaultValue={defaultFeedback ?? ""}
          placeholder="Escribe tu devolución: qué estuvo bien, qué profundizar, próximos pasos…"
          className="w-full resize-none rounded-xl border border-card-border bg-ocean-surface/40 p-3 text-sm text-foreground placeholder:text-muted/60 focus:border-ocean-cyan/40 focus:outline-none"
        />

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}
        {state?.ok && (
          <p className="text-sm text-success">Feedback guardado · entrega revisada ✓</p>
        )}

        <Button type="submit" disabled={pending}>
          <Send className="size-4" />
          {pending
            ? "Guardando…"
            : alreadyReviewed
              ? "Actualizar feedback"
              : "Enviar feedback y marcar revisada"}
        </Button>
      </form>
    </section>
  );
}
