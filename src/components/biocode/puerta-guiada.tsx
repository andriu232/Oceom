"use client";

import { useState } from "react";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import type { OpcionPuerta, PuertaGuiada as Puerta } from "@/lib/biocode/puertas";

/* ============================================================
   Las puertas guiadas: creencias (§9), patrones (§10), merecimiento (§12) y
   sacrificio → propósito (§13).

   Una pregunta, las opciones literales del documento y sitio para escribir.
   El campo libre no es un adorno: el manual insiste en que la persona pueda
   contarlo con sus palabras, y las respuestas escritas suelen ser mejores
   que cualquier lista.
   ============================================================ */

export function PuertaGuiada({
  puerta,
  onElegido,
  onVolver,
  cargando,
}: {
  puerta: Puerta;
  onElegido: (respuesta: string, opcion: OpcionPuerta | null) => void;
  onVolver: () => void;
  cargando: boolean;
}) {
  const [texto, setTexto] = useState("");

  return (
    <div className="glass mx-auto w-full max-w-[760px] rounded-[24px] border border-ocean-violet/15 p-6 sm:p-8">
      <button
        onClick={onVolver}
        className="inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-ocean-violet"
      >
        <ArrowLeft className="size-3.5" /> Volver
      </button>

      <p className="mt-4 text-[0.7rem] uppercase tracking-wider text-muted/70">
        {puerta.titulo}
      </p>
      <h2 className="mt-1 font-display text-xl font-semibold text-foreground">
        {puerta.pregunta}
      </h2>
      {puerta.ayuda && <p className="mt-1 text-sm text-muted">{puerta.ayuda}</p>}

      <div className="mt-5 flex flex-wrap gap-2">
        {puerta.opciones.map((o) => (
          <button
            key={o.label}
            onClick={() => onElegido(o.label, o)}
            disabled={cargando}
            className="rounded-xl border border-card-border bg-ocean-surface/50 px-3.5 py-2 text-sm text-foreground/90 transition hover:border-ocean-violet/40 hover:text-ocean-violet disabled:opacity-60"
          >
            {o.label}
          </button>
        ))}
      </div>

      {puerta.placeholder && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (texto.trim()) onElegido(texto.trim(), null);
          }}
          className="mt-5 flex items-center gap-2"
        >
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={puerta.placeholder}
            className="h-12 flex-1 rounded-xl border border-card-border bg-ocean-surface/60 px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted/70 focus:border-ocean-violet focus:ring-2 focus:ring-[var(--ring)]"
          />
          <button
            type="submit"
            disabled={!texto.trim() || cargando}
            aria-label="Explorar"
            className="grid size-12 shrink-0 place-items-center rounded-xl bg-ocean-violet text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {cargando ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </button>
        </form>
      )}

      {cargando && !puerta.placeholder && (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted">
          <Loader2 className="size-4 animate-spin" /> Armando tu mapa…
        </p>
      )}
    </div>
  );
}
