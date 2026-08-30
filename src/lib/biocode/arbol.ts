/* ============================================================
   MI ÁRBOL BIOCODE (§14) y las coincidencias para explorar (§15).

   La detección vive aquí como función pura, sin base de datos ni React, por
   dos razones: se puede probar (ver `arbol.test.ts`) y porque el lenguaje con
   que se enuncia una coincidencia es lo más delicado de toda la herramienta.
   El manual es explícito: se OBSERVA una coincidencia, se invita a
   explorarla, y se dice que no demuestra ninguna relación causal. Nunca
   "esto viene de tu abuela".
   ============================================================ */

export const NIVELES = [
  { key: "yo", label: "Yo" },
  { key: "padres", label: "Padres" },
  { key: "abuelos", label: "Abuelos" },
  { key: "bisabuelos", label: "Bisabuelos" },
] as const;

export type Nivel = (typeof NIVELES)[number]["key"];

export const ECONOMIAS = [
  { key: "holgada", label: "Holgada" },
  { key: "estable", label: "Estable" },
  { key: "dificil", label: "Difícil" },
  { key: "muy_dificil", label: "Muy difícil" },
] as const;

export interface Acontecimiento {
  texto: string;
  edad?: number | null;
}

export interface PersonaArbol {
  id: string;
  nivel: Nivel;
  parentesco: string | null;
  nombre: string | null;
  nacimiento: string | null;
  fallecimiento: string | null;
  profesion: string | null;
  economia: string | null;
  enfermedades: string[];
  acontecimientos: Acontecimiento[];
  separacion: boolean;
  migracion: boolean;
  perdida: boolean;
  conflicto: boolean;
  notas: string | null;
}

export interface Coincidencia {
  tipo:
    | "nombre"
    | "edad"
    | "enfermedad"
    | "separacion"
    | "migracion"
    | "perdida"
    | "conflicto"
    | "economia"
    | "profesion"
    | "fecha";
  texto: string;
  /** A quiénes involucra, con el nombre que la persona les puso. */
  personas: string[];
}

/** Cómo se le dice a alguien en la lista: su nombre, o su parentesco. */
export function comoSeLlama(p: PersonaArbol): string {
  return (p.nombre?.trim() || p.parentesco?.trim() || "Alguien") as string;
}

function normaliza(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Agrupa por una clave y devuelve los grupos con dos o más personas. */
function repetidos<T>(
  personas: PersonaArbol[],
  saca: (p: PersonaArbol) => T[],
  clave: (v: T) => string,
): Map<string, { valor: T; personas: PersonaArbol[] }> {
  const grupos = new Map<string, { valor: T; personas: PersonaArbol[] }>();
  for (const p of personas) {
    // Un mismo dato repetido dentro de UNA persona no es una coincidencia.
    const vistos = new Set<string>();
    for (const v of saca(p)) {
      const k = clave(v);
      if (!k || vistos.has(k)) continue;
      vistos.add(k);
      const g = grupos.get(k) ?? { valor: v, personas: [] };
      g.personas.push(p);
      grupos.set(k, g);
    }
  }
  for (const [k, g] of grupos) if (g.personas.length < 2) grupos.delete(k);
  return grupos;
}

/** Cuántas generaciones distintas toca un grupo. */
function generaciones(personas: PersonaArbol[]): number {
  return new Set(personas.map((p) => p.nivel)).size;
}

/**
 * Las coincidencias del §15.
 *
 * Solo se reportan las que aparecen en DOS PERSONAS O MÁS. Las de repetición
 * de hechos (separaciones, migraciones, pérdidas, conflictos, economía)
 * exigen además dos generaciones distintas: que dos hermanos se hayan
 * separado no es un patrón transgeneracional, y llamarlo así sería
 * exactamente el tipo de afirmación que el manual prohíbe.
 */
export function detectarCoincidencias(personas: PersonaArbol[]): Coincidencia[] {
  const out: Coincidencia[] = [];
  const nombres = (ps: PersonaArbol[]) => ps.map(comoSeLlama);

  // Nombres repetidos (el primer nombre basta).
  for (const [, g] of repetidos(
    personas,
    (p) => (p.nombre?.trim() ? [p.nombre.trim().split(/\s+/)[0]] : []),
    (v) => (normaliza(v).length >= 3 ? normaliza(v) : ""),
  )) {
    out.push({
      tipo: "nombre",
      texto: `El nombre ${g.valor} se repite en tu árbol.`,
      personas: nombres(g.personas),
    });
  }

  // Edades que se repiten en acontecimientos.
  for (const [, g] of repetidos(
    personas,
    (p) =>
      p.acontecimientos
        .map((a) => a.edad)
        .filter((e): e is number => typeof e === "number" && e > 0),
    (v) => String(v),
  )) {
    out.push({
      tipo: "edad",
      texto: `Registraste acontecimientos alrededor de los ${g.valor} años en más de una persona.`,
      personas: nombres(g.personas),
    });
  }

  // Enfermedades registradas más de una vez.
  for (const [, g] of repetidos(
    personas,
    (p) => p.enfermedades.filter((e) => e.trim().length > 2),
    (v) => normaliza(v),
  )) {
    out.push({
      tipo: "enfermedad",
      texto: `Aparece ${g.valor.toLowerCase()} en más de una persona de tu árbol.`,
      personas: nombres(g.personas),
    });
  }

  // Profesiones repetidas.
  for (const [, g] of repetidos(
    personas,
    (p) => (p.profesion?.trim() ? [p.profesion.trim()] : []),
    (v) => normaliza(v),
  )) {
    out.push({
      tipo: "profesion",
      texto: `Más de una persona de tu árbol se dedicó a algo parecido: ${g.valor.toLowerCase()}.`,
      personas: nombres(g.personas),
    });
  }

  // Fechas que caen el mismo día y mes.
  for (const [, g] of repetidos(
    personas,
    (p) => [p.nacimiento, p.fallecimiento].filter((f): f is string => Boolean(f)),
    (v) => v.slice(5, 10),
  )) {
    const [mes, dia] = g.valor.slice(5, 10).split("-");
    out.push({
      tipo: "fecha",
      texto: `Hay fechas que caen el mismo día del año (${dia}/${mes}).`,
      personas: nombres(g.personas),
    });
  }

  // Hechos que se repiten entre generaciones.
  const hechos: { campo: keyof PersonaArbol; tipo: Coincidencia["tipo"]; texto: string }[] = [
    {
      campo: "separacion",
      tipo: "separacion",
      texto: "Has registrado separaciones en distintas generaciones.",
    },
    {
      campo: "migracion",
      tipo: "migracion",
      texto: "Has registrado migraciones en distintas generaciones.",
    },
    {
      campo: "perdida",
      tipo: "perdida",
      texto: "Has registrado pérdidas importantes en distintas generaciones.",
    },
    {
      campo: "conflicto",
      tipo: "conflicto",
      texto: "Has registrado conflictos familiares en distintas generaciones.",
    },
  ];
  for (const h of hechos) {
    const quienes = personas.filter((p) => p[h.campo] === true);
    if (quienes.length >= 2 && generaciones(quienes) >= 2) {
      out.push({ tipo: h.tipo, texto: h.texto, personas: nombres(quienes) });
    }
  }

  // Patrón económico repetido entre generaciones.
  for (const [, g] of repetidos(
    personas,
    (p) => (p.economia ? [p.economia] : []),
    (v) => v,
  )) {
    if (generaciones(g.personas) < 2) continue;
    const label = ECONOMIAS.find((e) => e.key === g.valor)?.label ?? g.valor;
    out.push({
      tipo: "economia",
      texto: `La situación económica "${label.toLowerCase()}" se repite en distintas generaciones.`,
      personas: nombres(g.personas),
    });
  }

  return out;
}

/** El aviso que el manual exige junto a cualquier coincidencia (§15). */
export const AVISO_COINCIDENCIAS =
  "Estas coincidencias no demuestran una relación causal. Pueden utilizarse como punto de partida para una exploración personal y familiar.";
