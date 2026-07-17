"use client";

/* eslint-disable react-hooks/immutability --
   Patrón imperativo de react-three-fiber: la rotación/inercia/foco viven en un
   ref mutable compartido que se actualiza a 60fps dentro de useFrame (sin
   pasar por setState, que re-renderizaría todo el árbol en cada frame). */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
  useCallback,
} from "react";
import * as THREE from "three";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { labelTexture } from "@/components/galeria/texturas";

/* ============================================================
   Galería orbital de OCEOM — motor 3D reutilizable inspirado en la galería
   de proyectos de lucas-aufrere.com:
   · Riel curvo (radio fijo) alrededor de la cámara; los paneles lo abrazan.
   · Rueda/drag rotan el riel con inercia y encajan (snap) al panel más cercano.
   · Cada panel escala y se DESATURA según su distancia angular al frente
     (uniform uSaturation inyectado con onBeforeCompile).
   · Título + descripción flotan en 3D sobre cada panel; el click abre el visor.
   · Render bajo demanda (frameloop="demand" + bucle rAF): solo dibuja mientras
     hay movimiento; en reposo no consume GPU.
   Lo consumen la Galería Astral y la portada de OCEOM LAB.
   ============================================================ */

export interface OrbitalItem {
  key: string;
  title: string;
  subtitle?: string;
  /** URL de imagen (foto). Si falta, debe venir `texture`. */
  textureUrl?: string;
  /** Textura ya generada (poemas / mundos, via canvas). */
  texture?: THREE.Texture;
  /** Multiplicador de tamaño (variedad entre paneles). */
  sizeMul?: number;
}

/** Estado mutable compartido (sin re-renders): rotación e interacción. */
interface Ctl {
  rot: number;
  target: number;
  dragMoved: number;
  /** Puntero horizontal normalizado 0..1 (parallax lateral de cámara). */
  px: number;
}

const RADIUS = 11; // radio fijo: el panel del frente queda grande y cercano
const PANEL_W = 6.4;
const PANEL_H = 4.0;
const STEP = 0.74; // paso angular fijo entre paneles (~42°) → gaps grandes
const FOV = 48;

/** Rotación mínima (último panel al frente). Es un RIEL acotado, no un anillo
 *  que se infla con la cantidad: así el frente siempre es grande y con gaps
 *  amplios, sin importar si hay 5 o 30 paneles (se navega de inicio a fin). */
const minRot = (count: number) => -(Math.max(0, count - 1) * STEP);
const clampRot = (r: number, count: number) => Math.min(0, Math.max(minRot(count), r));
/** Rotación que centra el panel más cercano (encaje, como la paginación
 *  de la referencia). */
const snapRot = (r: number, count: number) =>
  clampRot(Math.round(r / STEP) * STEP, count);

/** Plano curvado que abraza el cilindro del anillo (radio = RADIUS).
 *  26 segmentos bastan para una curva suave a este radio (menos vértices). */
function makeCurvedGeometry(w: number, h: number, r: number, segs = 26) {
  const geo = new THREE.PlaneGeometry(w, h, segs, 1);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const phi = x / r;
    pos.setX(i, Math.sin(phi) * r);
    pos.setZ(i, (Math.cos(phi) - 1) * r);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Material con desaturación + aplanado inyectados (receta de la referencia). */
function makePanelMaterial(map: THREE.Texture) {
  const mat = new THREE.MeshBasicMaterial({ map, toneMapped: false });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uSaturation = { value: 1 };
    shader.uniforms.uFlatProgress = { value: 0 };
    shader.vertexShader =
      "uniform float uFlatProgress;\n" +
      shader.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
         transformed.z *= 1.0 - uFlatProgress;`,
      );
    shader.fragmentShader =
      "uniform float uSaturation;\n" +
      shader.fragmentShader.replace(
        "#include <map_fragment>",
        `#include <map_fragment>
         float luma = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
         diffuseColor.rgb = mix(vec3(luma), diffuseColor.rgb, uSaturation);`,
      );
    mat.userData.shader = shader;
  };
  mat.customProgramCacheKey = () => "oceom-orbital-panel";
  return mat;
}

/* ── Panel ── */

function Panel({
  item,
  angle,
  index,
  count,
  ctl,
  map,
  onOpen,
  wake,
}: {
  item: OrbitalItem;
  angle: number;
  index: number;
  count: number;
  ctl: React.MutableRefObject<Ctl>;
  map: THREE.Texture;
  onOpen?: (item: OrbitalItem) => void;
  /** Despierta el bucle de render (para animar hover/escala). */
  wake?: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const label = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);
  const geometry = useMemo(
    () => makeCurvedGeometry(PANEL_W, PANEL_H, RADIUS),
    [],
  );
  const gl = useThree((s) => s.gl);
  // 8x de anisotropía es visualmente idéntico a 16x en estos paneles y más
  // barato por fragmento durante el movimiento.
  const maxAniso = useMemo(
    () => Math.min(8, gl.capabilities.getMaxAnisotropy()),
    [gl],
  );

  // Filtrado anisotrópico: lo que quita el desenfoque en los paneles inclinados.
  const material = useMemo(() => {
    map.anisotropy = maxAniso;
    map.minFilter = THREE.LinearMipmapLinearFilter;
    map.generateMipmaps = true;
    map.needsUpdate = true;
    return makePanelMaterial(map);
  }, [map, maxAniso]);

  // Etiqueta 3D (índice + título + descripción) que flota sobre el panel.
  const labelTex = useMemo(() => {
    const t = labelTexture(
      `${String(index + 1).padStart(2, "0")} / ${String(count).padStart(2, "0")}`,
      item.title,
      item.subtitle,
    );
    t.anisotropy = maxAniso;
    return t;
  }, [index, count, item.title, item.subtitle, maxAniso]);
  const labelMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: labelTex,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    [labelTex],
  );
  const labelRatio = (labelTex.userData.ratio as number) ?? 0.2;
  const labelGeo = useMemo(
    () => new THREE.PlaneGeometry(PANEL_W, PANEL_W * labelRatio),
    [labelRatio],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
      labelTex.dispose();
      labelMat.dispose();
      labelGeo.dispose();
    },
    [geometry, material, labelTex, labelMat, labelGeo],
  );

  useFrame(() => {
    const c = ctl.current;
    const g = group.current;
    const m = mesh.current;
    if (!g || !m) return;

    // Ángulo CRUDO (sin envolver): es un riel, no un anillo. Los paneles
    // lejanos quedan a los lados/atrás y se ocultan — nunca reaparecen al
    // frente dando la vuelta.
    const a = angle + c.rot;
    const vis = Math.max(0, Math.min(1, 1 - Math.abs(a) / (Math.PI / 2)));

    // Fuera del arco visible: ocultar y no seguir calculando.
    g.visible = vis > 0.001;
    if (!g.visible) return;

    // Riel puramente horizontal: los paneles viven en una sola fila (bajados
    // un poco para dejar aire arriba al título + descripción).
    g.position.set(Math.sin(a) * RADIUS, -0.5, -Math.cos(a) * RADIUS);
    g.rotation.y = -a;

    // Escala: presencia marcada por cercanía al frente + hover.
    const target = (0.6 + 1.05 * vis * vis) * (hover ? 1.03 : 1) * (item.sizeMul ?? 1);
    const s = m.scale.x + (target - m.scale.x) * 0.12;
    m.scale.set(s, s, s);

    // Etiqueta (título + descripción): pegada justo encima del panel.
    if (label.current) {
      const labelH = PANEL_W * labelRatio;
      label.current.position.y = (PANEL_H / 2) * s + 0.06 + labelH / 2;
      const lm = label.current.material as THREE.MeshBasicMaterial;
      lm.opacity = Math.pow(vis, 1.3);
      label.current.visible = lm.opacity > 0.02;
    }

    // Desaturación por ángulo (uniform inyectado).
    const shader = material.userData.shader as
      | { uniforms: { uSaturation: { value: number } } }
      | undefined;
    if (shader) shader.uniforms.uSaturation.value = vis;
  });

  return (
    <group ref={group}>
      <mesh
        ref={mesh}
        geometry={geometry}
        material={material}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = "pointer";
          wake?.();
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = "";
          wake?.();
        }}
        onClick={(e) => {
          e.stopPropagation();
          // Si hubo arrastre no es un click. Abre el visor directamente (el
          // acercamiento lo hace el lightbox, sin animación 3D).
          if (ctl.current.dragMoved > 6) return;
          onOpen?.(item);
        }}
      />
      <mesh
        ref={label}
        geometry={labelGeo}
        material={labelMat}
        raycast={() => null}
      />
    </group>
  );
}

function PhotoPanel(props: {
  item: OrbitalItem;
  angle: number;
  index: number;
  count: number;
  ctl: React.MutableRefObject<Ctl>;
  onOpen?: (item: OrbitalItem) => void;
  wake?: () => void;
}) {
  const tex = useLoader(THREE.TextureLoader, props.item.textureUrl!);
  tex.colorSpace = THREE.SRGBColorSpace;
  // Cuando la textura ya está lista, despierta el render (y anima su entrada).
  const { wake } = props;
  useEffect(() => {
    wake?.();
  }, [tex, wake]);
  return <Panel {...props} map={tex} />;
}

/* ── Sincronía de frame: inercia de rotación + parallax horizontal ── */

function FrameSync({ ctl }: { ctl: React.MutableRefObject<Ctl> }) {
  useFrame((state) => {
    const c = ctl.current;
    c.rot += (c.target - c.rot) * 0.075;

    // Parallax SOLO horizontal: mover el mouse a los lados ladea levemente la
    // vista. El eje vertical queda fijo (no hay paneles arriba/abajo).
    const cam = state.camera;
    const trY = (0.5 - c.px) * 0.12;
    cam.rotation.y += (trY - cam.rotation.y) * 0.05;
  });
  return null;
}

/** Captura la función `invalidate` de R3F para dispararla desde los handlers
 *  del DOM (fuera del Canvas) y pinta el primer frame. */
function Hookup({ set }: { set: (fn: () => void) => void }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    set(invalidate);
    invalidate();
  }, [invalidate, set]);
  return null;
}

/* ── Galería ── */

export function OrbitalGallery({
  items,
  onOpen,
  className,
  hint = "Desliza o arrastra para navegar · toca para abrir",
}: {
  items: OrbitalItem[];
  /** Al hacer click en un panel. */
  onOpen?: (item: OrbitalItem) => void;
  className?: string;
  hint?: string;
}) {
  const ctl = useRef<Ctl>({ rot: 0, target: 0, dragMoved: 0, px: 0.5 });
  const drag = useRef<{ on: boolean; x: number } | null>(null);
  const wheelSnap = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rect = useRef<DOMRect | null>(null); // rect cacheado (evita reflow por move)
  const invalidateRef = useRef<(() => void) | null>(null);
  const setInvalidate = useCallback((fn: () => void) => {
    invalidateRef.current = fn;
  }, []);

  // Bucle de render bajo demanda: un rAF externo pide frames a R3F mientras
  // haya movimiento (interacción reciente o rotación sin asentar) y se detiene
  // solo — así ninguna animación queda a medias y en reposo no se dibuja.
  const dirtyUntil = useRef(0);
  const rafId = useRef(0);
  const wake = useCallback(() => {
    dirtyUntil.current = performance.now() + 650;
    if (rafId.current) return;
    const loop = () => {
      invalidateRef.current?.();
      const c = ctl.current;
      if (Math.abs(c.target - c.rot) > 0.0015) {
        dirtyUntil.current = performance.now() + 350;
      }
      if (performance.now() < dirtyUntil.current) {
        rafId.current = requestAnimationFrame(loop);
      } else {
        rafId.current = 0;
      }
    };
    rafId.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    wake(); // primera entrada (animar aparición de paneles)
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [wake]);

  const count = items.length;

  return (
    <div
      className={className}
      style={{ position: "relative", touchAction: "pan-y" }}
      onWheel={(e) => {
        ctl.current.target = clampRot(
          ctl.current.target + (e.deltaY + e.deltaX) * 0.0016,
          count,
        );
        wake();
        // Encaje al centro cuando la rueda se detiene.
        if (wheelSnap.current) clearTimeout(wheelSnap.current);
        wheelSnap.current = setTimeout(() => {
          ctl.current.target = snapRot(ctl.current.target, count);
          wake();
        }, 160);
      }}
      onPointerEnter={(e) => {
        rect.current = e.currentTarget.getBoundingClientRect();
      }}
      onPointerDown={(e) => {
        rect.current = e.currentTarget.getBoundingClientRect();
        drag.current = { on: true, x: e.clientX };
        ctl.current.dragMoved = 0;
      }}
      onPointerMove={(e) => {
        // Parallax: posición horizontal del puntero (rect cacheado, sin reflow).
        const r =
          rect.current ?? (rect.current = e.currentTarget.getBoundingClientRect());
        ctl.current.px = (e.clientX - r.left) / r.width;
        wake();
        if (!drag.current?.on) return;
        const dx = e.clientX - drag.current.x;
        drag.current.x = e.clientX;
        ctl.current.target = clampRot(ctl.current.target - dx * 0.0042, count);
        ctl.current.dragMoved += Math.abs(dx);
      }}
      onPointerUp={() => {
        if (drag.current?.on) {
          ctl.current.target = snapRot(ctl.current.target, count);
          wake();
        }
        drag.current = null;
      }}
      onPointerLeave={() => {
        if (drag.current?.on) {
          ctl.current.target = snapRot(ctl.current.target, count);
          wake();
        }
        drag.current = null;
      }}
    >
      <Canvas
        frameloop="demand"
        dpr={[1, 2]}
        camera={{ position: [0, 0, 0.001], fov: FOV }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ position: "absolute", inset: 0 }}
      >
        <Hookup set={setInvalidate} />
        <FrameSync ctl={ctl} />
        {items.map((it, i) =>
          it.textureUrl ? (
            <Suspense key={it.key} fallback={null}>
              <PhotoPanel
                item={it}
                angle={i * STEP}
                index={i}
                count={count}
                ctl={ctl}
                onOpen={onOpen}
                wake={wake}
              />
            </Suspense>
          ) : it.texture ? (
            <Panel
              key={it.key}
              item={it}
              angle={i * STEP}
              index={i}
              count={count}
              ctl={ctl}
              map={it.texture}
              onOpen={onOpen}
              wake={wake}
            />
          ) : null,
        )}
      </Canvas>

      {/* Overlay DOM: solo la guía. El título y la descripción van en 3D
          SOBRE cada panel (labelTexture). */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-end p-5">
        <p className="hidden text-[0.65rem] uppercase tracking-[0.18em] text-muted/50 sm:block">
          {hint}
        </p>
      </div>
    </div>
  );
}
