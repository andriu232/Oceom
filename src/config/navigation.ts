/** Claves de íconos (serializables) — el componente Lucide se resuelve en el
 *  cliente dentro de AppSidebar (no se puede pasar el componente cruzando el
 *  límite Server→Client). */
export type IconName =
  | "waves"
  | "compass"
  | "explore"
  | "route"
  | "sparkles"
  | "book"
  | "map"
  | "radio"
  | "audio"
  | "calendar"
  | "users"
  | "trending"
  | "user"
  | "dashboard"
  | "students"
  | "academia"
  | "roadmap"
  | "tools"
  | "store"
  | "membership"
  | "gift"
  | "library"
  | "clipboard"
  | "chart"
  | "settings"
  | "heart"
  | "flask"
  | "orbit";

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  hint?: string;
  /** Destino principal: aparece en la barra inferior móvil (bottom-nav). */
  primary?: boolean;
  /** Etiqueta corta para la barra inferior móvil (cae a `label`). */
  short?: string;
  /** Oculto del menú (reservado para un sprint futuro). La página sigue
   *  existiendo; solo no se enlaza. Para reactivar, quita esta bandera. */
  hidden?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Filtra los ítems `hidden` y descarta grupos que queden vacíos. Se usa en
 *  el layout antes de pasar la navegación al sidebar / bottom-nav. */
export function visibleGroups(groups: NavGroup[]): NavGroup[] {
  return groups
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.hidden) }))
    .filter((g) => g.items.length > 0);
}

/** Navegación del estudiante — agrupada al estilo del ecosistema, con
 *  lenguaje de marca OCEOM. */
export const studentGroups: NavGroup[] = [
  {
    label: "Aprender",
    items: [
      { label: "Santuario", href: "/santuario", icon: "waves", hint: "Inicio", primary: true, short: "Inicio" },
      { label: "Explorar", href: "/explorar", icon: "explore" },
      { label: "Academia", href: "/academia", icon: "academia" },
      { label: "Mi Ruta", href: "/mi-ruta", icon: "route", primary: true, short: "Mi Ruta" },
      { label: "Ruta del Viajero", href: "/ruta-viajero", icon: "compass", hint: "Viaje" },
      { label: "Hojas de Ruta", href: "/hojas-de-ruta", icon: "roadmap", hidden: true },
      { label: "Agendar Clase", href: "/agendar", icon: "calendar" },
      { label: "Círculos en Vivo", href: "/circulos", icon: "radio", primary: true, short: "Círculos" },
      { label: "Deep Waves", href: "/deep-waves", icon: "audio", hidden: true },
    ],
  },
  {
    label: "Ecosistema",
    items: [
      { label: "OMI", href: "/omi", icon: "sparkles", hint: "IA", primary: true, short: "OMI" },
      { label: "OCEOM LAB", href: "/lab", icon: "flask", hint: "Juego" },
      { label: "Comunidad", href: "/comunidad", icon: "users" },
      { label: "Biblioteca", href: "/biblioteca", icon: "library" },
      { label: "Galería Astral", href: "/galeria", icon: "orbit" },
      { label: "Mis Herramientas", href: "/herramientas", icon: "tools", hidden: true },
      { label: "Bitácora Interior", href: "/bitacora", icon: "book" },
      { label: "Mapa de Visión", href: "/mapa-vision", icon: "map" },
    ],
  },
  {
    label: "Mi cuenta",
    items: [
      { label: "Mi Evolución", href: "/mi-evolucion", icon: "trending" },
      { label: "Tienda", href: "/tienda", icon: "store" },
      { label: "Membresía", href: "/membresia", icon: "membership", hidden: true },
      { label: "Referidos", href: "/referidos", icon: "gift" },
      { label: "Mi Portal", href: "/mi-portal", icon: "user", primary: true, short: "Portal" },
      { label: "Ajustes", href: "/ajustes", icon: "settings" },
    ],
  },
];

/** Navegación de mentora / super admin — agrupada. */
export const adminGroups: NavGroup[] = [
  {
    label: "Gestión",
    items: [
      { label: "Panel", href: "/panel", icon: "dashboard", primary: true, short: "Panel" },
      { label: "Estudiantes", href: "/estudiantes", icon: "students", primary: true, short: "Alumnos" },
      { label: "Seguimiento", href: "/seguimiento", icon: "heart", primary: true, short: "Control" },
      { label: "Programas", href: "/programas", icon: "library", primary: true, short: "Rutas" },
      { label: "Biblioteca", href: "/biblioteca-admin", icon: "book" },
      { label: "Galería Astral", href: "/galeria-admin", icon: "orbit" },
      { label: "Tienda", href: "/tienda-admin", icon: "store" },
      { label: "Entregas", href: "/entregas", icon: "clipboard" },
      { label: "Agenda", href: "/agenda", icon: "calendar", primary: true, short: "Agenda" },
      { label: "Círculos", href: "/circulos-admin", icon: "radio", primary: true, short: "Círculos" },
    ],
  },
  {
    label: "IA & Datos",
    items: [
      { label: "Biblioteca IA", href: "/biblioteca-ia", icon: "sparkles" },
      { label: "Métricas", href: "/metricas", icon: "chart" },
    ],
  },
  {
    label: "Cuenta",
    items: [{ label: "Configuración", href: "/configuracion", icon: "settings" }],
  },
];
