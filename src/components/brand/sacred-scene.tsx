"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { PointerControl } from "./pointer-interaction";

/* ============================================================
   SacredScene — geometría sagrada flotando en el océano (WebGL r3f).
   Cubo de Metatrón central (interactivo) + Flor de la Vida de fondo +
   partículas de luz + parallax de cámara. Adaptable a tema claro/oscuro:
   en claro usa blending NORMAL con teal profundo (el aditivo no se ve
   sobre fondo claro); en oscuro, cyan aditivo luminoso (como estaba).
   ============================================================ */

type Theme = "light" | "dark";

function palette(theme: Theme) {
  const light = theme === "light";
  return {
    light,
    cyan: light ? "#0c7d92" : "#22d3ee",
    glow: light ? "#0e9488" : "#5eead4",
    blend: light ? THREE.NormalBlending : THREE.AdditiveBlending,
    fog: light ? "#e9f4f8" : "#06243a",
    ambient: light ? "#eaf6ff" : "#a9e6ff",
    mote: light ? "#3f9db1" : "#bfeef5",
    moteOp: light ? 0.28 : 0.7,
    lines: light ? 0.62 : 0.48,
    circles: light ? 0.9 : 0.78,
    flowerBg: light ? 0.28 : 0.2,
    boostLines: light ? 0.4 : 0.8,
    boostCircles: light ? 0.3 : 0.6,
  };
}
type Pal = ReturnType<typeof palette>;

function buildCircles(centers: [number, number][], radius: number, segments = 64) {
  const pts: number[] = [];
  for (const [cx, cy] of centers) {
    for (let s = 0; s < segments; s++) {
      const a0 = (s / segments) * Math.PI * 2;
      const a1 = ((s + 1) / segments) * Math.PI * 2;
      pts.push(cx + Math.cos(a0) * radius, cy + Math.sin(a0) * radius, 0);
      pts.push(cx + Math.cos(a1) * radius, cy + Math.sin(a1) * radius, 0);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

/* ---------- Cubo de Metatrón (mandala central, interactivo) ---------- */
function Metatron({ control, pal }: { control?: PointerControl; pal: Pal }) {
  const group = useRef<THREE.Group>(null!);
  const linesMat = useRef<THREE.LineBasicMaterial>(null!);
  const circlesMat = useRef<THREE.LineBasicMaterial>(null!);
  const spinZ = useRef(0);

  const { circles, lines } = useMemo(() => {
    const r = 1;
    const centers: [number, number][] = [[0, 0]];
    for (let k = 0; k < 6; k++) {
      const a = (Math.PI / 3) * k - Math.PI / 6;
      centers.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    for (let k = 0; k < 6; k++) {
      const a = (Math.PI / 3) * k - Math.PI / 6;
      centers.push([Math.cos(a) * 2 * r, Math.sin(a) * 2 * r]);
    }
    const seg: number[] = [];
    for (let i = 0; i < centers.length; i++)
      for (let j = i + 1; j < centers.length; j++)
        seg.push(centers[i][0], centers[i][1], 0, centers[j][0], centers[j][1], 0);
    const lines = new THREE.BufferGeometry();
    lines.setAttribute("position", new THREE.Float32BufferAttribute(seg, 3));
    return { circles: buildCircles(centers, r, 56), lines };
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.05);
    const c = control;

    const user = c?.spin ?? 0;
    spinZ.current += (0.04 + user) * dt;
    group.current.rotation.z = spinZ.current;
    if (c) c.spin += -c.spin * Math.min(1, dt * 1.4);

    group.current.scale.setScalar(2.1 * (1 + Math.sin(t * 0.5) * 0.03));

    const tx = c?.present ? c.nx : 0;
    const ty = c?.present ? c.ny : 0;
    group.current.rotation.x += (ty * 0.28 - group.current.rotation.x) * 0.06;
    group.current.rotation.y += (tx * 0.36 - group.current.rotation.y) * 0.06;

    const boost = Math.min(0.6, Math.abs(user) * 0.24 + (c?.dragging ? 0.3 : 0));
    if (linesMat.current) linesMat.current.opacity = pal.lines + boost * pal.boostLines;
    if (circlesMat.current) circlesMat.current.opacity = pal.circles + boost * pal.boostCircles;
  });

  return (
    <group ref={group} position={[0, 0, -1]}>
      <lineSegments geometry={lines}>
        <lineBasicMaterial ref={linesMat} color={pal.glow} transparent opacity={pal.lines} blending={pal.blend} depthWrite={false} />
      </lineSegments>
      <lineSegments geometry={circles}>
        <lineBasicMaterial ref={circlesMat} color={pal.cyan} transparent opacity={pal.circles} blending={pal.blend} depthWrite={false} />
      </lineSegments>
    </group>
  );
}

/* ---------- Flor de la Vida (fondo, contrarrotación) ---------- */
function FlowerOfLife({ pal }: { pal: Pal }) {
  const ref = useRef<THREE.LineSegments>(null!);
  const geo = useMemo(() => {
    const r = 1;
    const ax: [number, number] = [r, 0];
    const bx: [number, number] = [r * 0.5, (r * Math.sqrt(3)) / 2];
    const centers: [number, number][] = [];
    for (let i = -2; i <= 2; i++)
      for (let j = -2; j <= 2; j++) {
        const dist = (Math.abs(i) + Math.abs(j) + Math.abs(i + j)) / 2;
        if (dist <= 2) centers.push([i * ax[0] + j * bx[0], i * ax[1] + j * bx[1]]);
      }
    return buildCircles(centers, r, 56);
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    ref.current.rotation.z = -t * 0.025;
    ref.current.scale.setScalar(3.4 * (1 + Math.sin(t * 0.35 + 1) * 0.02));
  });

  return (
    <lineSegments ref={ref} geometry={geo} position={[0, 0, -6]}>
      <lineBasicMaterial color={pal.cyan} transparent opacity={pal.flowerBg} blending={pal.blend} depthWrite={false} />
    </lineSegments>
  );
}

/* ---------- Partículas de luz (plancton / marine snow) ---------- */
function LightMotes({ pal }: { pal: Pal }) {
  const pts = useRef<THREE.Points>(null!);
  const COUNT = 1100;
  const positions = useMemo(() => {
    const a = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      a[i * 3] = (Math.random() - 0.5) * 42;
      a[i * 3 + 1] = (Math.random() - 0.5) * 26;
      a[i * 3 + 2] = (Math.random() - 0.5) * 28 - 3;
    }
    return a;
  }, []);

  useFrame((_, delta) => {
    const arr = pts.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3 + 1] += delta * 0.2;
      if (arr[i * 3 + 1] > 13) arr[i * 3 + 1] = -13;
    }
    pts.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pts}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color={pal.mote} transparent opacity={pal.moteOp} sizeAttenuation depthWrite={false} blending={pal.blend} />
    </points>
  );
}

/* ---------- Parallax de cámara (alimentado por el puntero global) ---------- */
function Rig({ control }: { control?: PointerControl }) {
  useFrame((state) => {
    const tx = control?.present ? control.nx : 0;
    const ty = control?.present ? control.ny : 0;
    state.camera.position.x += (tx * 1.8 - state.camera.position.x) * 0.03;
    state.camera.position.y += (ty * 1.1 - state.camera.position.y) * 0.03;
    state.camera.lookAt(0, 0, -2);
  });
  return null;
}

export function SacredScene({
  control,
  theme = "dark",
}: {
  control?: PointerControl;
  theme?: Theme;
}) {
  const pal = palette(theme);
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 14], fov: 55 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <fog attach="fog" args={[pal.fog, 13, 40]} />
      <ambientLight intensity={0.7} color={pal.ambient} />

      <FlowerOfLife pal={pal} />
      <Metatron control={control} pal={pal} />
      <LightMotes pal={pal} />
      <Rig control={control} />
    </Canvas>
  );
}
