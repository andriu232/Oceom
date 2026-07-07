"use client";

import { useEffect } from "react";
import { REF_COOKIE, REF_COOKIE_MAX_AGE_DAYS } from "@/lib/referrals/ref-cookie";

/**
 * Captura silenciosamente `?ref=XXX` de cualquier URL y lo guarda en cookie
 * (30 días). Al registrarse, el signup lee la cookie server-side y asocia el
 * referrer. Se monta en el layout raíz para que cualquier visitante que llegue
 * con un enlace de referido deje rastro antes de crear su cuenta.
 */
export function RefCapture() {
  useEffect(() => {
    try {
      const ref = new URL(window.location.href).searchParams.get("ref");
      if (!ref || ref.length < 4 || ref.length > 32) return;
      const expires = new Date(
        Date.now() + REF_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
      ).toUTCString();
      document.cookie = `${REF_COOKIE}=${encodeURIComponent(
        ref,
      )}; expires=${expires}; path=/; samesite=lax`;
    } catch {
      /* noop */
    }
  }, []);
  return null;
}
