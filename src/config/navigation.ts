import {
  Waves,
  Compass,
  Route,
  Sparkles,
  BookOpenText,
  Map,
  Radio,
  Users,
  TrendingUp,
  CircleUser,
  LayoutDashboard,
  GraduationCap,
  Library,
  ClipboardCheck,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  hint?: string;
}

/** Navegación del estudiante — lenguaje de marca OCEOM. */
export const studentNav: NavItem[] = [
  { label: "Santuario", href: "/santuario", icon: Waves, hint: "Tu inicio" },
  { label: "Explorar", href: "/explorar", icon: Compass },
  { label: "Mi Ruta", href: "/mi-ruta", icon: Route },
  { label: "Deep Waves", href: "/deep-waves", icon: Radio },
  { label: "AURA", href: "/aura", icon: Sparkles, hint: "Tu guía IA" },
  { label: "Bitácora Interior", href: "/bitacora", icon: BookOpenText },
  { label: "Mapa de Visión", href: "/mapa-vision", icon: Map },
  { label: "Círculos en Vivo", href: "/circulos", icon: Users },
  { label: "Círculo", href: "/circulo", icon: Users },
  { label: "Mi Evolución", href: "/mi-evolucion", icon: TrendingUp },
  { label: "Mi Portal", href: "/mi-portal", icon: CircleUser },
];

/** Navegación de mentora / super admin. */
export const adminNav: NavItem[] = [
  { label: "Panel", href: "/panel", icon: LayoutDashboard },
  { label: "Estudiantes", href: "/estudiantes", icon: GraduationCap },
  { label: "Programas", href: "/programas", icon: Library },
  { label: "Entregas", href: "/entregas", icon: ClipboardCheck },
  { label: "Círculos", href: "/circulos-admin", icon: Radio },
  { label: "Biblioteca IA", href: "/biblioteca-ia", icon: Sparkles },
  { label: "Métricas", href: "/metricas", icon: BarChart3 },
  { label: "Configuración", href: "/configuracion", icon: Settings },
];
