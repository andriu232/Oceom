/** Claves de íconos (serializables) — el componente Lucide se resuelve en el
 *  cliente dentro de AppSidebar. Pasar el componente directamente cruzaría el
 *  límite Server→Client y React no lo permite (objeto con métodos). */
export type IconName =
  | "waves"
  | "compass"
  | "route"
  | "sparkles"
  | "book"
  | "map"
  | "radio"
  | "users"
  | "trending"
  | "user"
  | "dashboard"
  | "students"
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

/** Navegación del estudiante — lenguaje de marca OCEOM. */
export const studentNav: NavItem[] = [
  { label: "Santuario", href: "/santuario", icon: "waves", hint: "Tu inicio" },
  { label: "Explorar", href: "/explorar", icon: "compass" },
  { label: "Mi Ruta", href: "/mi-ruta", icon: "route" },
  { label: "Deep Waves", href: "/deep-waves", icon: "radio" },
  { label: "AURA", href: "/aura", icon: "sparkles", hint: "Tu guía IA" },
  { label: "Bitácora Interior", href: "/bitacora", icon: "book" },
  { label: "Mapa de Visión", href: "/mapa-vision", icon: "map" },
  { label: "Círculos en Vivo", href: "/circulos", icon: "users" },
  { label: "Círculo", href: "/circulo", icon: "users" },
  { label: "Mi Evolución", href: "/mi-evolucion", icon: "trending" },
  { label: "Mi Portal", href: "/mi-portal", icon: "user" },
];

/** Navegación de mentora / super admin. */
export const adminNav: NavItem[] = [
  { label: "Panel", href: "/panel", icon: "dashboard" },
  { label: "Estudiantes", href: "/estudiantes", icon: "students" },
  { label: "Programas", href: "/programas", icon: "library" },
  { label: "Entregas", href: "/entregas", icon: "clipboard" },
  { label: "Círculos", href: "/circulos-admin", icon: "radio" },
  { label: "Biblioteca IA", href: "/biblioteca-ia", icon: "sparkles" },
  { label: "Métricas", href: "/metricas", icon: "chart" },
  { label: "Configuración", href: "/configuracion", icon: "settings" },
];
