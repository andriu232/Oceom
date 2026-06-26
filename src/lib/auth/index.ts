import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types/domain";

/** Usuario autenticado (o null). Cacheado por request. */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Perfil con rol del usuario actual (o null). Cacheado por request. */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (data as Profile) ?? null;
});

/** Ruta de inicio según rol. */
export function homeForRole(role: UserRole | undefined) {
  return role === "student" ? "/santuario" : "/panel";
}

/** Exige sesión; redirige a /login si no hay. Devuelve el perfil. */
export async function requireAuth(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  return profile;
}

/** Exige uno de los roles dados; redirige si no cumple. */
export async function requireRole(...roles: UserRole[]): Promise<Profile> {
  const profile = await requireAuth();
  if (!roles.includes(profile.role)) {
    redirect(homeForRole(profile.role));
  }
  return profile;
}

export const isMentor = (role: UserRole) =>
  role === "mentor" || role === "super_admin";
