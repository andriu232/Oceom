"use client";

import { useRef, useState, useTransition } from "react";
import { Check } from "lucide-react";
import { createDreamAction, type DreamState } from "@/lib/actions/suenos";
import { EMOTIONS } from "@/config/bitacora";
import { DREAM_TYPES } from "@/config/suenos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Compositor del Diario de sueños: relato, tipo de sueño, emoción sentida
 *  dentro del sueño, intensidad y símbolos. Mismo patrón que EntryComposer. */
export function DreamComposer() {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<DreamState>(undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const [emotion, setEmotion] = useState<string>("");
  const [dreamType, setDreamType] = useState<string>("normal");
  const [intensity, setIntensity] = useState<number>(5);

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await createDreamAction(undefined, formData);
      setState(res);
      if (res?.ok) {
        formRef.current?.reset();
        setEmotion("");
        setDreamType("normal");
        setIntensity(5);
      }
    });
  }

  return (
    <form ref={formRef} action={onSubmit} className="glass space-y-5 rounded-2xl p-6">
      <div className="space-y-1.5">
        <Label htmlFor="dream-content">¿Qué soñaste?</Label>
        <textarea
          id="dream-content"
          name="content"
          required
          rows={4}
          placeholder="Cuenta tu sueño con todo el detalle que recuerdes: lugares, personas, sensaciones…"
          className="w-full resize-y rounded-xl border border-card-border bg-ocean-surface/60 px-4 py-3 text-sm text-foreground placeholder:text-muted/70 outline-none transition-colors focus:border-ocean-violet focus:ring-2 focus:ring-[var(--ring)]"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="dream-title">Título (opcional)</Label>
        <Input id="dream-title" name="title" placeholder="Ponle un nombre a este sueño" />
      </div>

      {/* Tipo de sueño */}
      <div className="space-y-2">
        <Label>¿Qué tipo de sueño fue?</Label>
        <input type="hidden" name="dream_type" value={dreamType} />
        <div className="flex flex-wrap gap-2">
          {DREAM_TYPES.map((t) => {
            const active = dreamType === t.key;
            return (
              <button
                key={t.key}
                type="button"
                title={t.desc}
                onClick={() => setDreamType(t.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "border-ocean-violet/40 bg-ocean-violet/10 text-foreground"
                    : "border-card-border text-muted hover:text-foreground",
                )}
              >
                <span aria-hidden>{t.emoji}</span>
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Emoción dentro del sueño */}
      <div className="space-y-2">
        <Label>¿Qué emoción sentiste en el sueño?</Label>
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
          <Label htmlFor="dream-intensity">Intensidad de la emoción</Label>
          <span className="font-mono text-sm text-ocean-violet tabular-nums">
            {intensity}/10
          </span>
        </div>
        <input type="hidden" name="intensity" value={intensity} />
        <input
          id="dream-intensity"
          type="range"
          min={0}
          max={10}
          step={1}
          value={intensity}
          onChange={(ev) => setIntensity(Number(ev.target.value))}
          className="w-full accent-[var(--ocean-violet)]"
        />
      </div>

      {/* Símbolos */}
      <div className="space-y-1.5">
        <Label htmlFor="dream-symbols">Símbolos o elementos clave (opcional)</Label>
        <Input
          id="dream-symbols"
          name="symbols"
          placeholder="Ej. agua, una puerta, mi abuela, volar…"
        />
        <p className="text-xs text-muted">
          Los símbolos que se repiten en tus sueños suelen traer mensajes de tu interior.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar sueño"}
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
