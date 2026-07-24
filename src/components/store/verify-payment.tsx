"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { verifyOrderPaymentAction } from "@/lib/actions/store";

/** Verificación activa del pago en la página de resultado: pregunta a Bold por
 *  el estado de la orden y refresca cuando se confirma. Reintenta unas veces
 *  para cubrir PSE (que puede quedar unos minutos en proceso). */
export function VerifyPayment({ reference }: { reference: string }) {
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    let n = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      if (done.current) return;
      n += 1;
      const res = await verifyOrderPaymentAction(reference).catch(() => null);
      if (res && (res.status === "paid" || res.status === "rejected")) {
        done.current = true;
        router.refresh();
        return;
      }
      if (n < 8) timer = setTimeout(tick, 4000);
    };
    tick();
    return () => clearTimeout(timer);
  }, [reference, router]);

  return null;
}
