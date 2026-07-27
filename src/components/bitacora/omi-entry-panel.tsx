"use client";

import { useState, useTransition } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { interpretDreamAction } from "@/lib/actions/suenos";
import { journalFeedbackAction } from "@/lib/actions/bitacora";

/** Panel de OMI para una entrada de sueño o bitácora: botón para pedir la
 *  interpretación/feedback y el resultado (persistido) debajo. */
export function OmiEntryPanel({
  entryId,
  kind,
  initial,
}: {
  entryId: string;
  kind: "dream" | "journal";
  initial: string | null;
}) {
  const [text, setText] = useState<string | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = () => {
    setError(null);
    start(async () => {
      const res =
        kind === "dream"
          ? await interpretDreamAction(entryId)
          : await journalFeedbackAction(entryId);
      if (!res.ok) {
        setError(res.error ?? "OMI no pudo responder. Inténtalo de nuevo.");
        return;
      }
      setText(res.text ?? "");
    });
  };

  const L =
    kind === "dream"
      ? {
          cta: "Interpretar con OMI",
          loading: "OMI está soñando contigo…",
          title: "Interpretación de OMI",
        }
      : {
          cta: "Pedir feedback de OMI",
          loading: "OMI te está leyendo…",
          title: "OMI te acompaña",
        };

  return (
    <div className="mt-4 border-t border-card-border pt-4">
      {!text ? (
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
          {pending ? L.loading : L.cta}
        </button>
      ) : (
        <div className="rounded-2xl border border-ocean-violet/25 bg-ocean-violet/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ocean-violet">
            <Sparkles className="size-4" /> {L.title}
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {text}
          </div>
          <button
            onClick={run}
            disabled={pending}
            className="mt-3 text-xs text-muted transition-colors hover:text-ocean-violet"
          >
            {pending ? "Regenerando…" : "Regenerar"}
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
