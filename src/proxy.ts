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
  const { response, user } = await updateSession(request);

  const isLanding = pathname === "/";
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));
  const isPublic = isLanding || isAuthPage;

  // No autenticado intentando entrar a zona privada -> login.
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Autenticado en una página de auth -> a la landing (que muestra su CTA).
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
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
