"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createWeeklyQuestion } from "@/lib/community/actions";
import { buttonVariants } from "@/components/ui/button";

const FIELD =
  "w-full rounded-[6px] border border-card-border bg-ocean-surface/60 px-4 text-sm text-foreground outline-none placeholder:text-muted/70 focus:border-ocean-violet focus:ring-2 focus:ring-[var(--ring)]";

/** Composer de la "pregunta semanal" — visible solo para la mentora. Al lanzarla
 *  queda fija, destacada, y avisa (in-app + correo) a todos los estudiantes. */
export function WeeklyQuestionComposer({ spaceId }: { spaceId: string }) {
  const [body, setBody] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const submit = () => {
    if (!body.trim() || pending) return;
    setError(null);
    start(async () => {
      const res = await createWeeklyQuestion(spaceId, body);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setBody("");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <div className="mb-5 rounded-2xl border border-ocean-violet/30 bg-ocean-violet/5 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-ocean-violet" />
        <h3 className="text-sm font-semibold text-foreground">Pregunta semanal</h3>
        <span className="ml-auto text-[0.62rem] uppercase tracking-wide text-muted/60">
          Solo mentora · avisa a todos
        </span>
      </div>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="mt-3 w-full rounded-[6px] border border-card-border bg-ocean-surface/60 px-4 py-2.5 text-left text-sm text-muted/70 transition-colors hover:border-ocean-violet/50 hover:text-foreground"
        >
          Lanzar la pregunta de esta semana…
        </button>
      ) : (
        <div className="mt-3">
          <textarea
            autoFocus
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={5000}
            placeholder="Ej: ¿Qué emoción primó en ti esta semana?"
            className={`min-h-[80px] resize-y py-2.5 ${FIELD}`}
          />
          {error && <p className="mt-2 text-xs text-danger">{error}</p>}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs tabular-nums text-muted">
              {body.length}/5000
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setOpen(false);
                  setBody("");
                  setError(null);
                }}
                disabled={pending}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Cancelar
              </button>
              <button
                onClick={submit}
                disabled={pending || !body.trim()}
                className={buttonVariants({ size: "sm" })}
              >
                {pending ? "Publicando…" : "Lanzar pregunta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
