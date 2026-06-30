import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile, homeForRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /auth/callback
 * Cierre del flujo OAuth (Google): intercambia el `code` por una sesión,
 * deja las cookies de Supabase y redirige al santuario/panel según el rol.
 * El perfil lo crea automáticamente el trigger handle_new_user.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  const profile = await getProfile();
  const dest = next && next.startsWith("/") ? next : homeForRole(profile?.role);
  return NextResponse.redirect(`${origin}${dest}`);
}
