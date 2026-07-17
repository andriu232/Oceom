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
import { labelTexture, LABEL_RATIO } from "@/components/galeria/texturas";

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

const RADIUS = 11; // radio fijo: el panel del frente queda grande y cercano
const PANEL_W = 6.4;
const PANEL_H = 4.0;
const STEP = 0.74; // paso angular fijo entre paneles (~42°) → gaps grandes
const FOCUS_DIST = 4.0; // distancia final del panel enfocado a la cámara
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

/* ── Panel ── */

function Panel({
  item,
  angle,
  index,
  count,
  ctl,
  map,
  onOpen,
}: {
  item: OrbitalItem;
  angle: number;
  index: number;
  count: number;
  ctl: React.MutableRefObject<Ctl>;
  map: THREE.Texture;
  onOpen?: (item: OrbitalItem) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const label = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);
  const geometry = useMemo(
    () => makeCurvedGeometry(PANEL_W, PANEL_H, RADIUS),
    [],
  );
  const { gl } = useThree();
  const maxAniso = useMemo(() => gl.capabilities.getMaxAnisotropy(), [gl]);

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
  const labelGeo = useMemo(
    () => new THREE.PlaneGeometry(PANEL_W, PANEL_W * LABEL_RATIO),
    [],
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
    const focused = c.focusKey === item.key;
    const p = focused ? c.focusP : 0;

    // Fuera del arco visible: ocultar y no seguir calculando.
    g.visible = vis > 0.001 || p > 0.001;
    if (!g.visible) return;

    // Riel puramente horizontal: los paneles viven en una sola fila (sin
    // dispersión vertical). Se bajan un poco para dejar aire arriba al
    // título + descripción que flotan sobre el panel.
    const yBase = -0.9;
    const rx = Math.sin(a) * RADIUS;
    const rz = -Math.cos(a) * RADIUS;
    if (p > 0.001) {
      const fz = -FOCUS_DIST;
      g.position.set(rx * (1 - p), yBase * (1 - p), rz + (fz - rz) * p);
      g.rotation.y = -a * (1 - p);
    } else {
      g.position.set(rx, yBase, rz);
      g.rotation.y = -a;
    }

    // Escala: presencia por cercanía al frente + hover + llenado al enfocar.
    let fill = 1;
    if (p > 0.001) {
      const vh = 2 * FOCUS_DIST * Math.tan((FOV * Math.PI) / 360);
      const vw = vh * (window.innerWidth / window.innerHeight);
      fill = 1 + (Math.min(vw * 0.82, vh * 1.55) / PANEL_W - 1) * p;
    }
    const mul = p > 0.001 ? 1 : item.sizeMul ?? 1;
    // Curva de presencia marcada: el frente domina, los lados recogen.
    const target = (0.5 + 0.85 * vis * vis) * (hover ? 1.03 : 1) * fill * mul;
    const s = m.scale.x + (target - m.scale.x) * 0.12;
    m.scale.set(s, s, s);

    // Etiqueta (título + descripción): sobre el panel, con su borde inferior
    // justo encima del borde superior del panel. Se atenúa a los lados y
    // desaparece al enfocar.
    if (label.current) {
      const labelH = PANEL_W * LABEL_RATIO;
      label.current.position.y = (PANEL_H / 2) * s + 0.15 + labelH / 2;
      const lm = label.current.material as THREE.MeshBasicMaterial;
      lm.opacity = Math.pow(vis, 1.3) * (1 - p);
      label.current.visible = lm.opacity > 0.02;
    }

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
}) {
  const tex = useLoader(THREE.TextureLoader, props.item.textureUrl!);
  tex.colorSpace = THREE.SRGBColorSpace;
  return <Panel {...props} map={tex} />;
}

/* ── Sincronía de frame: inercia de rotación, focus y panel frontal ── */

function FrameSync({ ctl }: { ctl: React.MutableRefObject<Ctl> }) {
  useFrame((state) => {
    const c = ctl.current;
    c.rot += (c.target - c.rot) * 0.075;
    c.focusP += (c.focusTarget - c.focusP) * 0.09;
    if (c.focusP < 0.005 && c.focusTarget === 0) c.focusKey = null;

    // Parallax SOLO horizontal: mover el mouse a los lados ladea levemente la
    // vista (inmersión en el eje que sí tiene contenido). El eje vertical se
    // mantiene fijo — no hay paneles arriba/abajo que revelar.
    const damp = 1 - c.focusP;
    const cam = state.camera;
    const trY = (0.5 - c.px) * 0.12 * damp;
    cam.rotation.y += (trY - cam.rotation.y) * 0.05;
    cam.position.y += (0 - cam.position.y) * 0.1;
    cam.rotation.x += (0 - cam.rotation.x) * 0.1;
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
  const drag = useRef<{ on: boolean; x: number } | null>(null);
  const wheelSnap = useRef<ReturnType<typeof setTimeout> | null>(null);

  const release = useCallback(() => {
    ctl.current.focusTarget = 0;
  }, []);

  useEffect(() => {
    onClose?.(release);
  }, [onClose, release]);

  useEffect(() => {
    if (focusReleased) release();
  }, [focusReleased, release]);

  const count = items.length;

  return (
    <div
      className={className}
      style={{ position: "relative", touchAction: "pan-y" }}
      onWheel={(e) => {
        if (ctl.current.focusKey) return;
        ctl.current.target = clampRot(
          ctl.current.target + (e.deltaY + e.deltaX) * 0.0016,
          count,
        );
        // Encaje al centro cuando la rueda se detiene.
        if (wheelSnap.current) clearTimeout(wheelSnap.current);
        wheelSnap.current = setTimeout(() => {
          ctl.current.target = snapRot(ctl.current.target, count);
        }, 160);
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
        ctl.current.target = clampRot(ctl.current.target - dx * 0.0042, count);
        ctl.current.dragMoved += Math.abs(dx);
      }}
      onPointerUp={() => {
        if (drag.current?.on && !ctl.current.focusKey) {
          ctl.current.target = snapRot(ctl.current.target, count);
        }
        drag.current = null;
      }}
      onPointerLeave={() => {
        if (drag.current?.on && !ctl.current.focusKey) {
          ctl.current.target = snapRot(ctl.current.target, count);
        }
        drag.current = null;
      }}
    >
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 0.001], fov: FOV }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ position: "absolute", inset: 0 }}
      >
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
