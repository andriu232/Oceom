"use client";

import { useState } from "react";

/* ============================================================
   La Ola Intuitiva (Mundo 2): cinco corrientes; en cada una el viajero
   elige guiándose SOLO por su intuición (sin pensar, sin respuestas
   correctas). Al final, una reflexión sobre su proceso de decisión.
   ============================================================ */

const ROUNDS: { prompt: string; a: string; b: string }[] = [
  { prompt: "Dos corrientes se abren frente a ti. Sin pensarlo, ¿cuál te llama?", a: "La corriente cálida", b: "La corriente fría" },
  { prompt: "En la penumbra brillan dos luces. Deja que tu cuerpo elija.", a: "La luz que pulsa", b: "La luz quieta" },
  { prompt: "Aparecen dos símbolos. ¿Cuál sientes tuyo hoy?", a: "La espiral", b: "El círculo" },
  { prompt: "Dos sonidos llegan de lejos. ¿Hacia cuál nadarías?", a: "Un canto grave", b: "Un tintineo agudo" },
  { prompt: "Al fondo, dos puertas de coral. Tu mano ya sabe.", a: "La puerta entreabierta", b: "La puerta cerrada" },
];

const ACKS = [
  "Bien. No lo pensaste: lo sentiste.",
  "Tu primera respuesta llegó antes que tus razones.",
  "Nota dónde sentiste la elección: ¿pecho, estómago, manos?",
  "La intuición no grita; susurra. La escuchaste.",
  "Última corriente. Deja que te lleve.",
];

const REFLECTIONS = [
  "Observa: ¿tus elecciones fueron rápidas o dudaste? La intuición se entrena notando la PRIMERA señal del cuerpo antes de que la mente opine. No hay respuestas correctas — hay percepción despierta.",
  "¿Qué sentiste distinto entre elegir 'sin pensar' y decidir razonando? Esa diferencia sutil es el músculo que este entrenamiento fortalece.",
  "Tus elecciones dibujan un estado interno de hoy. Si repites esta inmersión mañana, quizá el océano te lleve por otras corrientes — y eso también dice algo de ti.",
];

export function OlaGame({
  finish,
}: {
  finish: (metrics: Record<string, unknown>, reflexion?: string) => void;
}) {
  const [round, setRound] = useState(0);
  const [ack, setAck] = useState<string | null>(null);

  function choose() {
    setAck(ACKS[round]);
    setTimeout(() => {
      setAck(null);
      if (round + 1 < ROUNDS.length) setRound(round + 1);
      else
        finish(
          { rondas: ROUNDS.length },
          REFLECTIONS[Math.floor(Math.random() * REFLECTIONS.length)],
        );
    }, 1400);
  }

  const r = ROUNDS[round];
  return (
    <div className="space-y-5">
      <p className="text-xs text-muted">
        Corriente {round + 1} de {ROUNDS.length} · No pienses: siente y elige.
      </p>

      {ack ? (
        <p className="min-h-24 rounded-xl border border-ocean-violet/30 bg-ocean-violet/10 px-5 py-6 text-center font-display text-lg text-foreground/90 [animation:omi-msg-in_0.3s_ease_both]">
          {ack}
        </p>
      ) : (
        <>
          <p className="min-h-12 font-display text-lg font-semibold leading-snug text-foreground">
            {r.prompt}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[r.a, r.b].map((opt) => (
              <button
                key={opt}
                onClick={choose}
                className="group rounded-2xl border border-card-border bg-ocean-surface/40 px-5 py-7 text-center transition-all hover:-translate-y-0.5 hover:border-ocean-violet/50 hover:bg-ocean-violet/10 motion-reduce:transition-none"
              >
                <span className="font-display text-base font-semibold text-foreground/90 group-hover:text-ocean-violet">
                  {opt}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
