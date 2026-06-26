"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./env";

/** Cliente Supabase para componentes de cliente (browser). Respeta RLS. */
export function createClient() {
  return createBrowserClient(supabaseUrl(), supabaseAnonKey());
}
