"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Botón "Continuar con Google" — inicia el flujo OAuth (PKCE) con Supabase.
 *  El verificador se guarda en cookie y lo intercambia /auth/callback. */
export function GoogleButton({ label = "Continuar con Google" }: { label?: string }) {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "select_account" },
      },
    });
    if (error) setLoading(false); // si falla, no hubo redirección
  };

  return (
    <button
      type="button"
      onClick={handle}
      disabled={loading}
      className="group relative inline-flex h-12 w-full items-center justify-center gap-3 overflow-hidden rounded-[20px] border border-transparent text-sm font-medium text-foreground shadow-[var(--shadow-glass)] backdrop-blur-md transition-all duration-300 [background:linear-gradient(var(--btn-glass),var(--btn-glass))_padding-box,linear-gradient(135deg,rgba(34,211,238,0.6),rgba(129,140,248,0.5))_border-box] hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-white/20 blur-md opacity-0 group-hover:opacity-100 group-hover:[animation:sheen_0.9s_ease]"
      />
      <GoogleIcon />
      {loading ? "Conectando con Google…" : label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
