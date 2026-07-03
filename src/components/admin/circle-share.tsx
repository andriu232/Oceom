"use client";

import { useState } from "react";
import { Link2, Copy, Check, Mail } from "lucide-react";

/**
 * Genera y comparte el enlace de la transmisión del círculo. El link lleva
 * a la sala del estudiante (`/circulos/[id]`); requiere que inicie sesión y
 * tenga acceso. Para 1:1 se puede prellenar el correo del estudiante.
 */
export function CircleShare({
  circleId,
  title,
  studentEmail,
}: {
  circleId: string;
  title: string;
  studentEmail?: string | null;
}) {
  const [copied, setCopied] = useState(false);
  // Se arma en el cliente: siempre el dominio real donde está corriendo.
  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/circulos/${circleId}`
      : `/circulos/${circleId}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard bloqueado: el usuario puede copiar del campo */
    }
  };

  const mailtoHref = `mailto:${studentEmail ?? ""}?subject=${encodeURIComponent(
    `Tu Círculo en Vivo · ${title}`,
  )}&body=${encodeURIComponent(
    `Hola, aquí tienes el enlace para entrar a la transmisión "${title}":\n\n${link}\n\nEntra con tu cuenta de OCEOM a la hora del encuentro.`,
  )}`;

  return (
    <section className="glass rounded-2xl p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
        <Link2 className="size-5 text-ocean-cyan" /> Enlace de la transmisión
      </h2>
      <p className="mt-1 text-sm text-muted">
        Compártelo con quien deba entrar. Pedirá iniciar sesión y solo entra
        quien tenga acceso.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="h-11 flex-1 rounded-xl border border-card-border bg-ocean-surface/40 px-3 text-sm text-foreground outline-none"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={copy}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-ocean-cyan/15 px-4 text-sm font-medium text-ocean-cyan transition-colors hover:bg-ocean-cyan/25"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copiado" : "Copiar"}
          </button>
          <a
            href={mailtoHref}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-card-border px-4 text-sm font-medium text-muted transition-colors hover:border-ocean-cyan/40 hover:text-ocean-cyan"
          >
            <Mail className="size-4" /> Enviar
          </a>
        </div>
      </div>
    </section>
  );
}
