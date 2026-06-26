import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseServiceKey, supabaseUrl } from "./env";

/** Cliente con service_role: BYPASS de RLS. Usar SOLO en server-side
 *  controlado (jobs de embeddings, webhooks, tareas de sistema auditadas).
 *  NUNCA exponer al cliente ni usar para datos pedidos directamente por el
 *  usuario sin filtrar permisos manualmente. */
export function createServiceClient() {
  return createSupabaseClient(supabaseUrl(), supabaseServiceKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
