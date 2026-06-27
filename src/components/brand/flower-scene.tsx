"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ============================================================
   FlowerScene — la Flor de la Vida como centro del área de
   estudiante. Mandala único, centrado, que respira y gira muy
   lento sobre un océano de partículas de luz. Solo monta en
   cliente (evita SSR de WebGL).
   ============================================================ */

const CYAN = "#22d3ee";
const GLOW = "#5eead4";

/* Segmentos de N circunferencias (para dibujar la flor en wireframe). */
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

/* Centros de la Flor de la Vida hasta un anillo `rings`. */
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

/* ---------- Flor de la Vida (mandala central, centrado) ---------- */
function FlowerOfLife() {
  const group = useRef<THREE.Group>(null!);
  const inner = useRef<THREE.LineSegments>(null!);

  const geoOuter = useMemo(() => buildCircles(flowerCenters(2), 1, 64), []);
  const geoInner = useMemo(() => buildCircles(flowerCenters(1), 1, 64), []);
  // Anillo envolvente que enmarca la flor.
  const geoRing = useMemo(() => buildCircles([[0, 0]], 3.05, 128), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    group.current.rotation.z = t * 0.018;
    group.current.scale.setScalar(3.1 * (1 + Math.sin(t * 0.3) * 0.022));
    inner.current.rotation.z = -t * 0.05;
  });

  return (
    <group ref={group} position={[0, 0, -2]}>
      <lineSegments geometry={geoOuter}>
        <lineBasicMaterial color={CYAN} transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
      <lineSegments ref={inner} geometry={geoInner}>
        <lineBasicMaterial color={GLOW} transparent opacity={0.32} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
      <lineSegments geometry={geoRing}>
        <lineBasicMaterial color={GLOW} transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
    </group>
  );
}

/* ---------- Partículas de luz (plancton / marine snow) ---------- */
function LightMotes() {
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
      <pointsMaterial size={0.06} color="#bfeef5" transparent opacity={0.7} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

/* ---------- Parallax de cámara ---------- */
function Rig() {
  useFrame((state) => {
    state.camera.position.x += (state.pointer.x * 1.4 - state.camera.position.x) * 0.03;
    state.camera.position.y += (state.pointer.y * 1.0 - state.camera.position.y) * 0.03;
    state.camera.lookAt(0, 0, -2);
  });
  return null;
}

export function FlowerScene() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 13], fov: 55 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <fog attach="fog" args={["#06243a", 13, 40]} />
      <ambientLight intensity={0.7} color="#a9e6ff" />
      <FlowerOfLife />
      <LightMotes />
      <Rig />
    </Canvas>
  );
}
