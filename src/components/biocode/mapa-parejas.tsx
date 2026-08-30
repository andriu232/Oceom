"use client";

import { useState } from "react";
import { ArrowLeft, ArrowDown, RotateCcw, MessageCircle } from "lucide-react";
import {
  CICLO,
  PREGUNTAS,
  resumenParaLaIA,
  type RespuestasPareja,
} from "@/lib/biocode/parejas";

/* ============================================================
   MAPA DE PAREJAS (§11).

   Las siete preguntas van de UNA EN UNA, como insiste el manual: una batería
   de siete campos en pantalla se responde con monosílabos, y aquí lo que
   importa es lo que la persona escribe.

   Después se dibuja el ciclo con sus propias palabras en cada etapa. Se puede
   saltar cualquier pregunta: una etapa sin respuesta se queda con su
   descripción general y no se rellena con nada inventado.
   ============================================================ */

export function MapaParejas({
  onListo,
  onVolver,
}: {
  onListo: (respuestas: RespuestasPareja, resumen: string) => void;
  onVolver: () => void;
}) {
  const [i, setI] = useState(0);
  const [respuestas, setRespuestas] = useState<RespuestasPareja>({});
  const [texto, setTexto] = useState("");
  const [verCiclo, setVerCiclo] = useState(false);

  const p = PREGUNTAS[i];
  const ultima = i === PREGUNTAS.length - 1;

  function siguiente(saltar = false) {
    const r = saltar || !texto.trim()
      ? respuestas
      : { ...respuestas, [p.etapa]: texto.trim() };
    setRespuestas(r);
    setTexto("");
    if (ultima) setVerCiclo(true);
    else setI((x) => x + 1);
  }

  if (verCiclo) {
    return (
      <div className="glass mx-auto w-full max-w-[760px] rounded-[24px] border border-ocean-violet/15 p-6 sm:p-8">
        <button
          onClick={onVolver}
          className="inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-ocean-violet"
        >
          <ArrowLeft className="size-3.5" /> Volver
        </button>

        <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
          Tu mapa de patrón relacional
        </h2>
        <p className="mt-1 text-sm text-muted">
          Esto no es un veredicto sobre ti ni sobre nadie: es lo que tú
          describiste, puesto en orden.
        </p>

        <ol className="mt-6 space-y-1">
          {CICLO.map((e, n) => {
            const dicho = respuestas[e.key];
            return (
              <li key={e.key}>
                <div
                  className={
                    dicho
                      ? "rounded-2xl border border-ocean-violet/30 bg-ocean-violet/8 p-4"
                      : "rounded-2xl border border-card-border bg-ocean-surface/30 p-4"
                  }
                >
                  <p className="text-[0.68rem] uppercase tracking-wider text-ocean-violet">
                    {e.label}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground/90">
                    {dicho ?? <span className="text-muted">{e.descripcion}</span>}
                  </p>
                </div>
                {n < CICLO.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowDown className="size-3.5 text-muted/50" />
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        <p className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-ocean-violet/30 py-2.5 text-xs text-muted">
          <RotateCcw className="size-3.5" /> y vuelve a empezar
        </p>

        <button
          onClick={() => onListo(respuestas, resumenParaLaIA(respuestas))}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ocean-violet px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110"
        >
          <MessageCircle className="size-4" /> Explorar este ciclo conmigo
        </button>
      </div>
    );
  }

  return (
    <div className="glass mx-auto w-full max-w-[680px] rounded-[24px] border border-ocean-violet/15 p-6 sm:p-8">
      <button
        onClick={onVolver}
        className="inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-ocean-violet"
      >
        <ArrowLeft className="size-3.5" /> Volver
      </button>

      <p className="mt-4 text-[0.68rem] uppercase tracking-wider text-muted/70">
        Mapa de parejas · {i + 1} de {PREGUNTAS.length}
      </p>
      <h2 className="mt-1 font-display text-xl font-semibold text-foreground">
        {p.pregunta}
      </h2>
      {p.ayuda && <p className="mt-1 text-sm text-muted">{p.ayuda}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          siguiente();
        }}
        className="mt-5"
      >
        <textarea
          autoFocus
          rows={3}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escríbelo con tus palabras…"
          className="w-full resize-y rounded-xl border border-card-border bg-ocean-surface/60 px-4 py-3 text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted/70 focus:border-ocean-violet focus:ring-2 focus:ring-[var(--ring)]"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="submit"
            className="h-10 rounded-xl bg-ocean-violet px-5 text-sm font-medium text-white transition hover:brightness-110"
          >
            {ultima ? "Ver mi ciclo" : "Siguiente"}
          </button>
          <button
            type="button"
            onClick={() => siguiente(true)}
            className="text-xs text-muted transition hover:text-ocean-violet"
          >
            Saltar esta
          </button>
        </div>
      </form>

      <div className="mt-6 flex gap-1">
        {PREGUNTAS.map((_, n) => (
          <span
            key={n}
            className={`h-1 flex-1 rounded-full ${
              n <= i ? "bg-ocean-violet" : "bg-card-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
