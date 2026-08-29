"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { VanatomeViewer, useVanatomeController } from "@vixotic/vanatome-react";
import type { VanatomeAtlas } from "@vixotic/vanatome-react";
import { createOfficialHumanAtlas } from "@vixotic/vanatome-atlas";
import { Loader2, RotateCcw, AlertTriangle, Undo2 } from "lucide-react";
import {
  resolveNodeSlug,
  openingMessage,
  ATLAS_ATTRIBUTION,
} from "@/lib/biocode/anatomy-map";

/* ============================================================
   Cuerpo interactivo de BIOCODE.

   Sin marco: flota sobre el fondo del santuario. Al tocar una estructura, se
   aísla y la cámara vuela hacia ella — el órgano "sale" del cuerpo.

   Rendimiento: el visor dibuja de forma continua y no expone control del
   bucle de render, así que se DESMONTA cuando sale de pantalla. Mientras no
   se ve, no consume GPU. (Mismo espíritu que el render bajo demanda de la
   Galería Astral.)
   ============================================================ */

interface Structure {
  id: string;
  name: string;
  system?: string | null;
  kind?: string;
  parentId?: string;
}

/** Apariencia: sin pulso en la selección (obliga a repintar cada cuadro). */
const APPEARANCE = {
  ghostOpacity: 0.26,
  parentContextOpacity: 0.16,
  selectedEmissiveIntensity: 0.9,
  hoverEmissiveIntensity: 0.35,
  pulseSelection: false,
};

export function BodyViewer({
  onExplore,
}: {
  onExplore: (message: string, structureName: string) => void;
}) {
  const [atlas, setAtlas] = useState<VanatomeAtlas | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [modelReady, setModelReady] = useState(false);
  const [selected, setSelected] = useState<Structure | null>(null);
  const [visible, setVisible] = useState(false);
  const controller = useVanatomeController();
  const mounted = useRef(true);
  const loaded = useRef(false);
  const hostRef = useRef<HTMLDivElement>(null);

  const catalogUrl = process.env.NEXT_PUBLIC_ANATOMY_CATALOG_URL;

  /* Solo dibuja mientras está en pantalla: fuera de vista, se desmonta. */
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    mounted.current = true;
    if (!catalogUrl) return;

    const timeout = setTimeout(() => {
      if (mounted.current && !loaded.current)
        setError(
          "El modelo del cuerpo está tardando demasiado. Recarga la página o revisa tu conexión.",
        );
    }, 45_000);

    createOfficialHumanAtlas({ catalogUrl })
      .loadProfile("full-body")
      .then((res: { atlas: VanatomeAtlas }) => {
        if (!mounted.current) return;
        loaded.current = true;
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

  const index = useMemo(() => {
    const map = new Map<string, Structure>();
    for (const s of atlas?.structures ?? []) map.set(s.id, s as Structure);
    return map;
  }, [atlas]);

  const nodeSlug = selected ? resolveNodeSlug(selected.id, selected.system) : null;
  const shownError =
    error ?? (catalogUrl ? null : "Falta configurar la ruta del atlas anatómico.");

  /** Toca una estructura: sale del cuerpo y la cámara vuela hacia ella.
   *
   *  Dos decisiones aprendidas probándolo:
   *  · Si se toca una "parte" (una tira de tendón, una vértebra suelta), se
   *    aísla su ÓRGANO padre: aislar la parte sola deja una vista sin sentido.
   *  · Modo "parent-context": el resto del cuerpo queda tenue alrededor, para
   *    no perder la referencia de dónde está eso en ti. */
  function pick(id: string | null) {
    controller.select(id);
    if (!id) {
      setSelected(null);
      controller.isolate(null);
      return;
    }
    const st = index.get(id) ?? { id, name: id };
    setSelected(st);
    const target = st.kind === "part" && st.parentId ? st.parentId : id;
    controller.isolate(target, "parent-context");
    requestAnimationFrame(() => controller.focus(target));
  }

  function backToBody() {
    controller.isolate(null);
    controller.select(null);
    controller.reset();
    setSelected(null);
  }

  const shell = "h-[min(82vh,860px)] min-h-[28rem] w-full";

  if (shownError) {
    return (
      <div className={`flex ${shell} flex-col items-center justify-center gap-3 text-center`}>
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

  return (
    <div ref={hostRef} className="relative">
      {atlas && visible ? (
        <VanatomeViewer
          atlas={atlas}
          selectedId={controller.selectedId}
          isolation={controller.isolation}
          onSelect={pick}
          focusRequestKey={controller.focusRequestKey}
          resetViewKey={controller.resetViewKey}
          displayMode="ghost"
          appearance={APPEARANCE}
          initialCameraPosition={[0, 0, 3.3]}
          initialCameraTarget={[0, 0, 0]}
          modelPosition={[0, -1, 0]}
          minDistance={0.35}
          maxDistance={9}
          enablePan
          focusDistance={0.5}
          focusPadding={1.35}
          cameraAnimationDuration={700}
          className={`${shell} outline-none [&>div]:outline-none [&_canvas]:outline-none [&>div]:h-full [&>div>div]:h-full [&_canvas]:!h-full [&_canvas]:!w-full`}
          ariaLabel="Cuerpo interactivo de BIOCODE"
          onLoadProgress={(p: { percentage?: number; loaded?: number; total?: number }) =>
            setProgress(
              Math.round(p.percentage ?? (p.total ? ((p.loaded ?? 0) / p.total) * 100 : 0)),
            )
          }
          onModelReady={() => setModelReady(true)}
          onFocusRejected={(id: string, reason: string) =>
            console.warn("[biocode] foco rechazado", id, reason)
          }
          onError={(err: { message?: string }) => {
            console.error("[biocode] visor", err);
            setError(`El visor 3D no pudo iniciar: ${err?.message ?? "revisa la consola"}`);
          }}
        />
      ) : (
        <div className={`flex ${shell} flex-col items-center justify-center gap-3`}>
          <Loader2 className="size-6 animate-spin text-ocean-violet" />
          <p className="text-sm text-muted">Preparando el cuerpo…</p>
        </div>
      )}

      {atlas && visible && !modelReady && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3">
          <Loader2 className="size-6 animate-spin text-ocean-violet" />
          <p className="text-sm text-muted">
            Cargando tu cuerpo{progress > 0 ? ` · ${progress}%` : "…"}
          </p>
        </div>
      )}

      {/* Controles flotantes */}
      {atlas && visible && modelReady && (
        <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-between px-3">
          <div className="pointer-events-auto">
            {selected && (
              <button
                onClick={backToBody}
                className="inline-flex items-center gap-1.5 rounded-xl border border-card-border bg-ocean-surface/70 px-3 py-1.5 text-xs text-foreground/85 backdrop-blur transition hover:text-ocean-violet"
              >
                <Undo2 className="size-3.5" /> Ver cuerpo completo
              </button>
            )}
          </div>
          <button
            onClick={backToBody}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-xl border border-card-border bg-ocean-surface/70 px-3 py-1.5 text-xs text-foreground/85 backdrop-blur transition hover:text-ocean-violet"
          >
            <RotateCcw className="size-3.5" /> Reiniciar vista
          </button>
        </div>
      )}

      {/* Estructura seleccionada, flotando sobre el modelo */}
      {selected && (
        <div className="pointer-events-auto absolute inset-x-3 bottom-6 mx-auto flex max-w-xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-card-border bg-ocean-surface/80 p-4 backdrop-blur">
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

      <p className="mt-4 text-center text-[0.65rem] leading-relaxed text-muted/50">
        {ATLAS_ATTRIBUTION.text}{" "}
        <a href={ATLAS_ATTRIBUTION.sourceUrl} target="_blank" rel="noreferrer noopener" className="underline hover:text-ocean-violet">
          Fuente
        </a>{" "}
        ·{" "}
        <a href={ATLAS_ATTRIBUTION.licenseUrl} target="_blank" rel="noreferrer noopener" className="underline hover:text-ocean-violet">
          CC BY-SA 4.0
        </a>
      </p>
    </div>
  );
}
