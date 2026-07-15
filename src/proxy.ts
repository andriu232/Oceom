import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { hasSupabaseEnv } from "@/lib/supabase/env";

/** Páginas de autenticación. */
const AUTH_PATHS = ["/login", "/registro", "/recuperar"];

/** Proxy de Next 16 (antes "middleware"): refresca la sesión y protege rutas.
 *  Es la primera capa de defensa (UX). RLS en Supabase es la frontera real. */
export async function proxy(request: NextRequest) {
  // Sin configuración de Supabase aún: no bloquear (entorno de desarrollo).
  if (!hasSupabaseEnv()) return NextResponse.next({ request });

  const { pathname } = request.nextUrl;
  const { response, user, supabase } = await updateSession(request);

  const isLanding = pathname === "/";
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));
  // Callback OAuth (Google): debe canjear el código antes de tener sesión.
  const isOAuthCallback = pathname.startsWith("/auth/");
  const isPublic = isLanding || isAuthPage || isOAuthCallback;

  // No autenticado intentando entrar a zona privada -> login.
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Autenticado en una página de auth -> directo a SU home (Santuario/Panel).
  // Nunca a la landing: la landing es estática y volver ahí hacía parecer que
  // el botón "Ingresar" no hacía nada para quien ya tenía sesión.
  if (user && isAuthPage) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const url = request.nextUrl.clone();
    url.pathname = prof?.role === "student" || !prof ? "/santuario" : "/panel";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Aplica a todo excepto: assets estáticos, imágenes, favicon, archivos
     * estáticos de _next, y la API (que valida permisos por su cuenta).
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|mp4)$).*)",
  ],
};
