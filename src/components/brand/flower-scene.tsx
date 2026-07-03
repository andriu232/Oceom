"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { PointerControl } from "./pointer-interaction";

/* ============================================================
   FlowerScene — la Flor de la Vida como centro del área de
   estudiante. Mandala único, centrado, que respira y gira muy
   lento sobre un océano de partículas de luz. Solo monta en
   cliente (evita SSR de WebGL). Adaptable a tema claro/oscuro.
   ============================================================ */

type Theme = "light" | "dark";

/** Paleta por tema. En claro: líneas teal profundas con blending NORMAL (el
 *  aditivo es invisible sobre fondo claro). En oscuro: cyan aditivo luminoso. */
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
    moteOp: light ? 0.3 : 0.7,
    outer: light ? 0.5 : 0.22,
    inner: light ? 0.72 : 0.32,
    ring: light ? 0.42 : 0.18,
    boost: light ? 0.4 : 0.7,
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

function flowerCenters(rings: number, r = 1): [number, number][] {
  const ax: [number, number] = [r, 0];
  const bx: [number, number] = [r * 0.5, (r * Math.sqrt(3)) / 2];
  const centers: [number, number][] = [];
  for (let i = -rings; i <= rings; i++)
    for (let j = -rings; j <= rings; j++) {
      const dist = (Math.abs(i) + Math.abs(j) + Math.abs(i + j)) / 2;
      if (dist <= rings) centers.push([i * ax[0] + j * bx[0], i * ax[1] + j * bx[1]]);
    }
  return centers;
}

/* ---------- Flor de la Vida (mandala central, interactivo) ---------- */
function FlowerOfLife({ control, pal }: { control?: PointerControl; pal: Pal }) {
  const group = useRef<THREE.Group>(null!);
  const inner = useRef<THREE.LineSegments>(null!);
  const outerMat = useRef<THREE.LineBasicMaterial>(null!);
  const innerMat = useRef<THREE.LineBasicMaterial>(null!);
  const ringMat = useRef<THREE.LineBasicMaterial>(null!);
  const spinZ = useRef(0);

  const geoOuter = useMemo(() => buildCircles(flowerCenters(2), 1, 64), []);
  const geoInner = useMemo(() => buildCircles(flowerCenters(1), 1, 64), []);
  const geoRing = useMemo(() => buildCircles([[0, 0]], 3.05, 128), []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.05);
    const c = control;

    const user = c?.spin ?? 0;
    spinZ.current += (0.05 + user) * dt;
    group.current.rotation.z = spinZ.current;
    if (c) c.spin += -c.spin * Math.min(1, dt * 1.4);

    group.current.scale.setScalar(3.1 * (1 + Math.sin(t * 0.3) * 0.022));

    const tx = c?.present ? c.nx : 0;
    const ty = c?.present ? c.ny : 0;
    group.current.rotation.x += (ty * 0.32 - group.current.rotation.x) * 0.06;
    group.current.rotation.y += (tx * 0.42 - group.current.rotation.y) * 0.06;

    inner.current.rotation.z = -t * 0.05;

    const boost = Math.min(0.7, Math.abs(user) * 0.28 + (c?.dragging ? 0.35 : 0));
    if (outerMat.current) outerMat.current.opacity = pal.outer + boost * pal.boost;
    if (innerMat.current) innerMat.current.opacity = pal.inner + boost * pal.boost;
    if (ringMat.current) ringMat.current.opacity = pal.ring + boost * pal.boost;
  });

  return (
    <group ref={group} position={[0, 0, -2]}>
      <lineSegments geometry={geoOuter}>
        <lineBasicMaterial ref={outerMat} color={pal.cyan} transparent opacity={pal.outer} blending={pal.blend} depthWrite={false} />
      </lineSegments>
      <lineSegments ref={inner} geometry={geoInner}>
        <lineBasicMaterial ref={innerMat} color={pal.glow} transparent opacity={pal.inner} blending={pal.blend} depthWrite={false} />
      </lineSegments>
      <lineSegments geometry={geoRing}>
        <lineBasicMaterial ref={ringMat} color={pal.glow} transparent opacity={pal.ring} blending={pal.blend} depthWrite={false} />
      </lineSegments>
    </group>
  );
}

/* ---------- Partículas de luz (plancton / marine snow) ---------- */
function LightMotes({ pal }: { pal: Pal }) {
  const pts = useRef<THREE.Points>(null!);
  const COUNT = 1000;
  const positions = useMemo(() => {
    const a = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      a[i * 3] = (Math.random() - 0.5) * 42;
      a[i * 3 + 1] = (Math.random() - 0.5) * 26;
      a[i * 3 + 2] = (Math.random() - 0.5) * 26 - 3;
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
    state.camera.position.x += (tx * 1.4 - state.camera.position.x) * 0.03;
    state.camera.position.y += (ty * 1.0 - state.camera.position.y) * 0.03;
    state.camera.lookAt(0, 0, -2);
  });
  return null;
}

export function FlowerScene({
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
      camera={{ position: [0, 0, 13], fov: 55 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <fog attach="fog" args={[pal.fog, 13, 40]} />
      <ambientLight intensity={0.7} color={pal.ambient} />
      <FlowerOfLife control={control} pal={pal} />
      <LightMotes pal={pal} />
      <Rig control={control} />
    </Canvas>
  );
}
