"use client";

import { GlobeCollection } from "@/shaders/globe/GlobeCollection";
import "@/shaders/threeui.energy-orb.css";
import { cn } from "@/lib/utils";

/**
 * OceomEnergyOrb — la luna del santuario: el variant `energy-orb` de ThreeUI
 * (WebGL + Canvas 2D, esfera FBM por capas con rim glow y campo de estrellas)
 * montado con la paleta oceánica de OCEOM.
 *
 * El shader autoral es índigo/violeta (~252°); `hue={-48}` lo rota al azul
 * océano de la marca (≈200°, entre --ocean-cyan #22d3ee y #1366b8) usando la
 * propia API del componente, sin tocar el shader registrado.
 *
 * `mask` recorta el lienzo cuadrado del shader (fondo #05030e opaco) a un
 * disco para que la luna flote sobre el cristal del hero sin caja visible.
 */
export function OceomEnergyOrb({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("relative aspect-square [animation:orb-breathe_7s_ease-in-out_infinite]", className)}
      style={{
        WebkitMaskImage:
          "radial-gradient(closest-side circle at 50% 50%, #000 0 62%, rgba(0,0,0,0.55) 80%, transparent 97%)",
        maskImage:
          "radial-gradient(closest-side circle at 50% 50%, #000 0 62%, rgba(0,0,0,0.55) 80%, transparent 97%)",
      }}
    >
      <GlobeCollection
        variant="energy-orb"
        speed={1.0}
        scale={1.0}
        smokeScale={1.0}
        smokeStrength={1.0}
        smokeSpeed={1.0}
        hue={-48}
        saturation={1.0}
        glow={1.0}
        starDensity={1.0}
        starSpeed={1.0}
        starSize={1.0}
        brightness={1.0}
        opacity={1.0}
      />
    </div>
  );
}
