/** Lectura centralizada de variables de entorno de Supabase.
 *  Lanza un error claro si faltan en runtime, sin romper el build. */

export function supabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL en el entorno.");
  return url;
}

export function supabaseAnonKey() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error("Falta NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno.");
  return key;
}

export function supabaseServiceKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en el entorno.");
  return key;
}

/** True si hay configuración suficiente para clientes de navegador/servidor. */
export function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
