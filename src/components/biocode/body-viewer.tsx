"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { VanatomeViewer, useVanatomeController } from "@vixotic/vanatome-react";
import type { VanatomeAtlas } from "@vixotic/vanatome-react";
import { createOfficialHumanAtlas } from "@vixotic/vanatome-atlas";
import { Loader2, RotateCcw, AlertTriangle } from "lucide-react";
import {
  resolveNodeSlug,
  openingMessage,
  ATLAS_ATTRIBUTION,
} from "@/lib/biocode/anatomy-map";

/* ============================================================
   Cuerpo interactivo de BIOCODE. Se carga de forma diferida (ver
   body-viewer-lazy) para no meter three.js en el bundle de quien nunca abre
   esta pantalla.

   Solo se puede tocar lo que lleva a algún sitio: si la estructura no tiene
   nodo en la red, se avisa en vez de abrir una exploración vacía.
   ============================================================ */

interface Structure {
  id: string;
  name: string;
  system?: string | null;
}

export function BodyViewer({
  onExplore,
}: {
  /** Se dispara al confirmar una zona: abre la conversación. */
  onExplore: (message: string, structureName: string) => void;
}) {
  const [atlas, setAtlas] = useState<VanatomeAtlas | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [selected, setSelected] = useState<Structure | null>(null);
  const controller = useVanatomeController();
  const mounted = useRef(true);
  const atlasRef = useRef(false);

  const catalogUrl = process.env.NEXT_PUBLIC_ANATOMY_CATALOG_URL;

  useEffect(() => {
    mounted.current = true;
    if (!catalogUrl) return;
    const timeout = setTimeout(() => {
      if (mounted.current && !atlasRef.current)
        setError(
          "El modelo del cuerpo está tardando demasiado. Recarga la página o revisa tu conexión.",
        );
    }, 45_000);

    const loader = createOfficialHumanAtlas({ catalogUrl });
    loader
      .loadProfile("full-body")
      .then((res: { atlas: VanatomeAtlas }) => {
        if (!mounted.current) return;
        atlasRef.current = true;
        setAtlas(res.atlas);
      })
      .catch((e: unknown) => {
        console.error("[biocode] atlas", e);
        if (mounted.current)
          setError(
            `No pude cargar el modelo del cuerpo: ${
              e instanceof Error ? e.message : "error desconocido"
            }`,
          );
      });
    return () => {
      mounted.current = false;
      clearTimeout(timeout);
    };
  }, [catalogUrl]);

  /** Índice id → estructura, para saber el nombre de lo que se tocó. */
  const index = useMemo(() => {
    const map = new Map<string, Structure>();
    const list = (atlas as unknown as { structures?: Structure[] } | null)?.structures;
    for (const s of list ?? []) map.set(s.id, s);
    return map;
  }, [atlas]);

  const nodeSlug = selected ? resolveNodeSlug(selected.id, selected.system) : null;
  const shownError =
    error ??
    (catalogUrl ? null : "Falta configurar la ruta del atlas anatómico.");

  if (shownError) {
    return (
      <div className="glass flex h-[min(76vh,760px)] min-h-[26rem] flex-col items-center justify-center gap-3 rounded-2xl p-6 text-center">
        <AlertTriangle className="size-6 text-danger" />
        <p className="max-w-md text-sm text-muted">{shownError}</p>
        <button
          onClick={() => window.location.reload()}
          className="h-9 rounded-xl border border-card-border px-4 text-sm text-foreground transition hover:border-ocean-violet/40"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!atlas) {
    return (
      <div className="glass flex h-[min(76vh,760px)] min-h-[26rem] flex-col items-center justify-center gap-3 rounded-2xl">
        <Loader2 className="size-6 animate-spin text-ocean-violet" />
        <p className="text-sm text-muted">
          Cargando tu cuerpo{progress > 0 ? ` · ${progress}%` : "…"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="glass relative overflow-hidden rounded-2xl border border-ocean-violet/15">
        <VanatomeViewer
          atlas={atlas}
          selectedId={controller.selectedId}
          onSelect={(id) => {
            controller.select(id);
            setSelected(id ? (index.get(id) ?? { id, name: id }) : null);
          }}
          focusRequestKey={controller.focusRequestKey}
          resetViewKey={controller.resetViewKey}
          displayMode="ghost"
          initialCameraPosition={[0, 0, 3.3]}
          initialCameraTarget={[0, 0, 0]}
          modelPosition={[0, -1, 0]}
          className="h-[min(76vh,760px)] min-h-[26rem] w-full [&>div]:h-full [&>div>div]:h-full [&_canvas]:!h-full [&_canvas]:!w-full"
          ariaLabel="Cuerpo interactivo de BIOCODE"
          onError={(err: { message?: string }) => {
            console.error("[biocode] visor", err);
            setError(
              `El visor 3D no pudo iniciar: ${err?.message ?? "revisa la consola"}`,
            );
          }}
          onLoadProgress={(p: { loaded?: number; total?: number }) => {
            if (p.total) setProgress(Math.round(((p.loaded ?? 0) / p.total) * 100));
          }}
        />

        <button
            onClick={() => {
              controller.reset();
              setSelected(null);
            }}
            className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-xl border border-card-border bg-ocean-surface/80 px-3 py-1.5 text-xs text-foreground/80 backdrop-blur transition hover:text-ocean-violet"
          >
            <RotateCcw className="size-3.5" /> Reiniciar vista
        </button>
      </div>

      {/* Zona seleccionada */}
      {selected && (
        <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
          <div className="min-w-0">
            <p className="text-[0.7rem] uppercase tracking-wider text-muted/70">
              Zona seleccionada
            </p>
            <p className="font-medium text-foreground">{selected.name}</p>
            {!nodeSlug && (
              <p className="mt-0.5 text-xs text-muted">
                Todavía no hay material propio sobre esta zona — igual puedo
                acompañarte con preguntas.
              </p>
            )}
          </div>
          <button
            onClick={() => onExplore(openingMessage(selected.name, nodeSlug), selected.name)}
            className="h-10 shrink-0 rounded-xl bg-ocean-violet px-4 text-sm font-medium text-white transition hover:brightness-110"
          >
            Explorar esta zona
          </button>
        </div>
      )}

      {/* Crédito exigido por la licencia del atlas (CC BY-SA 4.0) */}
      <p className="text-center text-[0.65rem] leading-relaxed text-muted/60">
        {ATLAS_ATTRIBUTION.text}{" "}
        <a
          href={ATLAS_ATTRIBUTION.sourceUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="underline hover:text-ocean-violet"
        >
          Fuente
        </a>{" "}
        ·{" "}
        <a
          href={ATLAS_ATTRIBUTION.licenseUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="underline hover:text-ocean-violet"
        >
          CC BY-SA 4.0
        </a>
      </p>
    </div>
  );
}
