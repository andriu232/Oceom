"use client";

import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { EMOCIONES, ZONAS, type Emocion, type ZonaCuerpo } from "@/lib/biocode/emociones";

/* ============================================================
   "¿QUÉ ESTÁS SINTIENDO?" (§8 del manual).

   Dos pasos: la emoción y después dónde se siente en el cuerpo. El segundo
   paso es el que arma el vínculo EMOCIÓN → CUERPO, y es también el que hace
   que esta puerta no sea una lista de palabras: obliga a bajar la emoción al
   cuerpo, que es de lo que trata el método.
   ============================================================ */

export function SelectorEmocional({
  onElegido,
  onVolver,
  cargando,
}: {
  onElegido: (emocion: Emocion, zona: ZonaCuerpo) => void;
  onVolver: () => void;
  cargando: boolean;
}) {
  const [emocion, setEmocion] = useState<Emocion | null>(null);

  return (
    <div className="glass mx-auto w-full max-w-[760px] rounded-[24px] border border-ocean-violet/15 p-6 sm:p-8">
      <button
        onClick={() => (emocion ? setEmocion(null) : onVolver())}
        className="inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-ocean-violet"
      >
        <ArrowLeft className="size-3.5" />
        {emocion ? "Elegir otra emoción" : "Volver"}
      </button>

      {!emocion ? (
        <>
          <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
            ¿Qué estás sintiendo?
          </h2>
          <p className="mt-1 text-sm text-muted">
            Elige la que más se parezca a lo de hoy. No tiene que ser exacta.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {EMOCIONES.map((e) => (
              <button
                key={e.label}
                onClick={() => setEmocion(e)}
                className={cn(
                  "rounded-xl border px-3.5 py-2 text-sm transition hover:brightness-125",
                  e.agradable
                    ? "border-ocean-glow/30 bg-ocean-glow/8 text-ocean-glow"
                    : "border-card-border bg-ocean-surface/50 text-foreground/90 hover:border-ocean-violet/40",
                )}
              >
                {e.label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
            ¿Dónde sientes {emocion.label.toLowerCase()} en tu cuerpo?
          </h2>
          <p className="mt-1 text-sm text-muted">
            Cierra los ojos un segundo si te ayuda. No hay respuesta correcta.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {ZONAS.map((z) => (
              <button
                key={z.label}
                onClick={() => onElegido(emocion, z)}
                disabled={cargando}
                className="rounded-xl border border-card-border bg-ocean-surface/50 px-3.5 py-2 text-sm text-foreground/90 transition hover:border-ocean-violet/40 hover:text-ocean-violet disabled:opacity-60"
              >
                {z.label}
              </button>
            ))}
          </div>
          {cargando && (
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted">
              <Loader2 className="size-4 animate-spin" /> Armando tu mapa…
            </p>
          )}
        </>
      )}
    </div>
  );
}
