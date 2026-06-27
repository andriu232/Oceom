/* ============================================================
   Ruta del Viajero — capa de gamificación de OCEOM.

   Convierte señales REALES del estudiante (experiencias
   completadas, check-ins, bitácora, fases) en una narrativa de
   viaje oceánico: puntos OCEOM, 7 etapas y 8 símbolos de
   evolución. Datos puros (solo strings) para poder importarse
   tanto desde Server como Client Components.
   ============================================================ */

export type JourneyColor =
  | "turquoise"
  | "green"
  | "cyan"
  | "blue"
  | "violet"
  | "magenta"
  | "gold";

/* ---------- Las 7 etapas del viaje ---------- */

export interface Etapa {
  key: string;
  name: string;
  /** Símbolo poético de la etapa. */
  symbol: string;
  tagline: string;
  description: string;
  /** Puntos OCEOM necesarios para entrar a la etapa. */
  threshold: number;
  color: JourneyColor;
}

export const ETAPAS: Etapa[] = [
  {
    key: "orilla",
    name: "La Orilla",
    symbol: "Ola",
    tagline: "Despiertas al llamado",
    description:
      "Llegas a la orilla del océano interior. Sientes el llamado y das tu primer paso consciente.",
    threshold: 0,
    color: "turquoise",
  },
  {
    key: "marea",
    name: "La Marea",
    symbol: "Concha",
    tagline: "Te dejas mover",
    description:
      "Te entregas al movimiento. Cada experiencia te mece y empiezas a soltar lo que pesaba.",
    threshold: 300,
    color: "green",
  },
  {
    key: "corriente",
    name: "La Corriente",
    symbol: "Espiral",
    tagline: "Encuentras tu ritmo",
    description:
      "Hallas tu propia corriente. Tu práctica se vuelve constante y tu energía toma dirección.",
    threshold: 700,
    color: "cyan",
  },
  {
    key: "profundidad",
    name: "La Profundidad",
    symbol: "Ballena",
    tagline: "Te adentras en ti",
    description:
      "Desciendes a tus aguas profundas. Te encuentras con tu verdad y tu visión se aclara.",
    threshold: 1200,
    color: "blue",
  },
  {
    key: "arrecife",
    name: "El Arrecife",
    symbol: "Corazón",
    tagline: "Florece tu mundo interior",
    description:
      "Tu mundo interior florece como un arrecife: vida, color y vínculos conscientes.",
    threshold: 1800,
    color: "violet",
  },
  {
    key: "abismo",
    name: "El Abismo",
    symbol: "Luna",
    tagline: "Integras tu sombra",
    description:
      "Te sumerges en el abismo para integrar tu sombra. De la oscuridad nace tu mayor poder.",
    threshold: 2500,
    color: "magenta",
  },
  {
    key: "infinito",
    name: "El Océano Infinito",
    symbol: "Infinito",
    tagline: "Eres uno con el todo",
    description:
      "Te disuelves en el océano infinito. Vives desde tu esencia, en unidad con el todo.",
    threshold: 3500,
    color: "gold",
  },
];

/* ---------- Los 8 símbolos de evolución (insignias) ---------- */

export type BadgeKey =
  | "ola"
  | "concha"
  | "espiral"
  | "ballena"
  | "luna"
  | "corazon"
  | "ojo"
  | "infinito";

export interface Insignia {
  key: BadgeKey;
  name: string;
  /** Título honorífico que se gana al desbloquear. */
  title: string;
  /** Cómo se consigue (objetivo). */
  goal: string;
  color: JourneyColor;
}

export const INSIGNIAS: Insignia[] = [
  { key: "ola", name: "Ola", title: "Primer movimiento", goal: "Completa tu primera experiencia", color: "turquoise" },
  { key: "concha", name: "Concha", title: "Escucha interior", goal: "Registra 3 check-ins emocionales", color: "green" },
  { key: "espiral", name: "Espiral", title: "Ritmo constante", goal: "Completa 5 experiencias", color: "cyan" },
  { key: "ballena", name: "Ballena", title: "Inmersión profunda", goal: "Completa una fase entera de tu programa", color: "blue" },
  { key: "luna", name: "Luna", title: "Ciclos conscientes", goal: "Registra 7 check-ins emocionales", color: "violet" },
  { key: "corazon", name: "Corazón", title: "Apertura emocional", goal: "Escribe tu primera entrada de bitácora", color: "magenta" },
  { key: "ojo", name: "Ojo interior", title: "Visión clara", goal: "Alcanza la etapa La Profundidad", color: "blue" },
  { key: "infinito", name: "Infinito", title: "Maestría", goal: "Alcanza El Océano Infinito", color: "gold" },
];

/* ---------- Fórmula de puntos OCEOM ---------- */

export const POINTS = {
  lesson: 100,
  checkin: 20,
  journal: 15,
  base: 50,
} as const;

/* ---------- Estado del viajero ---------- */

export interface TravelerSignals {
  completedLessons: number;
  totalLessons: number;
  progressPct: number;
  /** Fases completadas al 100%. */
  completedPhases: number;
  checkins: number;
  journalEntries: number;
  hasActiveProgram: boolean;
}

export interface TravelerInsignia extends Insignia {
  unlocked: boolean;
}

export interface TravelerState {
  points: number;
  /** Nivel = índice de etapa + 1. */
  level: number;
  etapaIndex: number;
  etapa: Etapa;
  nextEtapa: Etapa | null;
  /** Puntos acumulados dentro de la etapa actual. */
  pointsIntoEtapa: number;
  /** Puntos que faltan para la siguiente etapa (null si es la última). */
  pointsToNext: number | null;
  /** Progreso 0-100 dentro de la etapa actual. */
  etapaPct: number;
  /** Insignias desbloqueadas (cristales). */
  cristales: number;
  insignias: TravelerInsignia[];
}

/** Calcula el estado del viajero a partir de señales reales (función pura). */
export function computeTraveler(s: TravelerSignals): TravelerState {
  const points =
    s.completedLessons * POINTS.lesson +
    s.checkins * POINTS.checkin +
    s.journalEntries * POINTS.journal +
    (s.hasActiveProgram ? POINTS.base : 0);

  // Etapa actual = la de mayor threshold que ya superamos.
  let etapaIndex = 0;
  for (let i = 0; i < ETAPAS.length; i++) {
    if (points >= ETAPAS[i].threshold) etapaIndex = i;
  }
  const etapa = ETAPAS[etapaIndex];
  const nextEtapa = ETAPAS[etapaIndex + 1] ?? null;

  const pointsIntoEtapa = points - etapa.threshold;
  const pointsToNext = nextEtapa ? nextEtapa.threshold - points : null;
  const span = nextEtapa ? nextEtapa.threshold - etapa.threshold : 1;
  const etapaPct = nextEtapa
    ? Math.min(100, Math.round((pointsIntoEtapa / span) * 100))
    : 100;

  const unlocked: Record<BadgeKey, boolean> = {
    ola: s.completedLessons >= 1,
    concha: s.checkins >= 3,
    espiral: s.completedLessons >= 5,
    ballena: s.completedPhases >= 1,
    luna: s.checkins >= 7,
    corazon: s.journalEntries >= 1,
    ojo: etapaIndex >= 3,
    infinito: etapaIndex >= 6,
  };

  const insignias: TravelerInsignia[] = INSIGNIAS.map((b) => ({
    ...b,
    unlocked: unlocked[b.key],
  }));

  return {
    points,
    level: etapaIndex + 1,
    etapaIndex,
    etapa,
    nextEtapa,
    pointsIntoEtapa,
    pointsToNext,
    etapaPct,
    cristales: insignias.filter((b) => b.unlocked).length,
    insignias,
  };
}
