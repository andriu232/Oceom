"use client";

import { useEffect, useState } from "react";
import { OceanScene } from "./ocean-scene";

/**
 * OceanEcosystemBackdrop — fondo inmersivo de OCEOM.
 *
 * Combina la escena 3D WebGL (peces, rayas, partículas, niebla) con una
 * gradación de luz y profundidad por CSS encima (rayos de sol, viñeta) para
 * un acabado cinematográfico y legible.
 *
 * La escena 3D solo se monta en cliente (evita SSR de WebGL).
 */
export function OceanEcosystemBackdrop() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Profundidad base: luz arriba -> abismo abajo (siempre presente) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #0b2c49 0%, #071d35 30%, #04111f 62%, #03060e 100%)",
        }}
      />

      {/* Escena 3D (solo cliente) */}
      {mounted && <OceanScene />}

      {/* Resplandor de superficie */}
      <div
        className="absolute inset-x-0 top-0 h-1/2"
        style={{
          background:
            "radial-gradient(75% 100% at 50% 0%, rgba(120,225,235,0.16) 0%, transparent 70%)",
        }}
      />

      {/* Rayos de luz volumétrica (sobre la escena, sutil) */}
      <div className="absolute inset-0 mix-blend-screen">
        {[14, 33, 54, 72, 88].map((left, i) => (
          <div
            key={left}
            className="absolute top-[-10%] h-[150%] w-28 blur-3xl"
            style={{
              left: `${left}%`,
              background:
                "linear-gradient(180deg, rgba(140,225,240,0.42) 0%, transparent 72%)",
              animation: `ray-shift ${17 + i * 3}s ease-in-out ${-i * 2}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Niebla de profundidad + viñeta para legibilidad */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(125% 85% at 50% 8%, transparent 42%, rgba(3,6,14,0.5) 100%)," +
            "linear-gradient(180deg, transparent 58%, rgba(3,6,14,0.62) 100%)",
        }}
      />
    </div>
  );
}
