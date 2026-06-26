/** Claves de íconos (serializables) — el componente Lucide se resuelve en el
 *  cliente dentro de AppSidebar (no se puede pasar el componente cruzando el
 *  límite Server→Client). */
export type IconName =
  | "waves"
  | "compass"
  | "route"
  | "sparkles"
  | "book"
  | "map"
  | "radio"
  | "audio"
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
  | "settings";

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  hint?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Navegación del estudiante — agrupada al estilo del ecosistema, con
 *  lenguaje de marca OCEOM. */
export const studentGroups: NavGroup[] = [
  {
    label: "Aprender",
    items: [
      { label: "Santuario", href: "/santuario", icon: "waves", hint: "Inicio" },
      { label: "Academia", href: "/academia", icon: "academia" },
      { label: "Mi Ruta", href: "/mi-ruta", icon: "route" },
      { label: "Hojas de Ruta", href: "/hojas-de-ruta", icon: "roadmap" },
      { label: "Círculos en Vivo", href: "/circulos", icon: "radio" },
      { label: "Deep Waves", href: "/deep-waves", icon: "audio" },
    ],
  },
  {
    label: "Ecosistema",
    items: [
      { label: "AURA", href: "/aura", icon: "sparkles", hint: "IA" },
      { label: "Círculo", href: "/circulo", icon: "users" },
      { label: "Mis Herramientas", href: "/herramientas", icon: "tools" },
      { label: "Bitácora Interior", href: "/bitacora", icon: "book" },
      { label: "Mapa de Visión", href: "/mapa-vision", icon: "map" },
    ],
  },
  {
    label: "Mi cuenta",
    items: [
      { label: "Mi Evolución", href: "/mi-evolucion", icon: "trending" },
      { label: "Tienda", href: "/tienda", icon: "store" },
      { label: "Membresía", href: "/membresia", icon: "membership" },
      { label: "Referidos", href: "/referidos", icon: "gift" },
      { label: "Mi Portal", href: "/mi-portal", icon: "user" },
      { label: "Ajustes", href: "/ajustes", icon: "settings" },
    ],
  },
];

/** Navegación de mentora / super admin — agrupada. */
export const adminGroups: NavGroup[] = [
  {
    label: "Gestión",
    items: [
      { label: "Panel", href: "/panel", icon: "dashboard" },
      { label: "Estudiantes", href: "/estudiantes", icon: "students" },
      { label: "Programas", href: "/programas", icon: "library" },
      { label: "Entregas", href: "/entregas", icon: "clipboard" },
      { label: "Círculos", href: "/circulos-admin", icon: "radio" },
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
