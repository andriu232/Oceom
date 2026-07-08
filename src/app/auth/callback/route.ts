import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile, homeForRole } from "@/lib/auth";
import { attachPendingReferral } from "@/lib/referrals/attach";

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
  const { data: exchanged, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  if (exchanged?.user) {
    // Asocia el referido pendiente (cookie ?ref=) si el visitante llegó por un
    // enlace de invitación antes de entrar con Google.
    await attachPendingReferral(exchanged.user.id);

    // Sincroniza la foto de Google en el perfil cuando aún no tiene una. Así se
    // auto-repara para quien se registró antes del trigger de avatar, y NO pisa
    // una foto que el usuario haya subido a mano (solo actúa si avatar_url null).
    const meta = exchanged.user.user_metadata ?? {};
    const googlePhoto = meta.avatar_url || meta.picture;
    if (googlePhoto) {
      await supabase
        .from("profiles")
        .update({ avatar_url: googlePhoto })
        .eq("id", exchanged.user.id)
        .is("avatar_url", null);
    }
  }

  const profile = await getProfile();
  const dest = next && next.startsWith("/") ? next : homeForRole(profile?.role);
  return NextResponse.redirect(`${origin}${dest}`);
}
