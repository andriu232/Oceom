"use client";

import { useEffect, useState } from "react";
import { SacredScene } from "./sacred-scene";

/**
 * SacredOceanBackdrop — fondo insignia de OCEOM: geometría sagrada
 * (Cubo de Metatrón, Flor de la Vida, sólidos platónicos) flotando en un
 * océano luminoso. Escena 3D WebGL + gradación de luz/profundidad por CSS.
 *
 * La escena 3D solo se monta en cliente (evita SSR de WebGL).
 */
export function SacredOceanBackdrop() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Profundidad base: luz arriba -> abismo abajo */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #0b2c49 0%, #071d35 32%, #04111f 64%, #03060e 100%)",
        }}
      />

      {/* Resplandor central detrás del mandala */}
      <div
        className="absolute left-1/2 top-1/2 size-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px] [animation:pulse-glow_7s_ease-in-out_infinite]"
        style={{
          background:
            "radial-gradient(circle, rgba(34,211,238,0.22) 0%, rgba(129,140,248,0.12) 45%, transparent 72%)",
        }}
      />

      {/* Escena 3D (solo cliente) */}
      {mounted && <SacredScene />}

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
                "linear-gradient(180deg, rgba(140,225,240,0.36) 0%, transparent 72%)",
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
            "radial-gradient(125% 85% at 50% 12%, transparent 46%, rgba(3,6,14,0.5) 100%)," +
            "linear-gradient(180deg, transparent 60%, rgba(3,6,14,0.6) 100%)",
        }}
      />
    </div>
  );
}
