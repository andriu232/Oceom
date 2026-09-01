"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/* Galería del producto: una imagen grande y las miniaturas debajo. */

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const total = images.length;

  if (total === 0) {
    return (
      <div className="grid aspect-square w-full place-items-center rounded-[3px] border border-white/10 bg-gradient-to-b from-ocean-mid/40 to-ocean-deep/60">
        <span className="font-display text-4xl tracking-[0.3em] text-ocean-cyan/20">OCEOM</span>
      </div>
    );
  }

  const go = (delta: number) => setIndex((i) => (i + delta + total) % total);

  return (
    <div className="space-y-3">
      <div className="group relative aspect-square w-full overflow-hidden rounded-[3px] border border-white/10 bg-ocean-deep/50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[index]} alt={alt} className="h-full w-full object-cover" />
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-ocean-abyss/70 text-foreground opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-ocean-abyss/70 text-foreground opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              aria-label="Imagen siguiente"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="flex flex-wrap gap-2">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setIndex(i)}
              className={`size-16 overflow-hidden rounded-[3px] border transition-colors ${
                i === index ? "border-ocean-cyan" : "border-white/10 hover:border-white/30"
              }`}
              aria-label={`Ver imagen ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
