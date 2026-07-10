"use client";

import { useRef, useState, useTransition } from "react";
import { Check, Sparkles } from "lucide-react";
import { createEntryAction, type BitacoraState } from "@/lib/actions/bitacora";
import { EMOTIONS } from "@/config/bitacora";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function EntryComposer() {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<BitacoraState>(undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const [emotion, setEmotion] = useState<string>("");
  const [intensity, setIntensity] = useState<number>(5);
  const [isInsight, setIsInsight] = useState(false);

  // Envía y, si guarda bien, limpia el formulario (en el callback, no en un efecto).
  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await createEntryAction(undefined, formData);
      setState(res);
      if (res?.ok) {
        formRef.current?.reset();
        setEmotion("");
        setIntensity(5);
        setIsInsight(false);
      }
    });
  }

  return (
    <form ref={formRef} action={onSubmit} className="glass space-y-5 rounded-2xl p-6">
      <div className="space-y-1.5">
        <Label htmlFor="content">¿Qué está pasando en tu interior?</Label>
        <textarea
          id="content"
          name="content"
          required
          rows={4}
          placeholder="Escribe libremente. Tu mentora acompaña tu proceso leyendo tu bitácora."
          className="w-full resize-y rounded-xl border border-card-border bg-ocean-surface/60 px-4 py-3 text-sm text-foreground placeholder:text-muted/70 outline-none transition-colors focus:border-ocean-cyan focus:ring-2 focus:ring-[var(--ring)]"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="title">Título (opcional)</Label>
        <Input id="title" name="title" placeholder="Ponle un nombre a este momento" />
      </div>

      {/* Emoción */}
      <div className="space-y-2">
        <Label>¿Qué emoción predomina?</Label>
        <input type="hidden" name="emotion" value={emotion} />
        <div className="flex flex-wrap gap-2">
          {EMOTIONS.map((e) => {
            const active = emotion === e.key;
            return (
              <button
                key={e.key}
                type="button"
                onClick={() => setEmotion(active ? "" : e.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "border-ocean-cyan/40 bg-ocean-cyan/10 text-foreground"
                    : "border-card-border text-muted hover:text-foreground",
                )}
              >
                <span aria-hidden>{e.emoji}</span>
                {e.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Intensidad */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="intensity">Intensidad</Label>
          <span className="font-mono text-sm text-ocean-cyan tabular-nums">{intensity}/10</span>
        </div>
        <input type="hidden" name="intensity" value={intensity} />
        <input
          id="intensity"
          type="range"
          min={0}
          max={10}
          step={1}
          value={intensity}
          onChange={(ev) => setIntensity(Number(ev.target.value))}
          className="w-full accent-[var(--ocean-cyan)]"
        />
      </div>

      {/* Insight */}
      <div className="flex flex-wrap gap-2">
        <input type="hidden" name="is_insight" value={isInsight ? "true" : "false"} />
        <button
          type="button"
          onClick={() => setIsInsight((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm transition-colors",
            isInsight
              ? "border-oceom-gold/40 bg-oceom-gold/10 text-oceom-gold"
              : "border-card-border text-muted hover:text-foreground",
          )}
        >
          <Sparkles className="size-4" /> Insight
        </button>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar entrada"}
        </Button>
        {state?.ok && (
          <span className="inline-flex items-center gap-1 text-sm text-success">
            <Check className="size-4" /> Guardada
          </span>
        )}
        {state?.error && <span className="text-sm text-danger">{state.error}</span>}
      </div>
    </form>
  );
}
