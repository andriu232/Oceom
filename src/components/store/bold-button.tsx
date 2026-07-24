"use client";

import { useEffect, useRef } from "react";
import type { CheckoutParams } from "@/lib/actions/store";

/* Botón de pago de Bold. Renderiza el <script data-bold-button> de Bold con los
   parámetros firmados en el servidor y carga su librería. Embedded checkout:
   el pago se hace en un modal sin salir de OCEOM. */

export function BoldButton(p: CheckoutParams) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !p.ok) return;
    el.innerHTML = "";

    const btn = document.createElement("script");
    btn.setAttribute("data-bold-button", "dark-L");
    btn.setAttribute("data-api-key", p.apiKey ?? "");
    btn.setAttribute("data-order-id", p.orderId ?? "");
    btn.setAttribute("data-amount", String(p.amount ?? 0));
    btn.setAttribute("data-currency", p.currency ?? "COP");
    btn.setAttribute("data-integrity-signature", p.signature ?? "");
    btn.setAttribute("data-description", p.description ?? "");
    btn.setAttribute("data-redirection-url", p.redirectionUrl ?? "");
    btn.setAttribute("data-render-mode", "embedded");
    el.appendChild(btn);

    const lib = document.createElement("script");
    lib.src = "https://checkout.bold.co/library/boldPaymentButton.js";
    el.appendChild(lib);

    return () => {
      el.innerHTML = "";
    };
  }, [p]);

  return <div ref={ref} className="min-h-12 [&_button]:!w-full" />;
}
