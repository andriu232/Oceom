"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { VIEW_MODE_COOKIE, type ViewMode } from "@/lib/auth/mode";

/** Cambia el modo de visualización (mentora ↔ estudiante) y navega a su inicio.
 *  Solo tiene efecto real para mentora/super admin; un estudiante no llega aquí. */
export async function setViewMode(mode: ViewMode) {
  const store = await cookies();
  store.set(VIEW_MODE_COOKIE, mode, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });
  redirect(mode === "student" ? "/santuario" : "/panel");
}
