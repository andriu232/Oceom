import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { getViewMode } from "@/lib/auth/mode";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

/** Raíz: enruta por rol y, para mentora/admin, por su modo de vista elegido. */
export default async function RootPage() {
  if (!hasSupabaseEnv()) redirect("/login");

  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role === "student") redirect("/santuario");

  const mode = await getViewMode(profile.role);
  redirect(mode === "student" ? "/santuario" : "/panel");
}
