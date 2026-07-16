"use client";

import { useState } from "react";

/* ============================================================
   Simbología Viva (Mundo 2): el viajero elige el símbolo que lo llama
   y recibe una reflexión + un micro-ejercicio ligado a ese símbolo.
   Los símbolos son SVG propios; las reflexiones rotan al azar.
   ============================================================ */

interface Simbolo {
  key: string;
  name: string;
  path: React.ReactNode;
  reflexiones: string[];
  ejercicio: string;
}

const randomReflexion = (s: Simbolo) =>
  s.reflexiones[Math.floor(Math.random() * s.reflexiones.length)];

const SIMBOLOS: Simbolo[] = [
  {
    key: "espiral",
    name: "La Espiral",
    path: <path d="M24 24 m0 -1 a1 1 0 0 1 1 1 a3 3 0 0 1 -3 3 a6 6 0 0 1 -6 -6 a9 9 0 0 1 9 -9 a12 12 0 0 1 12 12 a15 15 0 0 1 -15 15 a18 18 0 0 1 -18 -18" fill="none" strokeWidth="2.4" />,
    reflexiones: [
      "La espiral no vuelve al mismo punto: vuelve al mismo tema desde un lugar más profundo. Aquello que 'regresa' a tu vida quizá no es un ciclo estancado — es otra vuelta de tu proceso.",
      "Elegiste el símbolo del movimiento que crece hacia adentro. ¿Qué tema de tu vida estás visitando por segunda (o quinta) vez, pero ya no siendo la misma persona?",
    ],
    ejercicio: "Hoy, cuando notes un pensamiento repetido, en vez de rechazarlo pregúntale: ¿desde qué nueva vuelta de la espiral te estoy mirando?",
  },
  {
    key: "circulo",
    name: "El Círculo",
    path: <circle cx="24" cy="24" r="15" fill="none" strokeWidth="2.4" />,
    reflexiones: [
      "El círculo es lo completo sin esquinas donde esconderse. Hablarle de contención: ¿qué parte de ti pide ser sostenida sin condiciones hoy?",
      "Elegiste el símbolo de lo entero. Nada que agregar, nada que quitar. ¿En qué área de tu vida ya eres suficiente, aunque tu mente diga lo contrario?",
    ],
    ejercicio: "Dibuja (con el dedo, en el aire) un círculo lento alrededor de tu corazón y nombra en voz baja tres cosas que ya están completas en ti.",
  },
  {
    key: "ola",
    name: "La Ola",
    path: <path d="M8 28 q6 -10 12 0 t12 0 t12 0 M8 36 q6 -10 12 0 t12 0" fill="none" strokeWidth="2.4" />,
    reflexiones: [
      "La ola no se resiste a la orilla: llega, entrega y se recoge. ¿Qué estás sosteniendo que ya pide ser entregado?",
      "Elegiste el movimiento del océano: fuerza que no se tensa. Las emociones también son olas — ninguna se queda para siempre si la dejas moverse.",
    ],
    ejercicio: "La próxima emoción intensa de hoy, imagínala como una ola: nómbrala cuando sube, acompáñala en la cresta y suéltala cuando baje. No la retengas.",
  },
  {
    key: "semilla",
    name: "La Semilla",
    path: <path d="M24 38 q-10 -6 -8 -16 q8 -2 12 4 q4 -8 12 -6 q2 12 -10 18 q-3 2 -6 0z M24 38 v-14" fill="none" strokeWidth="2.2" />,
    reflexiones: [
      "La semilla trabaja en la oscuridad mucho antes de que algo se vea. Lo que hoy parece 'nada está pasando' puede ser exactamente la fase más fértil de tu proceso.",
      "Elegiste el símbolo de lo que aún no es visible. ¿Qué estás gestando que todavía no le muestras a nadie — y está bien que así sea?",
    ],
    ejercicio: "Escribe una intención de una sola línea en tu Bitácora y no se la cuentes a nadie por 7 días. Deja que germine en silencio.",
  },
  {
    key: "puerta",
    name: "La Puerta",
    path: <path d="M14 40 v-24 a10 10 0 0 1 20 0 v24 M14 40 h20 M28 28 a1.5 1.5 0 1 0 0.01 0" fill="none" strokeWidth="2.4" />,
    reflexiones: [
      "Una puerta solo existe donde hay un adentro que te espera. ¿Frente a qué umbral de tu vida estás parado, con la mano ya en la manija?",
      "Elegiste el símbolo del pasaje. Toda puerta pide dos cosas: soltar el lugar donde estás y confiar en el que sigue.",
    ],
    ejercicio: "Nombra UNA decisión que llevas tiempo postergando. No la tomes hoy — solo escríbela como pregunta clara. Abrir la pregunta ya es girar la manija.",
  },
  {
    key: "estrella",
    name: "La Estrella",
    path: <path d="M24 8 l4.2 10.6 L40 20 l-8.5 8 L34 40 l-10 -6.5 L14 40 l2.5 -12 L8 20 l11.8 -1.4 Z" fill="none" strokeWidth="2.2" />,
    reflexiones: [
      "La estrella no ilumina el camino entero: da un punto fijo para no perderse. ¿Cuál es tu norte hoy — la única cosa que, si la cuidas, ordena el resto?",
      "Elegiste luz lejana y constante. Hay guías que no se apagan aunque el cielo se nuble; ¿cuáles son las tuyas?",
    ],
    ejercicio: "Escribe tu 'estrella' de esta semana en una sola palabra. Ponla donde la veas cada mañana.",
  },
];

export function SimbologiaGame({
  finish,
}: {
  finish: (metrics: Record<string, unknown>, reflexion?: string) => void;
}) {
  const [chosen, setChosen] = useState<Simbolo | null>(null);
  const [reflexion, setReflexion] = useState<string>("");

  function pick(s: Simbolo) {
    setChosen(s);
    setReflexion(randomReflexion(s));
  }

  if (!chosen) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Seis símbolos flotan en la profundidad. No los analices: deja que uno te elija.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SIMBOLOS.map((s) => (
            <button
              key={s.key}
              onClick={() => pick(s)}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-card-border bg-ocean-surface/40 px-4 py-5 transition-all hover:-translate-y-0.5 hover:border-ocean-violet/50 motion-reduce:transition-none"
            >
              <svg viewBox="0 0 48 48" className="size-12 stroke-ocean-cyan transition-colors group-hover:stroke-ocean-violet">
                {s.path}
              </svg>
              <span className="text-sm font-medium text-foreground/85">{s.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 48 48" className="size-14 shrink-0 stroke-ocean-violet">
          {chosen.path}
        </svg>
        <p className="font-display text-lg font-semibold text-foreground">{chosen.name} te habló</p>
      </div>
      <p className="rounded-xl border border-ocean-violet/25 bg-ocean-violet/8 px-4 py-3.5 text-[0.95rem] leading-relaxed text-foreground/85">
        {reflexion}
      </p>
      <div className="rounded-xl border border-card-border bg-ocean-surface/40 px-4 py-3.5">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ocean-cyan">
          Micro-ejercicio del símbolo
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">{chosen.ejercicio}</p>
      </div>
      <button
        onClick={() =>
          finish(
            { simbolo: chosen.key },
            "El símbolo que te llama dice tanto de ti como lo que ves en él. Si quieres ir más profundo, llévaselo a OMI o escríbelo en tu Bitácora.",
          )
        }
        className="inline-flex items-center gap-2 rounded-xl bg-ocean-violet px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
      >
        Integrar y cerrar
      </button>
    </div>
  );
}
