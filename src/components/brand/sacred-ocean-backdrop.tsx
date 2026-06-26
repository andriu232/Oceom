"use client";

import { useEffect, useState } from "react";
import { SacredScene } from "./sacred-scene";
import { cn } from "@/lib/utils";

/**
 * SacredOceanBackdrop — fondo insignia de OCEOM: geometría sagrada
 * (Cubo de Metatrón, Flor de la Vida) flotando en un océano luminoso.
 *
 * - `fullWidth`: centra la escena en toda la pantalla (landing/login, sin
 *   sidebar). Por defecto la alinea al área de contenido (admin con sidebar).
 * - `showGlow`: resplandor central detrás del mandala. Apagable.
 *
 * La escena 3D solo se monta en cliente (evita SSR de WebGL).
 */
export function SacredOceanBackdrop({
  fullWidth = false,
  showGlow = true,
}: {
  fullWidth?: boolean;
  showGlow?: boolean;
} = {}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Profundidad base: luz arriba -> abismo abajo (más oscuro) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #082138 0%, #05162a 32%, #030c18 64%, #02040b 100%)",
        }}
      />

      {/* Capa de la escena. En admin se descuenta la sidebar; en landing/login
          (fullWidth) se centra en toda la pantalla. */}
      <div className={cn("absolute inset-0", !fullWidth && "lg:left-[19rem]")}>
        {showGlow && (
          <div
            className="absolute left-1/2 top-1/2 size-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px] [animation:pulse-glow_7s_ease-in-out_infinite]"
            style={{
              background:
                "radial-gradient(circle, rgba(34,211,238,0.16) 0%, rgba(129,140,248,0.09) 45%, transparent 72%)",
            }}
          />
        )}
        {/* Escena 3D (solo cliente) */}
        {mounted && <SacredScene />}
      </div>

      {/* Velo oscuro: atenúa la geometría para que el contenido resalte */}
      <div className="absolute inset-0 bg-[#03060e]/45" />

      {/* Resplandor de superficie */}
      <div
        className="absolute inset-x-0 top-0 h-1/2"
        style={{
          background:
            "radial-gradient(75% 100% at 50% 0%, rgba(120,225,235,0.14) 0%, transparent 70%)",
        }}
      />

      {/* Rayos de luz volumétrica (sutiles, sobre la escena) */}
      <div className="absolute inset-0 mix-blend-screen">
        {[16, 38, 60, 82].map((left, i) => (
          <div
            key={left}
            className="absolute top-[-10%] h-[150%] w-28 blur-3xl"
            style={{
              left: `${left}%`,
              background:
                "linear-gradient(180deg, rgba(140,225,240,0.24) 0%, transparent 72%)",
              animation: `ray-shift ${18 + i * 3}s ease-in-out ${-i * 2}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Niebla de profundidad + viñeta para legibilidad */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(125% 85% at 50% 12%, transparent 38%, rgba(2,4,11,0.72) 100%)," +
            "linear-gradient(180deg, transparent 52%, rgba(2,4,11,0.74) 100%)",
        }}
      />
    </div>
  );
}
