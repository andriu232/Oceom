"use client";

import { useState, useTransition, useEffect } from "react";
import { Loader2, ShieldCheck, AlertTriangle, Truck, Download } from "lucide-react";
import {
  startShopCheckoutAction,
  quoteShippingAction,
  type CheckoutResult,
} from "@/lib/actions/shop";
import { BoldButton } from "@/components/store/bold-button";
import { formatCop, DEPARTAMENTOS } from "@/config/shop";

/* Checkout.

   Un solo paso: datos, entrega y pago en la misma pantalla. Se puede comprar
   sin cuenta — si lo comprado vive dentro del santuario, la cuenta se crea
   sola al confirmarse el pago y le llega por correo.

   El envío se cotiza al elegir departamento, no al final: enterarse del flete
   después de haber llenado todo el formulario es donde se pierden los pedidos. */

interface Props {
  subtotal: number;
  requiresShipping: boolean;
  defaults: { name: string; email: string };
}

const INPUT =
  "h-11 w-full rounded-[3px] border border-white/12 bg-ocean-deep/40 px-3.5 text-sm text-foreground placeholder:text-muted/50 outline-none transition-colors focus:border-ocean-cyan/60";
const LABEL = "mb-1.5 block text-[0.68rem] uppercase tracking-[0.16em] text-muted";

export function CheckoutForm({ subtotal, requiresShipping, defaults }: Props) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pago, setPago] = useState<CheckoutResult | null>(null);

  const [form, setForm] = useState({
    name: defaults.name,
    email: defaults.email,
    phone: "",
    doc: "",
    address: "",
    address2: "",
    city: "",
    state: "",
    notes: "",
  });

  const [envio, setEnvio] = useState<{ cost: number; free: boolean; missingForFree: number | null }>(
    { cost: 0, free: !requiresShipping, missingForFree: null },
  );

  // Cotización en vivo al cambiar de departamento.
  useEffect(() => {
    if (!requiresShipping || !form.state) return;
    let vigente = true;
    quoteShippingAction(form.state).then((q) => {
      if (vigente) setEnvio({ cost: q.cost, free: q.free, missingForFree: q.missingForFree });
    });
    return () => {
      vigente = false;
    };
  }, [form.state, requiresShipping]);

  const total = subtotal + envio.cost;
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await startShopCheckoutAction(form);
      if (!res.ok) {
        setError(res.error ?? "No se pudo iniciar el pago.");
        return;
      }
      setPago(res);
    });
  }

  // Pedido creado: ahora solo falta pagar.
  if (pago?.ok) {
    return (
      <div className="rounded-[3px] border border-ocean-cyan/25 bg-ocean-surface/40 p-6">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Tu pedido está reservado
        </h2>
        <p className="mt-2 text-sm text-muted">
          Completa el pago para confirmarlo. Total a pagar{" "}
          <strong className="text-ocean-glow">{formatCop(pago.amount ?? total)}</strong>.
        </p>
        <div className="mt-5">
          <BoldButton {...pago} />
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted/70">
          <ShieldCheck className="size-3.5 text-oceom-turquoise" />
          Pago protegido con Bold · tarjetas, PSE, Nequi
        </p>
        {pago.claimUrl && (
          <p className="mt-3 text-xs text-muted/60">
            Si algo se interrumpe, puedes retomar tu pedido desde el enlace que te
            enviamos por correo.
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <section>
        <h2 className="mb-4 font-display text-base font-semibold text-foreground">
          Tus datos
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={LABEL} htmlFor="name">Nombre completo</label>
            <input id="name" className={INPUT} value={form.name} onChange={set("name")} required autoComplete="name" />
          </div>
          <div>
            <label className={LABEL} htmlFor="email">Correo</label>
            <input id="email" type="email" className={INPUT} value={form.email} onChange={set("email")} required autoComplete="email" />
          </div>
          <div>
            <label className={LABEL} htmlFor="phone">WhatsApp</label>
            <input id="phone" type="tel" className={INPUT} value={form.phone} onChange={set("phone")} required autoComplete="tel" placeholder="300 000 0000" />
          </div>
        </div>
        <p className="mt-3 text-xs text-muted/70">
          A este correo te llega la confirmación
          {requiresShipping ? " y el seguimiento de tu envío." : " y el acceso a lo que compraste."}
        </p>
      </section>

      {requiresShipping && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-foreground">
            <Truck className="size-4 text-ocean-glow" /> Dirección de entrega
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL} htmlFor="doc">Documento</label>
              <input id="doc" className={INPUT} value={form.doc} onChange={set("doc")} placeholder="Cédula (para la guía)" />
            </div>
            <div>
              <label className={LABEL} htmlFor="state">Departamento</label>
              <select id="state" className={INPUT} value={form.state} onChange={set("state")} required>
                <option value="">Elige…</option>
                {DEPARTAMENTOS.map((d) => (
                  <option key={d} value={d} className="bg-ocean-deep">{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="city">Ciudad</label>
              <input id="city" className={INPUT} value={form.city} onChange={set("city")} required />
            </div>
            <div>
              <label className={LABEL} htmlFor="address2">Barrio / conjunto</label>
              <input id="address2" className={INPUT} value={form.address2} onChange={set("address2")} />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL} htmlFor="address">Dirección</label>
              <input id="address" className={INPUT} value={form.address} onChange={set("address")} required placeholder="Calle 00 # 00-00, apto 000" autoComplete="street-address" />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL} htmlFor="notes">Indicaciones para la entrega</label>
              <input id="notes" className={INPUT} value={form.notes} onChange={set("notes")} placeholder="Portería, horarios, referencias…" />
            </div>
          </div>
        </section>
      )}

      {!requiresShipping && (
        <p className="flex items-start gap-2.5 rounded-[3px] border border-white/10 bg-ocean-surface/30 px-4 py-3.5 text-sm text-muted">
          <Download className="mt-0.5 size-4 shrink-0 text-ocean-glow" />
          Tu pedido es digital: no hace falta dirección. Te llega por correo apenas
          confirmemos el pago.
        </p>
      )}

      <div className="rounded-[3px] border border-white/10 bg-ocean-surface/35 p-5">
        <dl className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="text-foreground">{formatCop(subtotal)}</dd>
          </div>
          {requiresShipping && (
            <div className="flex justify-between">
              <dt className="text-muted">Envío</dt>
              <dd className={envio.free ? "text-success" : "text-foreground"}>
                {!form.state ? "Elige departamento" : envio.free ? "Gratis" : formatCop(envio.cost)}
              </dd>
            </div>
          )}
          <div className="flex justify-between border-t border-white/10 pt-2.5">
            <dt className="font-display font-semibold text-foreground">Total</dt>
            <dd className="font-display text-lg font-semibold text-ocean-glow">{formatCop(total)}</dd>
          </div>
        </dl>
      </div>

      {error && (
        <p className="flex items-start gap-2 text-sm text-danger">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[3px] bg-ocean-cyan text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-[var(--ocean-abyss)] transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Preparando tu pedido
          </>
        ) : (
          `Ir a pagar · ${formatCop(total)}`
        )}
      </button>

      <p className="text-center text-xs leading-relaxed text-muted/60">
        Al continuar aceptas nuestros términos. Tus datos se usan solo para
        gestionar este pedido.
      </p>
    </form>
  );
}
