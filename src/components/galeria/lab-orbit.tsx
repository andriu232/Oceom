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
    return worlds.map((w) => ({
      key: String(w.n),
      title: w.name,
      subtitle: `Mundo ${w.n}`,
      texture: worldTexture(w.n, w.name, w.objetivo, ACCENTS[w.n] ?? "#22d3ee"),
    }));
  }, [worlds, mounted]);

  if (!mounted) {
    return (
      <div className="h-72 w-full animate-pulse rounded-2xl border border-card-border bg-ocean-surface/30 sm:h-80" />
    );
  }

  return (
    <OrbitalGallery
      items={items}
      className="h-72 w-full overflow-hidden rounded-2xl border border-card-border bg-[#03060e] sm:h-80"
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
