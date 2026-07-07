"use client";

import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  code: string;
}

export function ReferralLinkBox({ code }: Props) {
  const [copied, setCopied] = useState(false);
  // Solo client-side: usa el origin actual para soportar dominios custom y previews
  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/?ref=${code}`
      : `/?ref=${code}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* el navegador bloqueó el portapapeles */
    }
  };

  const share = async () => {
    const nav = navigator as Navigator & {
      share?: (data: { title: string; text: string; url: string }) => Promise<void>;
    };
    if (typeof navigator !== "undefined" && nav.share) {
      try {
        await nav.share({
          title: "OCEOM",
          text: "Te invito a OCEOM — tu océano interior despierta. Únete con mi enlace:",
          url: link,
        });
      } catch {
        /* el usuario canceló */
      }
    } else {
      const wa = `https://wa.me/?text=${encodeURIComponent(
        "Te invito a OCEOM — tu océano interior despierta: " + link,
      )}`;
      window.open(wa, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="glass mb-6 flex flex-col items-stretch gap-3 rounded-2xl p-5 sm:flex-row sm:items-center">
      <code className="flex-1 truncate rounded-xl border border-card-border bg-ocean-surface/60 px-4 py-3 font-mono text-[13px] text-ocean-cyan">
        {link.replace(/^https?:\/\//, "")}
      </code>
      <div className="flex shrink-0 gap-2">
        <Button onClick={copy} variant={copied ? "glass" : "primary"}>
          {copied ? <Check className="size-4" strokeWidth={2.4} /> : <Copy className="size-4" strokeWidth={2} />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
        <Button onClick={share} variant="glass">
          <Share2 className="size-4" strokeWidth={2} />
          Compartir
        </Button>
      </div>
    </div>
  );
}
