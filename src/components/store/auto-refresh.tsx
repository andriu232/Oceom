"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Refresca la página cada `seconds` hasta `times` veces — para esperar a que
 *  el webhook de Bold confirme el pago (el estado pasa de pendiente a pagado). */
export function AutoRefresh({ seconds = 4, times = 6 }: { seconds?: number; times?: number }) {
  const router = useRouter();
  useEffect(() => {
    let n = 0;
    const id = setInterval(() => {
      n += 1;
      router.refresh();
      if (n >= times) clearInterval(id);
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds, times]);
  return null;
}
