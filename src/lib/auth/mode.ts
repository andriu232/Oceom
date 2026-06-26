import { cookies } from "next/headers";
import type { UserRole } from "@/types/domain";

/** Modo de visualización para mentora/super admin: ver la plataforma como
 *  administradora o previsualizarla como estudiante, sin cerrar sesión. */
export type ViewMode = "admin" | "student";

export const VIEW_MODE_COOKIE = "oceom_view_mode";

/** Modo actual. Los estudiantes reales siempre están en "student". */
export async function getViewMode(role: UserRole): Promise<ViewMode> {
  if (role === "student") return "student";
  const store = await cookies();
  return store.get(VIEW_MODE_COOKIE)?.value === "student" ? "student" : "admin";
}
