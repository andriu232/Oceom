/* ============================================================
   MAPA DE PAREJAS (§11 del manual).

   Siete preguntas y, con las respuestas, el ciclo relacional que el documento
   dibuja: atracción → idealización → miedo a perder → sobreentrega →
   agotamiento → distanciamiento → dolor → repetición.

   Cada pregunta está atada a la etapa del ciclo que ilumina, así que el mapa
   no se arma con frases genéricas: se arma con lo que la persona escribió, en
   el punto del ciclo donde le pasa. Una etapa sin respuesta se queda en su
   descripción general, no se inventa.
   ============================================================ */

export interface EtapaCiclo {
  key: string;
  label: string;
  descripcion: string;
}

/** El ciclo del §11, en orden. La última vuelve a la primera. */
export const CICLO: EtapaCiclo[] = [
  { key: "atraccion", label: "Atracción", descripcion: "A quién eliges, una y otra vez." },
  { key: "idealizacion", label: "Idealización", descripcion: "Cómo empieza, y qué ves al principio." },
  { key: "miedo", label: "Miedo a perder", descripcion: "Lo que se enciende cuando la otra persona se aleja." },
  { key: "sobreentrega", label: "Sobreentrega", descripcion: "Lo que haces para que no se vaya." },
  { key: "agotamiento", label: "Agotamiento", descripcion: "Lo que aguantas hasta quedarte sin ti." },
  { key: "distanciamiento", label: "Distanciamiento", descripcion: "Cómo termina." },
  { key: "dolor", label: "Dolor", descripcion: "Lo que queda cuando termina." },
  { key: "repeticion", label: "Repetición", descripcion: "Lo que vuelve a pasar en la siguiente." },
];

export interface PreguntaPareja {
  etapa: string;
  pregunta: string;
  ayuda?: string;
}

/** Las siete preguntas literales del documento, cada una en su etapa. */
export const PREGUNTAS: PreguntaPareja[] = [
  {
    etapa: "atraccion",
    pregunta: "¿Qué tipo de personas eliges?",
    ayuda: "Piensa en las últimas relaciones, no en la idea de pareja.",
  },
  { etapa: "idealizacion", pregunta: "¿Cómo comienza la relación?" },
  {
    etapa: "miedo",
    pregunta: "¿Qué sientes cuando la persona se distancia?",
    ayuda: "En el cuerpo también, si lo notas ahí.",
  },
  { etapa: "sobreentrega", pregunta: "¿Qué haces para evitar perderla?" },
  {
    etapa: "agotamiento",
    pregunta: "¿Qué toleras que normalmente no querrías tolerar?",
  },
  { etapa: "distanciamiento", pregunta: "¿Cómo termina?" },
  { etapa: "repeticion", pregunta: "¿Qué suele repetirse?" },
];

export type RespuestasPareja = Record<string, string>;

/** Cómo se le cuenta el ciclo a la IA para que siga desde ahí. */
export function resumenParaLaIA(r: RespuestasPareja): string {
  const partes = CICLO.filter((e) => r[e.key]?.trim()).map(
    (e) => `${e.label}: ${r[e.key].trim()}`,
  );
  return [
    "Armé mi mapa de patrón relacional. Esto es lo que veo en mis relaciones:",
    ...partes,
    "Acompáñame a mirarlo sin juzgarme, con una pregunta a la vez.",
  ].join("\n");
}
