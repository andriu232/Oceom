"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ============================================================
   SacredScene — geometría sagrada flotando en el océano (WebGL r3f).

   • Cubo de Metatrón como mandala central que gira y respira.
   • Flor de la Vida de fondo (contrarrotación, tenue).
   • Sólidos platónicos (los 5 elementos) en wireframe luminoso, flotando.
   • Partículas de luz (plancton/marine snow), niebla de profundidad,
     luz desde la superficie y parallax de cámara.

   Estética: espiritual, acuática, serena, futurista. Solo monta en cliente.
   ============================================================ */

const CYAN = "#22d3ee";
const GLOW = "#5eead4";

/* Construye una BufferGeometry de segmentos para N circunferencias. */
function buildCircles(
  centers: [number, number][],
  radius: number,
  segments = 64,
) {
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

/* ---------- Cubo de Metatrón (mandala central) ---------- */
function Metatron() {
  const group = useRef<THREE.Group>(null!);

  const { circles, lines } = useMemo(() => {
    const r = 1;
    // 13 centros: 1 central + 6 internos (r) + 6 externos (2r), cada 60°.
    const centers: [number, number][] = [[0, 0]];
    for (let k = 0; k < 6; k++) {
      const a = (Math.PI / 3) * k - Math.PI / 6;
      centers.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    for (let k = 0; k < 6; k++) {
      const a = (Math.PI / 3) * k - Math.PI / 6;
      centers.push([Math.cos(a) * 2 * r, Math.sin(a) * 2 * r]);
    }

    // Líneas: todos los centros conectados con todos (forma el cubo).
    const seg: number[] = [];
    for (let i = 0; i < centers.length; i++)
      for (let j = i + 1; j < centers.length; j++)
        seg.push(centers[i][0], centers[i][1], 0, centers[j][0], centers[j][1], 0);
    const lines = new THREE.BufferGeometry();
    lines.setAttribute("position", new THREE.Float32BufferAttribute(seg, 3));

    return { circles: buildCircles(centers, r, 56), lines };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    group.current.rotation.z = t * 0.04;
    group.current.scale.setScalar(2.1 * (1 + Math.sin(t * 0.5) * 0.03));
  });

  return (
    <group ref={group} position={[0, 0, -1]}>
      <lineSegments geometry={lines}>
        <lineBasicMaterial color={GLOW} transparent opacity={0.32} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
      <lineSegments geometry={circles}>
        <lineBasicMaterial color={CYAN} transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
    </group>
  );
}

/* ---------- Flor de la Vida (fondo, contrarrotación) ---------- */
function FlowerOfLife() {
  const ref = useRef<THREE.LineSegments>(null!);

  const geo = useMemo(() => {
    const r = 1;
    const ax: [number, number] = [r, 0];
    const bx: [number, number] = [r * 0.5, (r * Math.sqrt(3)) / 2];
    const centers: [number, number][] = [];
    for (let i = -2; i <= 2; i++)
      for (let j = -2; j <= 2; j++) {
        const dist = (Math.abs(i) + Math.abs(j) + Math.abs(i + j)) / 2;
        if (dist <= 2)
          centers.push([i * ax[0] + j * bx[0], i * ax[1] + j * bx[1]]);
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
      <lineBasicMaterial color={CYAN} transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
    </lineSegments>
  );
}

/* ---------- Partículas de luz (plancton / marine snow) ---------- */
function LightMotes() {
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
      <pointsMaterial size={0.06} color="#bfeef5" transparent opacity={0.7} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

/* ---------- Parallax de cámara ---------- */
function Rig() {
  useFrame((state) => {
    state.camera.position.x += (state.pointer.x * 1.8 - state.camera.position.x) * 0.03;
    state.camera.position.y += (state.pointer.y * 1.1 - state.camera.position.y) * 0.03;
    state.camera.lookAt(0, 0, -2);
  });
  return null;
}

export function SacredScene() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 14], fov: 55 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <fog attach="fog" args={["#06243a", 13, 40]} />
      <ambientLight intensity={0.7} color="#a9e6ff" />

      <FlowerOfLife />
      <Metatron />
      <LightMotes />
      <Rig />
    </Canvas>
  );
}
