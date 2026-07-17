"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
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
  const releaseRef = useRef<(() => void) | null>(null);

  const orbitItems = useMemo<OrbitalItem[]>(() => {
    if (!mounted) return [];
    return items.map((it) =>
      it.kind === "foto" && it.file_url
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
          },
    );
  }, [items, mounted]);

  function close() {
    releaseRef.current?.();
    setOpen(null);
  }

  return (
    <div className="relative">
      {mounted && (
        <OrbitalGallery
          items={orbitItems}
          className="h-[calc(100dvh-14rem)] min-h-[460px] w-full overflow-hidden rounded-2xl border border-card-border bg-[#03060e]"
          onOpen={(oi) => {
            const it = items.find((x) => x.id === oi.key) ?? null;
            // Deja respirar la animación de dolly antes de abrir el lector.
            setTimeout(() => setOpen(it), 480);
          }}
          onClose={(release) => {
            releaseRef.current = release;
          }}
        />
      )}

      {/* Lector / visor */}
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ocean-abyss/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <div
            className="glass-strong relative max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={close}
              aria-label="Cerrar"
              className="absolute right-4 top-4 grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-foreground"
            >
              <X className="size-5" />
            </button>

            {open.kind === "foto" && open.file_url ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={open.file_url}
                  alt={open.title}
                  className="max-h-[62vh] w-full rounded-xl object-contain"
                />
                <h2 className="mt-4 font-display text-xl font-bold text-foreground">
                  {open.title}
                </h2>
                {open.description && (
                  <p className="mt-1 text-sm text-muted">{open.description}</p>
                )}
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ocean-violet">
                  Poema
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold text-foreground">
                  {open.title}
                </h2>
                <div className="mt-6 whitespace-pre-wrap text-center font-display text-lg leading-loose text-foreground/90">
                  {open.content}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
