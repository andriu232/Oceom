/* ============================================================
   OCEOM LAB — Laboratorio de Percepción y Expansión de la Consciencia.
   Catálogo serializable (server-safe) de mundos, juegos y niveles del
   Viajero. Para sumar un mundo o juego nuevo basta con agregarlo aquí:
   el hub y la navegación se arman desde este archivo.
   ============================================================ */

export interface LabGame {
  key: string;
  name: string;
  desc: string;
  /** Ruta jugable; si falta, se muestra como "Próximamente". */
  href?: string;
  /** En beta: jugable SOLO para mentora/admin (los estudiantes ven "Pronto"). */
  beta?: boolean;
  entrena: string[];
}

export interface LabWorld {
  n: number;
  key: string;
  name: string;
  objetivo: string;
  /** Clases de acento (icono/borde) por mundo. */
  accent: string;
  games: LabGame[];
}

export const LAB_WORLDS: LabWorld[] = [
  {
    n: 1,
    key: "sentidos",
    name: "Despertar de los Sentidos",
    objetivo: "Entrenar la atención y la percepción sensorial.",
    accent: "text-ocean-cyan bg-ocean-cyan/12 ring-ocean-cyan/25",
    games: [
      {
        key: "observador",
        name: "Observador Profundo",
        desc: "Observa la escena unos segundos y responde sobre sus detalles.",
        href: "/lab/observador",
        entrena: ["memoria visual", "observación", "concentración"],
      },
      {
        key: "escucha",
        name: "Escucha del Océano",
        desc: "Identifica cambios y patrones en los sonidos del océano.",
        entrena: ["atención auditiva", "memoria auditiva"],
      },
      {
        key: "cuerpo",
        name: "Sensibilidad Corporal",
        desc: "Meditación guiada para registrar sensaciones internas.",
        entrena: ["conciencia corporal", "interocepción"],
      },
    ],
  },
  {
    n: 2,
    key: "intuicion",
    name: "Intuición y Percepción",
    objetivo: "Entrenar la decisión intuitiva y la reflexión sobre cómo percibes.",
    accent: "text-ocean-violet bg-ocean-violet/12 ring-ocean-violet/25",
    games: [
      {
        key: "ola-intuitiva",
        name: "La Ola Intuitiva",
        desc: "Elige corrientes guiándote solo por tu intuición. Sin respuestas correctas.",
        href: "/lab/ola-intuitiva",
        entrena: ["intuición", "auto-observación"],
      },
      {
        key: "simbologia",
        name: "Simbología Viva",
        desc: "Elige un símbolo y recibe una reflexión o ejercicio.",
        href: "/lab/simbologia",
        beta: true,
        entrena: ["imaginación", "reflexión"],
      },
      {
        key: "caja",
        name: "Caja Misteriosa",
        desc: "Describe el objeto antes de verlo y compara tu percepción.",
        href: "/lab/caja",
        beta: true,
        entrena: ["imaginación", "descripción"],
      },
    ],
  },
  {
    n: 3,
    key: "exploracion",
    name: "Exploración Remota",
    objetivo: "Entrenar la imaginación, la observación y la capacidad descriptiva.",
    accent: "text-oceom-turquoise bg-oceom-turquoise/12 ring-oceom-turquoise/25",
    games: [
      {
        key: "remota",
        name: "Visión Remota",
        desc: "Registra lo que imaginas antes de ver la imagen y compara tu proceso.",
        href: "/lab/remota",
        beta: true,
        entrena: ["imaginación", "descripción", "observación"],
      },
    ],
  },
  {
    n: 4,
    key: "colaborativa",
    name: "Conexión Colaborativa",
    objetivo: "Desarrollar atención compartida y comunicación.",
    accent: "text-ocean-glow bg-ocean-glow/12 ring-ocean-glow/25",
    games: [
      {
        key: "duo",
        name: "Sintonía a Dos",
        desc: "Multijugador: un viajero observa una figura, el otro la identifica.",
        entrena: ["atención compartida", "comunicación"],
      },
    ],
  },
  {
    n: 5,
    key: "concentracion",
    name: "Concentración",
    objetivo: "Incrementar la capacidad de sostener la atención.",
    accent: "text-ocean-cyan bg-ocean-cyan/12 ring-ocean-cyan/25",
    games: [
      {
        key: "secuencias",
        name: "Secuencias Luminosas",
        desc: "Memoriza y repite secuencias de luz que crecen con cada ola.",
        href: "/lab/secuencias",
        entrena: ["memoria secuencial", "atención sostenida"],
      },
      {
        key: "punto-fijo",
        name: "Punto Fijo",
        desc: "Sostén la mirada en un punto y registra cuándo cambia.",
        href: "/lab/punto-fijo",
        beta: true,
        entrena: ["atención sostenida"],
      },
      {
        key: "mandalas",
        name: "Mandalas Dinámicos",
        desc: "Sigue patrones visuales en movimiento.",
        entrena: ["atención visual"],
      },
    ],
  },
  {
    n: 6,
    key: "respiracion",
    name: "Respiración Consciente",
    objetivo: "Regular tu sistema nervioso con visuales sincronizados al respirar.",
    accent: "text-oceom-turquoise bg-oceom-turquoise/12 ring-oceom-turquoise/25",
    games: [
      {
        key: "respiracion",
        name: "Corrientes de Respiración",
        desc: "Inhala, sostén y exhala con las olas y la bioluminiscencia.",
        href: "/lab/respiracion",
        entrena: ["regulación", "presencia"],
      },
    ],
  },
  {
    n: 7,
    key: "bilateral",
    name: "Integración Bilateral",
    objetivo: "Entrenar coordinación y atención entre ambos hemisferios.",
    accent: "text-ocean-violet bg-ocean-violet/12 ring-ocean-violet/25",
    games: [
      {
        key: "infinito",
        name: "Símbolo Infinito",
        desc: "Sigue el símbolo infinito y coordina movimientos cruzados.",
        entrena: ["coordinación", "atención dividida"],
      },
    ],
  },
  {
    n: 8,
    key: "estereoscopicas",
    name: "Imágenes Estereoscópicas",
    objetivo: "Descubrir y sostener imágenes tridimensionales ocultas.",
    accent: "text-oceom-gold bg-oceom-gold/12 ring-oceom-gold/25",
    games: [
      {
        key: "estereo",
        name: "Profundidad Oculta",
        desc: "Encuentra la imagen oculta y sostenla el mayor tiempo posible.",
        entrena: ["convergencia visual", "atención"],
      },
    ],
  },
];

/** Juegos jugables hoy (con href), indexados por key — para validar en el server. */
export const LAB_PLAYABLE: Record<string, { world: number; name: string }> =
  Object.fromEntries(
    LAB_WORLDS.flatMap((w) =>
      w.games.filter((g) => g.href).map((g) => [g.key, { world: w.n, name: g.name }]),
    ),
  );

/* ── Niveles del Viajero ── */

export interface TravelerLevel {
  n: number;
  name: string;
  minXp: number;
}

export const TRAVELER_LEVELS: TravelerLevel[] = [
  { n: 1, name: "Explorador", minXp: 0 },
  { n: 2, name: "Navegante", minXp: 200 },
  { n: 3, name: "Buceador", minXp: 500 },
  { n: 4, name: "Cartógrafo Interior", minXp: 1000 },
  { n: 5, name: "Guardián del Océano", minXp: 1800 },
  { n: 6, name: "Maestro de las Profundidades", minXp: 3000 },
  { n: 7, name: "Arquitecto de la Consciencia", minXp: 5000 },
];

export interface TravelerStatus {
  level: TravelerLevel;
  next: TravelerLevel | null;
  /** Progreso 0-100 hacia el siguiente nivel (100 si es el máximo). */
  pct: number;
}

/** Nivel del Viajero para un total de XP. */
export function travelerForXp(xp: number): TravelerStatus {
  let level = TRAVELER_LEVELS[0];
  for (const l of TRAVELER_LEVELS) if (xp >= l.minXp) level = l;
  const next = TRAVELER_LEVELS.find((l) => l.minXp > level.minXp) ?? null;
  const pct = next
    ? Math.min(100, Math.round(((xp - level.minXp) / (next.minXp - level.minXp)) * 100))
    : 100;
  return { level, next, pct };
}
