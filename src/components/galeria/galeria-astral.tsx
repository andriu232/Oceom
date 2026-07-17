"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { X } from "lucide-react";
import { OrbitalGallery, type OrbitalItem } from "@/components/galeria/orbital-gallery";
import { poemTexture } from "@/components/galeria/texturas";

/* ============================================================
   Galería Astral (estudiante): recorre en 3D las fotos y poemas que
   publica la mentora. Click en un panel → dolly + aplanado y se abre el
   lector (poema completo) o la foto en grande.
   ============================================================ */

export interface AstralItemData {
  id: string;
  kind: "foto" | "poema";
  title: string;
  description: string | null;
  content: string | null;
  file_url: string | null;
}

const emptySubscribe = () => () => {};

export function GaleriaAstral({ items }: { items: AstralItemData[] }) {
  // Las texturas de poema se dibujan en <canvas> → solo en cliente.
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const [open, setOpen] = useState<AstralItemData | null>(null);

  const orbitItems = useMemo<OrbitalItem[]>(() => {
    if (!mounted) return [];
    // Variedad sutil de tamaño (el riel es horizontal, sin dispersión vertical).
    const SZ = [1, 0.94, 1.06, 0.92, 1, 0.96, 1.04, 0.93];
    return items.map((it, i) => ({
      ...(it.kind === "foto" && it.file_url
        ? {
            key: it.id,
            title: it.title,
            subtitle: it.description ?? undefined,
            textureUrl: it.file_url,
          }
        : {
            key: it.id,
            title: it.title,
            subtitle: "Poema",
            texture: poemTexture(it.title, it.content ?? ""),
          }),
      sizeMul: SZ[i % SZ.length],
    }));
  }, [items, mounted]);

  function close() {
    setOpen(null);
  }

  return (
    <div className="relative">
      {mounted && (
        <OrbitalGallery
          items={orbitItems}
          className="h-[calc(100dvh-11rem)] min-h-[520px] w-full"
          onOpen={(oi) =>
            setOpen(items.find((x) => x.id === oi.key) ?? null)
          }
        />
      )}

      {/* Visor / lightbox */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-abyss/92 p-3 backdrop-blur-md sm:p-6"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <button
            onClick={close}
            aria-label="Cerrar"
            className="fixed right-4 top-4 z-10 grid size-11 place-items-center rounded-full bg-white/8 text-foreground/90 backdrop-blur transition-colors hover:bg-white/16"
          >
            <X className="size-5" />
          </button>

          {open.kind === "foto" && open.file_url ? (
            <figure
              className="flex max-h-full max-w-full flex-col items-center"
              style={{ animation: "galeria-zoom 0.3s ease both" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={open.file_url}
                alt={open.title}
                className="max-h-[85vh] max-w-[95vw] rounded-lg object-contain shadow-[0_30px_90px_-30px_rgba(0,0,0,0.85)]"
              />
              <figcaption className="mt-3 max-w-2xl px-4 text-center">
                <h2 className="font-display text-lg font-bold text-foreground">
                  {open.title}
                </h2>
                {open.description && (
                  <p className="mt-0.5 text-sm text-muted">{open.description}</p>
                )}
              </figcaption>
            </figure>
          ) : (
            <div
              className="glass-strong relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-6 sm:p-8"
              style={{ animation: "galeria-zoom 0.3s ease both" }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ocean-violet">
                Poema
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold text-foreground">
                {open.title}
              </h2>
              <div className="mt-6 whitespace-pre-wrap text-center font-display text-lg leading-loose text-foreground/90">
                {open.content}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
