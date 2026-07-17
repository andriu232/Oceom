"use client";

import { useMemo, useRef, useSyncExternalStore } from "react";
import { OrbitalGallery, type OrbitalItem } from "@/components/galeria/orbital-gallery";
import { worldTexture } from "@/components/galeria/texturas";

/* ============================================================
   Portada orbital de OCEOM LAB: los 8 mundos giran como paneles curvados
   alrededor del viajero. Tocar un mundo hace el dolly y desciende suave a
   su tarjeta en el mapa (#mundo-N).
   ============================================================ */

export interface LabOrbitWorld {
  n: number;
  name: string;
  objetivo: string;
}

/** Acento hex por mundo (paleta OCEOM). */
const ACCENTS: Record<number, string> = {
  1: "#22d3ee",
  2: "#818cf8",
  3: "#2dd4bf",
  4: "#5eead4",
  5: "#22d3ee",
  6: "#2dd4bf",
  7: "#818cf8",
  8: "#eab308",
};

const emptySubscribe = () => () => {};

export function LabOrbit({ worlds }: { worlds: LabOrbitWorld[] }) {
  // true solo en cliente (las texturas se dibujan en <canvas>).
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const releaseRef = useRef<(() => void) | null>(null);

  const items = useMemo<OrbitalItem[]>(() => {
    if (!mounted) return [];
    const SZ = [1, 0.95, 1.04, 0.93, 1, 0.96, 1.03, 0.94];
    return worlds.map((w, i) => ({
      key: String(w.n),
      title: w.name,
      subtitle: `Mundo ${w.n}`,
      texture: worldTexture(w.n, w.name, w.objetivo, ACCENTS[w.n] ?? "#22d3ee"),
      sizeMul: SZ[i % SZ.length],
    }));
  }, [worlds, mounted]);

  if (!mounted) {
    return (
      <div className="h-80 w-full animate-pulse rounded-2xl bg-ocean-surface/20 sm:h-96" />
    );
  }

  return (
    <OrbitalGallery
      items={items}
      className="h-80 w-full sm:h-96"
      hint="Desliza para orbitar los mundos · toca para descender"
      onOpen={(item) => {
        // Dolly breve y descenso suave a la tarjeta del mundo.
        setTimeout(() => {
          document
            .getElementById(`mundo-${item.key}`)
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => releaseRef.current?.(), 700);
        }, 520);
      }}
      onClose={(release) => {
        releaseRef.current = release;
      }}
    />
  );
}
