"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  VanatomeViewer,
  useVanatomeController,
  getRelatedStructureIds,
} from "@vixotic/vanatome-react";
import type { VanatomeAtlas } from "@vixotic/vanatome-react";
import { _roots } from "@react-three/fiber";
import type * as THREE from "three";
import { createOfficialHumanAtlas } from "@vixotic/vanatome-atlas";
import { Loader2, RotateCcw, AlertTriangle, Undo2 } from "lucide-react";
import {
  resolveNodeSlug,
  openingMessage,
  prettyStructureName,
  NODE_LABELS,
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

/** Apariencia: sin pulso en la selección (obliga a repintar cada cuadro).
 *
 *  El visor enciende las hijas de lo señalado a 0.55 de la intensidad de
 *  hover, así que señalar el estómago enciende también sus partes. */
const APPEARANCE = {
  ghostOpacity: 0.26,
  parentContextOpacity: 0.16,
  selectedEmissiveIntensity: 1.0,
  hoverEmissiveIntensity: 1.6,
  pulseSelection: false,
};

/** Violeta saturado para el resaltado. NO es el `--ocean-violet` de la marca
 *  (#818cf8): ese es un violeta claro y, multiplicado por la intensidad
 *  emisiva, se satura hacia el blanco — que es justo el problema que se
 *  quería resolver. Este mantiene el tono al encenderse, y contrasta con el
 *  cian con que el visor pinta esqueleto y silueta.
 *  Ver `paintHover`: el color no se puede pasar como prop al visor. */
const HOVER_COLOR = "#7c3aed";

export function BodyViewer({
  onExplore,
}: {
  /** El slug es el nodo de la red al que lleva esa estructura, o null si
   *  BIOCODE aún no tiene material propio sobre ella. */
  onExplore: (message: string, structureName: string, nodeSlug: string | null) => void;
}) {
  const [atlas, setAtlas] = useState<VanatomeAtlas | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [modelReady, setModelReady] = useState(false);
  const [selected, setSelected] = useState<Structure | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const controller = useVanatomeController();
  const mounted = useRef(true);
  const loaded = useRef(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);

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

  /* Cuerpo andrógino (1 de 2): los ÓRGANOS masculinos.
     El atlas es un cuerpo masculino —su sistema reproductivo son 21
     estructuras, todas masculinas— y no existe versión femenina (Z-Anatomy
     parte de BodyParts3D, que es un conjunto de datos masculino). Ocultar ese
     sistema es lo honesto mientras no haya modelo femenino: nadie debería
     tener que verse en un cuerpo que no es el suyo para explorar su espalda.
     No se pierde nada tocable: la zona pélvica no tiene nodo anclado y
     `ciclo-hormonal` se encuentra por búsqueda de texto. */
  const hiddenIds = useMemo(
    () =>
      (atlas?.structures ?? [])
        .filter((s) => (s as Structure & { system?: string }).system === "reproductive")
        .map((s) => s.id),
    [atlas],
  );

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

  /** Lo que hay bajo el cursor. El visor solo avisa de estructuras
   *  seleccionables, así que el `body-shell` (la silueta exterior) no
   *  aparece por aquí. */
  const hovered = hoveredId ? (index.get(hoveredId) ?? null) : null;
  const hoveredSlug = hovered ? resolveNodeSlug(hovered.id, hovered.system) : null;
  const hoveredZone = hoveredSlug ? NODE_LABELS[hoveredSlug] : null;

  /* ----------------------------------------------------------
     Cuerpo andrógino (2 de 2): los genitales EXTERNOS.

     No están en el sistema reproductivo, sino dentro de la malla de piel
     (`body-shell`), como las piezas `Urogenital region.l/.r` y `Pubic
     hairs`. Ocultarlas con `hiddenIds` no sirve: ese mecanismo trabaja por
     estructura del atlas y las tres comparten el id `body-shell` con el
     resto de la piel — se iría el cuerpo entero. Y poner `visible = false`
     tampoco: el visor reescribe la visibilidad de TODAS las mallas cada vez
     que cambia el hover, así que volverían a aparecer al primer movimiento.
     Por eso se sacan de la escena, una sola vez, cuando el modelo carga.
     ---------------------------------------------------------- */
  useEffect(() => {
    if (!modelReady) return;
    // El patrón va contra el nombre YA saneado por three: al cargar el glTF
    // los espacios pasan a "_" y los puntos desaparecen, así que
    // "body-shell__Urogenital region.l" llega como
    // "body-shell__Urogenital_regionl". Por eso se corta en la primera
    // palabra en vez de escribir el nombre completo.
    const quitar = /^body-shell__(Urogenital|Pubic)/i;

    const podar = () => {
      const canvas = hostRef.current?.querySelector("canvas");
      if (!canvas) return;
      const scene = _roots.get(canvas)?.store.getState().scene;
      if (!scene) return;
      const sobran: THREE.Object3D[] = [];
      scene.traverse((object: THREE.Object3D) => {
        if (quitar.test(object.name)) sobran.push(object);
      });
      for (const object of sobran) object.removeFromParent();
    };

    const timers = [0, 120, 400].map((ms) => window.setTimeout(podar, ms));
    return () => timers.forEach(clearTimeout);
  }, [modelReady]);

  /* ----------------------------------------------------------
     Resaltado en violeta.

     El visor pinta el hover haciendo `emissive.copy(material.color)`, y las
     mallas de Z-Anatomy son de color hueso: el resaltado salía blanco sobre
     un cuerpo ya blanquecino. El paquete no expone un color de hover (0.1.6
     es la última versión), así que se repinta la emisiva sobre la escena ya
     montada, un cuadro después de que el visor la escriba.

     No hay que deshacerlo: el visor recorre TODAS las mallas cada vez que
     cambia el hover, así que al salir de una estructura él mismo la devuelve
     a su color. Si algún día `_roots` deja de existir, esto no rompe nada:
     el resaltado vuelve a ser blanco.
     ---------------------------------------------------------- */
  useEffect(() => {
    if (!hoveredId || !atlas) return;
    const family = getRelatedStructureIds(atlas.structures, hoveredId);

    const paintHover = () => {
      const canvas = hostRef.current?.querySelector("canvas");
      if (!canvas) return;
      const scene = _roots.get(canvas)?.store.getState().scene;
      if (!scene) return;

      scene.traverse((object: THREE.Object3D) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh) return;

        // El id anatómico puede estar en la malla o en algún ancestro.
        let node: THREE.Object3D | null = object;
        let id: string | undefined;
        while (node && !id) {
          const own = node.userData?.anatomyId;
          if (typeof own === "string") id = own;
          node = node.parent;
        }
        if (!id || !family.has(id)) return;

        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const material of materials) {
          const emissive = (material as THREE.MeshStandardMaterial).emissive;
          if (!emissive) continue;
          emissive.set(HOVER_COLOR);
          material.needsUpdate = true;
        }
      });
    };

    // Se repinta tres veces seguidas y con temporizador, no con
    // requestAnimationFrame: el visor escribe la emisiva en su propio efecto,
    // dentro del árbol del canvas, y ese commit no está sincronizado con
    // este. Un solo repintado se perdía cuando el suyo llegaba después.
    const timers = [0, 60, 160].map((ms) => window.setTimeout(paintHover, ms));
    return () => timers.forEach(clearTimeout);
  }, [hoveredId, atlas]);

  /** La etiqueta se mueve escribiendo el transform directamente: seguir al
   *  cursor con estado de React repinta el árbol en cada pixel. */
  function moveTip() {
    const tip = tipRef.current;
    const host = hostRef.current;
    const point = pointerRef.current;
    if (!tip || !host || !point) return;
    const box = host.getBoundingClientRect();
    const x = point.x - box.left;
    const y = point.y - box.top;
    const left = Math.min(Math.max(8, x + 16), Math.max(8, box.width - tip.offsetWidth - 8));
    const top = Math.min(Math.max(8, y + 18), Math.max(8, box.height - tip.offsetHeight - 8));
    tip.style.transform = `translate3d(${left}px, ${top}px, 0)`;
  }

  /* Al aparecer hay que colocarla ya: el movimiento que la dispara ocurre
     antes de que exista en el DOM, y sin esto nace en la esquina. */
  useLayoutEffect(() => {
    if (hovered) moveTip();
  });

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
    <div
      ref={hostRef}
      className="relative"
      onPointerMove={(event) => {
        pointerRef.current = { x: event.clientX, y: event.clientY };
        moveTip();
      }}
    >
      {atlas && visible ? (
        <VanatomeViewer
          atlas={atlas}
          selectedId={controller.selectedId}
          hoveredId={hoveredId}
          onHover={setHoveredId}
          isolation={controller.isolation}
          hiddenIds={hiddenIds}
          onSelect={pick}
          focusRequestKey={controller.focusRequestKey}
          resetViewKey={controller.resetViewKey}
          displayMode="ghost"
          appearance={APPEARANCE}
          initialCameraPosition={[0, 0, 2.4]}
          initialCameraTarget={[0, 0, 0]}
          modelPosition={[0, -0.9, 0]}
          minDistance={0.35}
          maxDistance={9}
          enablePan
          focusDistance={0.5}
          focusPadding={1.35}
          cameraAnimationDuration={700}
          className={`${shell} outline-none [&>div]:outline-none [&_canvas]:outline-none [&>div]:h-full [&>div>div]:h-full [&_canvas]:!h-full [&_canvas]:!w-full ${
            hoveredId ? "[&_canvas]:cursor-pointer" : "[&_canvas]:cursor-grab"
          }`}
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

      {/* Qué estás señalando. Primero la zona en español (a dónde lleva) y
          debajo el nombre anatómico del atlas, que va en inglés. */}
      {hovered && modelReady && (
        <div
          ref={tipRef}
          className="pointer-events-none absolute left-0 top-0 z-10 max-w-[16rem] rounded-xl border border-card-border bg-ocean-surface/95 px-3 py-2 shadow-lg"
        >
          <p className="text-sm font-medium leading-tight text-foreground">
            {hoveredZone ?? prettyStructureName(hovered.name)}
          </p>
          <p className="mt-0.5 text-[0.68rem] leading-snug text-muted">
            {hoveredZone
              ? prettyStructureName(hovered.name)
              : "Aún sin material propio — igual puedo acompañarte"}
          </p>
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
            onClick={() =>
              onExplore(openingMessage(selected.name, nodeSlug), selected.name, nodeSlug)
            }
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
