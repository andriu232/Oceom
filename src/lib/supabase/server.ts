import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAnonKey, supabaseUrl } from "./env";

/** Cliente Supabase para Server Components / Server Actions / Route Handlers.
 *  Respeta RLS usando la sesión del usuario en cookies. En Next 16 `cookies()`
 *  es asíncrono. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Llamado desde un Server Component: el refresco de sesión lo
          // maneja proxy.ts. Se puede ignorar con seguridad.
        }
      },
    },
  });
}
