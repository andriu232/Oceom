"use client";

import { useEffect, useState } from "react";
import { MerkabaScene } from "./merkaba-scene";

/**
 * MerkabaBackdrop — fondo inmersivo con la estrella tetraédrica (Merkaba).
 * Se usa en el área de estudiante, el login y la landing.
 * Escena WebGL + gradación de luz/profundidad por CSS. Solo monta en cliente.
 */
export function MerkabaBackdrop() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #0b2c49 0%, #071d35 32%, #04111f 64%, #03060e 100%)",
        }}
      />

      {/* Resplandor central */}
      <div
        className="absolute left-1/2 top-1/2 size-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px] [animation:pulse-glow_7s_ease-in-out_infinite]"
        style={{
          background:
            "radial-gradient(circle, rgba(34,211,238,0.20) 0%, rgba(129,140,248,0.12) 45%, transparent 72%)",
        }}
      />

      {mounted && <MerkabaScene />}

      {/* Resplandor de superficie */}
      <div
        className="absolute inset-x-0 top-0 h-1/2"
        style={{
          background:
            "radial-gradient(75% 100% at 50% 0%, rgba(120,225,235,0.14) 0%, transparent 70%)",
        }}
      />

      {/* Rayos de luz */}
      <div className="absolute inset-0 mix-blend-screen">
        {[18, 42, 66, 86].map((left, i) => (
          <div
            key={left}
            className="absolute top-[-10%] h-[150%] w-28 blur-3xl"
            style={{
              left: `${left}%`,
              background:
                "linear-gradient(180deg, rgba(140,225,240,0.32) 0%, transparent 72%)",
              animation: `ray-shift ${18 + i * 3}s ease-in-out ${-i * 2}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Niebla + viñeta */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(125% 85% at 50% 12%, transparent 44%, rgba(2,4,11,0.55) 100%)," +
            "linear-gradient(180deg, transparent 58%, rgba(2,4,11,0.62) 100%)",
        }}
      />
    </div>
  );
}
