"use client";

import { useEffect, useState } from "react";

/**
 * Distintivo "en vivo ahora" para el ítem de Círculos del menú. Consulta el
 * estado al montar y cada 30 s; solo aparece cuando hay una sesión en vivo.
 * Devuelve null (no ocupa espacio) si no hay nada en vivo.
 */
export function LiveNavBadge() {
  const [live, setLive] = useState(false);

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const r = await fetch("/api/circles/live-status", { cache: "no-store" });
        const d = (await r.json()) as { live?: boolean };
        if (active) setLive(!!d.live);
      } catch {
        /* silencioso: si falla la consulta, no mostramos el distintivo */
      }
    };
    check();
    const id = setInterval(check, 30_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  if (!live) return null;

  return (
    <span className="relative flex shrink-0 items-center gap-1.5 rounded-full bg-danger/15 px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-wide text-danger">
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-80" />
        <span className="relative inline-flex size-1.5 rounded-full bg-danger" />
      </span>
      En vivo
    </span>
  );
}
