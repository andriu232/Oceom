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

/* ============================================================
   Galería orbital de OCEOM — motor 3D reutilizable inspirado en la galería
   de proyectos de lucas-aufrere.com, replicando su receta:
   · Anillo de radio 9 alrededor de la cámara; los paneles lo abrazan
     (geometría curvada con el mismo radio).
   · La rueda/drag rotan el anillo con inercia (sin scroll nativo).
   · Cada panel escala y se DESATURA según su distancia angular al frente
     (uniform uSaturation inyectado con onBeforeCompile).
   · Click → el panel viaja hacia la cámara (dolly), la encara y se APLANA
     (uniform uFlatProgress: `transformed.z *= 1.0 - uFlatProgress`).
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
  /** Altura del panel en el espacio (dispersión vertical, como la referencia). */
  yOff?: number;
  /** Multiplicador de tamaño (variedad entre paneles). */
  sizeMul?: number;
}

/** Estado mutable compartido (sin re-renders): rotación e interacción. */
interface Ctl {
  rot: number;
  target: number;
  focusKey: string | null;
  focusP: number;
  focusTarget: number;
  dragMoved: number;
  /** Puntero normalizado 0..1 (parallax de cámara). */
  px: number;
  py: number;
}

const RADIUS = 9;
const PANEL_W = 6.4;
const PANEL_H = 4.0;
const DOLLY = 5.2; // cuánto viaja el panel hacia la cámara al enfocarse

/** Plano curvado que abraza el cilindro del anillo (radio = RADIUS). */
function makeCurvedGeometry(w: number, h: number, r: number, segs = 40) {
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

const wrapAngle = (a: number) => {
  let x = a % (Math.PI * 2);
  if (x > Math.PI) x -= Math.PI * 2;
  if (x < -Math.PI) x += Math.PI * 2;
  return x;
};

/* ── Panel ── */

function Panel({
  item,
  angle,
  ctl,
  map,
  onOpen,
}: {
  item: OrbitalItem;
  angle: number;
  ctl: React.MutableRefObject<Ctl>;
  map: THREE.Texture;
  onOpen?: (item: OrbitalItem) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);
  const geometry = useMemo(() => makeCurvedGeometry(PANEL_W, PANEL_H, RADIUS), []);
  const material = useMemo(() => makePanelMaterial(map), [map]);
  const { camera, size } = useThree();

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useFrame(() => {
    const c = ctl.current;
    const g = group.current;
    const m = mesh.current;
    if (!g || !m) return;

    const a = wrapAngle(angle + c.rot);
    const vis = Math.max(0, Math.min(1, 1 - Math.abs(a) / (Math.PI / 2)));
    const focused = c.focusKey === item.key;
    const p = focused ? c.focusP : 0;

    // Posición en el anillo (o viajando hacia la cámara si está enfocado).
    const yBase = item.yOff ?? 0;
    const rx = Math.sin(a) * RADIUS;
    const rz = -Math.cos(a) * RADIUS;
    if (p > 0.001) {
      const fz = -(RADIUS - DOLLY);
      g.position.set(rx * (1 - p), yBase * (1 - p), rz + (fz - rz) * p);
      g.rotation.y = -a * (1 - p);
    } else {
      g.position.set(rx, yBase, rz);
      g.rotation.y = -a;
    }

    // Escala: presencia por cercanía al frente + hover + llenado al enfocar.
    let fill = 1;
    if (p > 0.001) {
      const persp = camera as THREE.PerspectiveCamera;
      const dist = RADIUS - DOLLY;
      const vh = 2 * dist * Math.tan((persp.fov * Math.PI) / 360);
      const vw = vh * (size.width / size.height);
      fill = 1 + (Math.min(vw * 0.72, vh * 1.45) / PANEL_W - 1) * p;
    }
    const mul = p > 0.001 ? 1 : item.sizeMul ?? 1;
    const target = (0.62 + 0.38 * vis) * (hover ? 1.03 : 1) * fill * mul;
    const s = m.scale.x + (target - m.scale.x) * 0.12;
    m.scale.set(s, s, s);

    // Uniforms: desaturación por ángulo, aplanado por enfoque.
    const shader = material.userData.shader as
      | { uniforms: { uSaturation: { value: number }; uFlatProgress: { value: number } } }
      | undefined;
    if (shader) {
      shader.uniforms.uSaturation.value = focused ? Math.max(vis, p) : vis;
      shader.uniforms.uFlatProgress.value = p;
    }
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
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = "";
        }}
        onClick={(e) => {
          e.stopPropagation();
          const c = ctl.current;
          if (c.dragMoved > 6) return; // fue un arrastre, no un click
          if (!c.focusKey) {
            c.focusKey = item.key;
            c.focusTarget = 1;
            onOpen?.(item);
          }
        }}
      />
    </group>
  );
}

function PhotoPanel(props: {
  item: OrbitalItem;
  angle: number;
  ctl: React.MutableRefObject<Ctl>;
  onOpen?: (item: OrbitalItem) => void;
}) {
  const tex = useLoader(THREE.TextureLoader, props.item.textureUrl!);
  tex.colorSpace = THREE.SRGBColorSpace;
  return <Panel {...props} map={tex} />;
}

/* ── Sincronía de frame: inercia de rotación, focus y panel frontal ── */

function FrameSync({
  ctl,
  count,
  onFront,
}: {
  ctl: React.MutableRefObject<Ctl>;
  count: number;
  onFront: (i: number) => void;
}) {
  const last = useRef(-1);
  useFrame((state) => {
    const c = ctl.current;
    c.rot += (c.target - c.rot) * 0.075;
    c.focusP += (c.focusTarget - c.focusP) * 0.09;
    if (c.focusP < 0.005 && c.focusTarget === 0) c.focusKey = null;

    // Parallax de cámara con el puntero (la inmersión de la referencia):
    // mover el mouse sube/baja y ladea la vista, revelando los paneles
    // dispersos a otras alturas. Se amortigua durante el foco.
    const damp = 1 - c.focusP;
    const cam = state.camera;
    const ty = (0.5 - c.py) * 3.0 * damp;
    const trx = (0.5 - c.py) * 0.16 * damp;
    const trY = (0.5 - c.px) * 0.22 * damp;
    cam.position.y += (ty - cam.position.y) * 0.055;
    cam.rotation.x += (trx - cam.rotation.x) * 0.055;
    cam.rotation.y += (trY - cam.rotation.y) * 0.055;

    if (count > 0) {
      const step = (Math.PI * 2) / count;
      const idx = ((Math.round(-c.rot / step) % count) + count) % count;
      if (idx !== last.current) {
        last.current = idx;
        onFront(idx);
      }
    }
  });
  return null;
}

/* ── Galería ── */

export function OrbitalGallery({
  items,
  onOpen,
  onClose,
  focusReleased,
  className,
  hint = "Desliza o arrastra para navegar · toca para abrir",
}: {
  items: OrbitalItem[];
  /** Al hacer click en un panel (ya inicia el dolly+aplanado). */
  onOpen?: (item: OrbitalItem) => void;
  /** Cerrar el foco desde afuera: llama a la función que se te entrega. */
  onClose?: (release: () => void) => void;
  /** Señal externa: cuando cambia a true, libera el foco. */
  focusReleased?: boolean;
  className?: string;
  hint?: string;
}) {
  const ctl = useRef<Ctl>({
    rot: 0,
    target: 0,
    focusKey: null,
    focusP: 0,
    focusTarget: 0,
    dragMoved: 0,
    px: 0.5,
    py: 0.5,
  });
  const [front, setFront] = useState(0);
  const drag = useRef<{ on: boolean; x: number } | null>(null);

  const release = useCallback(() => {
    ctl.current.focusTarget = 0;
  }, []);

  useEffect(() => {
    onClose?.(release);
  }, [onClose, release]);

  useEffect(() => {
    if (focusReleased) release();
  }, [focusReleased, release]);

  const step = items.length > 0 ? (Math.PI * 2) / items.length : 0;
  const frontItem = items[front];

  return (
    <div
      className={className}
      style={{ position: "relative", touchAction: "pan-y" }}
      onWheel={(e) => {
        if (ctl.current.focusKey) return;
        ctl.current.target += (e.deltaY + e.deltaX) * 0.0016;
      }}
      onPointerDown={(e) => {
        drag.current = { on: true, x: e.clientX };
        ctl.current.dragMoved = 0;
      }}
      onPointerMove={(e) => {
        // Parallax: posición del puntero dentro del contenedor (0..1).
        const r = e.currentTarget.getBoundingClientRect();
        ctl.current.px = (e.clientX - r.left) / r.width;
        ctl.current.py = (e.clientY - r.top) / r.height;
        if (!drag.current?.on || ctl.current.focusKey) return;
        const dx = e.clientX - drag.current.x;
        drag.current.x = e.clientX;
        ctl.current.target -= dx * 0.0042;
        ctl.current.dragMoved += Math.abs(dx);
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
      onPointerLeave={() => {
        drag.current = null;
      }}
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 0.001], fov: 62 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ position: "absolute", inset: 0 }}
      >
        <FrameSync ctl={ctl} count={items.length} onFront={setFront} />
        {items.map((it, i) =>
          it.textureUrl ? (
            <Suspense key={it.key} fallback={null}>
              <PhotoPanel item={it} angle={i * step} ctl={ctl} onOpen={onOpen} />
            </Suspense>
          ) : it.texture ? (
            <Panel key={it.key} item={it} angle={i * step} ctl={ctl} map={it.texture} onOpen={onOpen} />
          ) : null,
        )}
      </Canvas>

      {/* Overlay DOM: título del panel frontal + guía */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
        <div>
          <p className="font-mono text-[0.65rem] tracking-[0.25em] text-ocean-cyan/80">
            {String(front + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-foreground drop-shadow-[0_2px_12px_rgba(3,6,14,0.9)]">
            {frontItem?.title ?? ""}
          </p>
          {frontItem?.subtitle && (
            <p className="text-sm text-foreground/65">{frontItem.subtitle}</p>
          )}
        </div>
        <p className="hidden text-[0.65rem] uppercase tracking-[0.18em] text-muted/60 sm:block">
          {hint}
        </p>
      </div>
    </div>
  );
}
