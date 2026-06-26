import { redirect } from "next/navigation";
import { getProfile, homeForRole } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

/** Raíz: enruta por rol. Sin sesión -> /login. */
export default async function RootPage() {
  if (!hasSupabaseEnv()) redirect("/login");

  const profile = await getProfile();
  if (!profile) redirect("/login");
  redirect(homeForRole(profile.role));
}
