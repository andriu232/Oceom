"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ACCENT, type Accent } from "@/lib/accents";

/** Barra de progreso oceánica: relleno que sube al montar + brillo interno. */
export function OceomProgressBar({
  value,
  accent = "cyan",
  className,
}: {
  value: number;
  accent?: Accent;
  className?: string;
}) {
  const a = ACCENT[accent];
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(Math.max(0, Math.min(100, value))), 80);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]", className)}>
      <div
        className="relative h-full rounded-full transition-[width] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          width: `${w}%`,
          background: `linear-gradient(90deg, ${a.hex2}, ${a.hex})`,
          boxShadow: `0 0 14px -2px ${a.hex}`,
        }}
      >
        <span
          aria-hidden
          className="absolute inset-0 rounded-full opacity-60"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
            backgroundSize: "200% 100%",
            animation: "shimmer 4s linear infinite",
          }}
        />
      </div>
    </div>
  );
}
