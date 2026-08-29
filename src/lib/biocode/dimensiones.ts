import type { BiocodeNode } from "./nodes";

/* ============================================================
   Las dimensiones de la constelación (§4 del manual de experiencia).

   Cuando alguien toca una zona del cuerpo, el manual pide un mapa radial con
   la zona en el centro y alrededor: cuerpo, emociones, creencias, relaciones,
   historia, familia, hábitos, ejercicios y contenido OCEOM.

   Casi todas se llenan con lo que el nodo ya tiene guardado — es decir, la
   constelación se dibuja SIN esperar a la IA. Tres de ellas (historia,
   familia y relaciones) no son listas: son conversación, y abren una pregunta
   en vez de un puñado de opciones.

   Los colores salen de la identidad de OCEOM, como pide §17.
   ============================================================ */

export type Modo = "opciones" | "lectura" | "conversacion";

export interface Dimension {
  key: string;
  label: string;
  /** Cómo se comporta al abrirla. */
  modo: Modo;
  color: string;
  /** Qué saca del nodo. Solo para las de modo "opciones". */
  campo?: keyof Pick<
    BiocodeNode,
    "emotions" | "beliefs" | "patterns" | "behaviors" | "questions" | "exercises"
  >;
  /** Lo que se le pregunta a la persona al abrirla. */
  pregunta: string;
  /** Para las de conversación: con qué mensaje arranca la IA. */
  arranque?: string;
}

export const DIMENSIONES: Dimension[] = [
  {
    key: "cuerpo",
    label: "Información corporal",
    modo: "lectura",
    color: "#22d3ee",
    pregunta: "Lo que se sabe de esta zona",
  },
  {
    key: "emociones",
    label: "Emociones",
    modo: "opciones",
    campo: "emotions",
    color: "#818cf8",
    pregunta: "¿Cuál resuena contigo?",
  },
  {
    key: "creencias",
    label: "Creencias",
    modo: "opciones",
    campo: "beliefs",
    color: "#5eead4",
    pregunta: "¿Alguna de estas frases te suena de adentro?",
  },
  {
    key: "patrones",
    label: "Patrones",
    modo: "opciones",
    campo: "patterns",
    color: "#fbbf24",
    pregunta: "¿Se repite alguno de estos en tu vida?",
  },
  {
    key: "conductas",
    label: "Hábitos",
    modo: "opciones",
    campo: "behaviors",
    color: "#f472b6",
    pregunta: "¿Qué haces tú cuando esto aparece?",
  },
  {
    key: "historia",
    label: "Historia",
    modo: "conversacion",
    color: "#a78bfa",
    pregunta: "¿Cuándo empezó?",
    arranque:
      "Quiero explorar desde cuándo me pasa esto y qué estaba viviendo en ese momento.",
  },
  {
    key: "relaciones",
    label: "Relaciones",
    modo: "conversacion",
    color: "#fb7185",
    pregunta: "¿Cómo aparece esto en tus vínculos?",
    arranque: "Quiero explorar cómo aparece esto en mis relaciones.",
  },
  {
    key: "familia",
    label: "Familia",
    modo: "conversacion",
    color: "#4ade80",
    pregunta: "¿Alguien de tu familia vivió algo parecido?",
    arranque:
      "Quiero explorar si hay algún patrón familiar detrás de esto. Ve despacio conmigo.",
  },
  {
    key: "reflexion",
    label: "Reflexión",
    modo: "opciones",
    campo: "questions",
    color: "#e6f6ff",
    pregunta: "Elige la pregunta que quieras llevarte",
  },
  {
    key: "ejercicio",
    label: "Ejercicios",
    modo: "opciones",
    campo: "exercises",
    color: "#34d399",
    pregunta: "¿Cuál te llevas para esta semana?",
  },
];

/** Solo las dimensiones que este nodo puede llenar: una constelación con
 *  satélites vacíos promete algo que no hay detrás. */
export function dimensionesDe(nodo: BiocodeNode): Dimension[] {
  return DIMENSIONES.filter((d) => {
    if (d.modo === "conversacion") return true;
    if (d.key === "cuerpo") return Boolean(nodo.scientific_info || nodo.complementary_info);
    return d.campo ? (nodo[d.campo] ?? []).length > 0 : false;
  });
}

export function opcionesDe(nodo: BiocodeNode, d: Dimension): string[] {
  return d.campo ? (nodo[d.campo] ?? []) : [];
}

/* ── El mapa personal que se va armando (§7) ── */

export interface MapaNodo {
  id: string;
  texto: string;
  dimension: string;
}
export interface MapaArista {
  de: string;
  a: string;
}
export interface Mapa {
  nodos: MapaNodo[];
  aristas: MapaArista[];
}

export const MAPA_VACIO: Mapa = { nodos: [], aristas: [] };

/** Añade una elección al mapa, colgada del centro. Idempotente: volver a
 *  tocar la misma opción la quita, que es lo que la gente espera de algo
 *  que se ve seleccionado. */
export function alternarEnMapa(
  mapa: Mapa,
  centroId: string,
  dimension: string,
  texto: string,
): Mapa {
  const id = `${dimension}:${texto}`;
  const yaEsta = mapa.nodos.some((n) => n.id === id);
  if (yaEsta) {
    return {
      nodos: mapa.nodos.filter((n) => n.id !== id),
      aristas: mapa.aristas.filter((a) => a.a !== id && a.de !== id),
    };
  }
  return {
    nodos: [...mapa.nodos, { id, texto, dimension }],
    aristas: [...mapa.aristas, { de: centroId, a: id }],
  };
}

/** Lo que la persona eligió en una dimensión concreta. */
export function elegidasDe(mapa: Mapa, dimension: string): string[] {
  return mapa.nodos.filter((n) => n.dimension === dimension).map((n) => n.texto);
}
