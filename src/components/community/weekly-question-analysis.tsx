"use client";

import { useState, useTransition } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { analyzeWeeklyQuestion } from "@/lib/community/actions";

/** Botón (solo mentora) que le pide a OMI un informe de todas las respuestas a
 *  la pregunta semanal, y lo muestra debajo. */
export function WeeklyQuestionAnalysis({ postId }: { postId: string }) {
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = () => {
    setError(null);
    start(async () => {
      const res = await analyzeWeeklyQuestion(postId);
      if (!res.ok) {
        setError(res.message ?? "No se pudo generar el informe.");
        return;
      }
      setReport(res.report ?? "");
    });
  };

  return (
    <div className="mt-4 border-t border-card-border pt-4">
      {!report ? (
        <button
          onClick={run}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-ocean-violet/15 px-4 py-2 text-sm font-medium text-ocean-violet ring-1 ring-ocean-violet/30 transition hover:bg-ocean-violet/25 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {pending ? "OMI está leyendo las respuestas…" : "Informe de OMI"}
        </button>
      ) : (
        <div className="rounded-2xl border border-ocean-violet/25 bg-ocean-violet/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ocean-violet">
            <Sparkles className="size-4" /> Informe de OMI
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {report}
          </div>
          <button
            onClick={run}
            disabled={pending}
            className="mt-3 text-xs text-muted transition-colors hover:text-ocean-violet"
          >
            {pending ? "Regenerando…" : "Regenerar informe"}
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
