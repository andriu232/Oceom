"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { verifyOrderByClaimAction } from "@/lib/actions/shop";

/* Verificación activa del pago.

   Existe porque el webhook de Bold no siempre llega a tiempo — con PSE puede
   tardar minutos. En vez de dejar a la compradora mirando "pendiente" sin
   saber si perdió la plata, le preguntamos a Bold directamente unas cuantas
   veces y refrescamos cuando confirme. */

const INTENTOS = 6;
const ESPERA_MS = 5000;

export function OrderStatus({
  claimToken,
  initialStatus,
}: {
  claimToken: string;
  initialStatus: "pending" | "paid" | "rejected" | "cancelled";
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [comprobando, setComprobando] = useState(initialStatus === "pending");

  useEffect(() => {
    if (status !== "pending") return;
    let intento = 0;
    let vivo = true;

    const revisar = async () => {
      if (!vivo) return;
      const res = await verifyOrderByClaimAction(claimToken);
      if (!vivo) return;

      if (res.status === "paid" || res.status === "rejected") {
        setStatus(res.status);
        setComprobando(false);
        router.refresh();
        return;
      }
      intento += 1;
      if (intento >= INTENTOS) {
        setComprobando(false);
        return;
      }
      setTimeout(revisar, ESPERA_MS);
    };

    const t = setTimeout(revisar, 2000);
    return () => {
      vivo = false;
      clearTimeout(t);
    };
  }, [claimToken, status, router]);

  if (status === "paid") {
    return (
      <p className="flex items-center gap-2 text-sm text-success">
        <CheckCircle2 className="size-4" /> Pago confirmado
      </p>
    );
  }
  if (status === "rejected" || status === "cancelled") {
    return (
      <p className="flex items-center gap-2 text-sm text-danger">
        <XCircle className="size-4" /> El pago no se completó. Puedes intentarlo de nuevo.
      </p>
    );
  }
  return (
    <p className="flex items-center gap-2 text-sm text-oceom-gold">
      {comprobando ? (
        <>
          <Loader2 className="size-4 animate-spin" /> Confirmando tu pago…
        </>
      ) : (
        <>
          <Clock className="size-4" /> Aún no vemos el pago. Si ya pagaste, refresca en
          un minuto.
        </>
      )}
    </p>
  );
}
