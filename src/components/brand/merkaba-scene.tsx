"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ============================================================
   MerkabaScene — estrella tetraédrica (Merkaba) inclinada en 3D sobre una
   Flor de la Vida tenue. Geometría sagrada del área de estudiante.
   ============================================================ */

const CYAN = "#22d3ee";
const GLOW = "#5eead4";
const VIOLET = "#818cf8";

function buildCircles(centers: [number, number][], radius: number, segments = 56) {
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

/* ---------- Flor de la Vida (fondo tenue) ---------- */
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
        if (dist <= 2) centers.push([i * ax[0] + j * bx[0], i * ax[1] + j * bx[1]]);
      }
    return buildCircles(centers, r);
  }, []);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    ref.current.rotation.z = -t * 0.02;
    ref.current.scale.setScalar(3.2 * (1 + Math.sin(t * 0.35) * 0.02));
  });
  return (
    <lineSegments ref={ref} geometry={geo} position={[0, 0, -6]}>
      <lineBasicMaterial color={CYAN} transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
    </lineSegments>
  );
}

/* ---------- Merkaba: dos tetraedros contrarrotando, inclinado en 3D ---------- */
function Merkaba() {
  const group = useRef<THREE.Group>(null!);
  const up = useRef<THREE.LineSegments>(null!);
  const down = useRef<THREE.LineSegments>(null!);
  const halo = useRef<THREE.LineSegments>(null!);

  const tetra = useMemo(
    () => new THREE.EdgesGeometry(new THREE.TetrahedronGeometry(2.3)),
    [],
  );
  const ring = useMemo(() => {
    const pts: number[] = [];
    const N = 96;
    const r = 3.5;
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * Math.PI * 2;
      const a1 = ((i + 1) / N) * Math.PI * 2;
      pts.push(Math.cos(a0) * r, Math.sin(a0) * r, 0, Math.cos(a1) * r, Math.sin(a1) * r, 0);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);

  useFrame((state, delta) => {
    up.current.rotation.y += delta * 0.3;
    down.current.rotation.y -= delta * 0.3;
    const t = state.clock.elapsedTime;
    const s = 1 + Math.sin(t * 0.5) * 0.04;
    up.current.scale.setScalar(s);
    down.current.scale.setScalar(s);
    halo.current.rotation.z = t * 0.05;
    // Cabeceo suave del conjunto para mostrar la profundidad 3D
    group.current.rotation.x = 0.45 + Math.sin(t * 0.25) * 0.08;
  });

  return (
    <group ref={group} position={[0, 0, -1]}>
      <lineSegments ref={up} geometry={tetra}>
        <lineBasicMaterial color={CYAN} transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
      <lineSegments ref={down} geometry={tetra} rotation={[Math.PI, 0, Math.PI / 3]}>
        <lineBasicMaterial color={VIOLET} transparent opacity={0.75} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
      <lineSegments ref={halo} geometry={ring}>
        <lineBasicMaterial color={GLOW} transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
    </group>
  );
}

function LightMotes() {
  const pts = useRef<THREE.Points>(null!);
  const COUNT = 1000;
  const positions = useMemo(() => {
    const a = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      a[i * 3] = (Math.random() - 0.5) * 40;
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

function Rig() {
  useFrame((state) => {
    state.camera.position.x += (state.pointer.x * 1.8 - state.camera.position.x) * 0.03;
    state.camera.position.y += (state.pointer.y * 1.2 - state.camera.position.y) * 0.03;
    state.camera.lookAt(0, 0, -2);
  });
  return null;
}

export function MerkabaScene() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 13], fov: 55 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <fog attach="fog" args={["#06243a", 12, 38]} />
      <ambientLight intensity={0.7} color="#a9e6ff" />
      <FlowerOfLife />
      <Merkaba />
      <LightMotes />
      <Rig />
    </Canvas>
  );
}
