"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { startCheckoutAction, type CheckoutParams } from "@/lib/actions/store";
import { formatCop } from "@/config/store";
import { BoldButton } from "@/components/store/bold-button";

export function BuyPanel({ productId, price }: { productId: string; price: number }) {
  const [params, setParams] = useState<CheckoutParams | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy() {
    setLoading(true);
    setError(null);
    const res = await startCheckoutAction(productId);
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "No se pudo iniciar el pago.");
      return;
    }
    setParams(res);
  }

  if (params) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">Completa tu pago de forma segura con Bold:</p>
        <BoldButton {...params} />
        <p className="flex items-center gap-1.5 text-xs text-muted/70">
          <ShieldCheck className="size-3.5 text-oceom-turquoise" /> Pago protegido · tarjetas, PSE y más
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={buy}
        disabled={loading}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ocean-cyan text-sm font-semibold text-[var(--ocean-abyss)] transition hover:brightness-110 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Preparando…
          </>
        ) : (
          <>Comprar · {formatCop(price)}</>
        )}
      </button>
      {error && (
        <p className="flex items-center gap-1.5 text-sm text-danger">
          <AlertTriangle className="size-4" /> {error}
        </p>
      )}
      <p className="flex items-center justify-center gap-1.5 text-xs text-muted/70">
        <ShieldCheck className="size-3.5 text-oceom-turquoise" /> Pago seguro con Bold
      </p>
    </div>
  );
}
