/* ============================================================
   Explorar — taxonomía del catálogo OCEOM: 8 categorías + filtros
   por tipo de experiencia + experiencias curadas del ecosistema.
   Datos puros (strings) para importarse desde Server y Client.
   ============================================================ */

export type ExploreColor =
  | "turquoise"
  | "green"
  | "cyan"
  | "blue"
  | "violet"
  | "magenta"
  | "gold";

/* ---------- 8 categorías ---------- */

export type CategoryKey =
  | "bienestar"
  | "conciencia"
  | "relaciones"
  | "cuerpo"
  | "creatividad"
  | "espiritualidad"
  | "mentalidad"
  | "finanzas";

export interface Category {
  key: CategoryKey;
  label: string;
  blurb: string;
  color: ExploreColor;
}

export const CATEGORIES: Category[] = [
  { key: "bienestar", label: "Bienestar emocional", blurb: "Sana y regula tus emociones", color: "magenta" },
  { key: "conciencia", label: "Conciencia y propósito", blurb: "Despierta y vive con sentido", color: "violet" },
  { key: "relaciones", label: "Relaciones", blurb: "Vínculos sanos y conscientes", color: "gold" },
  { key: "cuerpo", label: "Cuerpo y energía", blurb: "Vitalidad, descanso y movimiento", color: "turquoise" },
  { key: "creatividad", label: "Creatividad", blurb: "Expresa y crea desde tu esencia", color: "green" },
  { key: "espiritualidad", label: "Espiritualidad", blurb: "Conecta con algo más grande", color: "cyan" },
  { key: "mentalidad", label: "Mentalidad", blurb: "Enfoque, claridad y creencias", color: "blue" },
  { key: "finanzas", label: "Finanzas conscientes", blurb: "Abundancia alineada a tu propósito", color: "gold" },
];

/* ---------- Filtros por tipo ---------- */

export type ExploreKind =
  | "Meditaciones"
  | "Cursos"
  | "Talleres"
  | "Experiencias"
  | "Retos"
  | "Comunidad";

export const KINDS: ExploreKind[] = [
  "Meditaciones",
  "Cursos",
  "Talleres",
  "Experiencias",
  "Retos",
  "Comunidad",
];

/* ---------- Item de experiencia ---------- */

export interface ExploreItem {
  id: string;
  title: string;
  blurb: string;
  kind: ExploreKind;
  category: CategoryKey;
  color: ExploreColor;
  /** Etiqueta corta (duración / nº sesiones). */
  meta: string;
  href: string;
  /** live = disponible · soon = parte del ecosistema, próximamente. */
  status: "live" | "soon";
  enrolled?: boolean;
}

/* Experiencias curadas del ecosistema (mock hasta que tengan backend).
   Los programas reales se inyectan aparte desde la base de datos. */
export const CURATED: ExploreItem[] = [
  { id: "dw-calma", title: "Deep Waves · Calma profunda", blurb: "Meditación guiada para soltar la tensión del día.", kind: "Meditaciones", category: "cuerpo", color: "turquoise", meta: "12 min", href: "/deep-waves", status: "soon" },
  { id: "dw-sueno", title: "Deep Waves · Sueño reparador", blurb: "Hipnosis suave para un descanso profundo.", kind: "Meditaciones", category: "bienestar", color: "magenta", meta: "20 min", href: "/deep-waves", status: "soon" },
  { id: "dw-sonoro", title: "Viajes sonoros", blurb: "Frecuencias y paisajes sonoros para entrar en calma.", kind: "Meditaciones", category: "creatividad", color: "green", meta: "Audio", href: "/deep-waves", status: "soon" },
  { id: "punto-sanacion", title: "El Punto de la Sanación", blurb: "Taller intensivo para liberar y reprogramar tu energía vital.", kind: "Talleres", category: "bienestar", color: "magenta", meta: "Taller · 1 día", href: "/academia", status: "soon" },
  { id: "abundancia", title: "Abundancia consciente", blurb: "Reprograma tu relación con el dinero y la prosperidad.", kind: "Talleres", category: "finanzas", color: "gold", meta: "Taller", href: "/academia", status: "soon" },
  { id: "reconecta", title: "Reconecta contigo", blurb: "Experiencia inmersiva para volver a tu centro.", kind: "Experiencias", category: "espiritualidad", color: "cyan", meta: "Inmersiva", href: "/academia", status: "soon" },
  { id: "reto-presencia", title: "Reto 7 días · Presencia", blurb: "Una práctica diaria para habitar el ahora.", kind: "Retos", category: "mentalidad", color: "blue", meta: "7 días", href: "/academia", status: "soon" },
  { id: "reto-habitos", title: "Reto 21 días · Hábitos conscientes", blurb: "Instala hábitos que sostienen tu evolución.", kind: "Retos", category: "cuerpo", color: "turquoise", meta: "21 días", href: "/academia", status: "soon" },
  { id: "circulos", title: "Círculos en Vivo", blurb: "Encuentros en directo con Valeria y la comunidad.", kind: "Comunidad", category: "relaciones", color: "gold", meta: "En vivo", href: "/circulos", status: "soon" },
  { id: "comunidad", title: "Comunidad consciente", blurb: "Conecta con personas que, como tú, están evolucionando.", kind: "Comunidad", category: "relaciones", color: "violet", meta: "Espacio", href: "/circulo", status: "soon" },
];
