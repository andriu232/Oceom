"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ============================================================
   OceanScene — ecosistema marino 3D real (WebGL / react-three-fiber).

   • Cardúmenes de peces con movimiento de banco vivo (cohesión + rumbo).
   • Mantarrayas grandes deslizándose en la profundidad (siluetas en niebla).
   • Marine snow y burbujas ascendentes (sistemas de partículas).
   • Niebla volumétrica para profundidad real + luz desde la superficie.
   • Parallax de cámara con el mouse.

   Solo se monta en cliente (el wrapper la activa tras montar).
   ============================================================ */

const SCHOOLS = 4;
const PER_SCHOOL = 95;
const FISH_COUNT = SCHOOLS * PER_SCHOOL;

const PALETTE = ["#8ff0e6", "#5cc8da", "#49a7d8", "#a6dced", "#74dccb"];

/* ---------- Cardúmenes de peces ---------- */
function FishSchools() {
  const mesh = useRef<THREE.InstancedMesh>(null!);

  // Datos por pez (deterministas; solo cliente -> sin hidratación).
  const fish = useMemo(() => {
    const arr = [];
    for (let s = 0; s < SCHOOLS; s++) {
      for (let i = 0; i < PER_SCHOOL; i++) {
        const a = (i / PER_SCHOOL) * Math.PI * 2;
        const r = 1.1 + (i % 8) * 0.16;
        arr.push({
          school: s,
          off: new THREE.Vector3(
            Math.cos(a) * r * 1.5,
            Math.sin(a * 1.4) * r * 0.65,
            Math.sin(a) * r * 1.5,
          ),
          phase: s * 13 + i * 0.7,
          size: 0.5 + ((i * 7) % 5) * 0.07,
        });
      }
    }
    return arr;
  }, []);

  // Buffers reutilizables (evita GC por frame).
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const tmpOff = useMemo(() => new THREE.Vector3(), []);
  const center = useMemo(() => new THREE.Vector3(), []);
  const heading = useMemo(() => new THREE.Vector3(), []);
  const forward = useMemo(() => new THREE.Vector3(0, 0, 1), []);
  const lastCenters = useMemo(
    () => Array.from({ length: SCHOOLS }, () => new THREE.Vector3()),
    [],
  );

  // Colores por instancia.
  useEffect(() => {
    const c = new THREE.Color();
    fish.forEach((f, idx) => {
      c.set(PALETTE[(f.school + idx) % PALETTE.length]);
      mesh.current.setColorAt(idx, c);
    });
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, [fish]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    for (let s = 0; s < SCHOOLS; s++) {
      const ph = s * 1.7;
      // El banco serpentea por el espacio (trayectoria tipo Lissajous).
      center.set(
        Math.sin(t * 0.06 + ph) * 10,
        Math.sin(t * 0.05 + ph * 1.3) * 3.0 + Math.sin(t * 0.02) * 1.4,
        Math.cos(t * 0.045 + ph) * 5 - 2,
      );
      // Rumbo = dirección del movimiento del banco.
      heading.copy(center).sub(lastCenters[s]);
      if (heading.lengthSq() < 1e-6) heading.set(1, 0, 0);
      heading.normalize();
      lastCenters[s].copy(center);
      q.setFromUnitVectors(forward, heading);

      for (let i = 0; i < PER_SCHOOL; i++) {
        const idx = s * PER_SCHOOL + i;
        const f = fish[idx];
        tmpOff.copy(f.off).applyQuaternion(q);
        dummy.position.copy(center).add(tmpOff);
        dummy.position.y += Math.sin(t * 1.2 + f.phase) * 0.22;
        dummy.quaternion.copy(q);
        const pulse = 1 + Math.sin(t * 8 + f.phase) * 0.09; // aleteo de cola
        dummy.scale.set(0.2 * f.size, 0.38 * f.size, 1.05 * f.size * pulse);
        dummy.updateMatrix();
        mesh.current.setMatrixAt(idx, dummy.matrix);
      }
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined as unknown as THREE.BufferGeometry, undefined as unknown as THREE.Material, FISH_COUNT]}
    >
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        roughness={0.45}
        metalness={0.15}
        emissive="#0a3a44"
        emissiveIntensity={0.4}
      />
    </instancedMesh>
  );
}

/* ---------- Mantarrayas en la profundidad ---------- */
function Gliders() {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const data = useMemo(
    () => [
      { y: 3, z: -9, speed: 0.5, dir: 1, phase: 0, scale: 3.0 },
      { y: -2.5, z: -12, speed: 0.32, dir: -1, phase: 2.4, scale: 4.0 },
      { y: 5, z: -15, speed: 0.22, dir: 1, phase: 5.1, scale: 5.2 },
    ],
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const span = 30;
    data.forEach((d, i) => {
      let x = (t * d.speed + d.phase) % span;
      x = d.dir > 0 ? x - span / 2 : span / 2 - x;
      dummy.position.set(x, d.y + Math.sin(t * 0.3 + d.phase) * 0.6, d.z);
      dummy.rotation.set(0, d.dir > 0 ? 0 : Math.PI, Math.sin(t * 0.7 + d.phase) * 0.14);
      dummy.scale.set(d.scale * 1.9, d.scale * 0.16, d.scale); // ancho y plano
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined as unknown as THREE.BufferGeometry, undefined as unknown as THREE.Material, data.length]}
    >
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#10384a" roughness={0.7} metalness={0} transparent opacity={0.9} />
    </instancedMesh>
  );
}

/* ---------- Partículas: marine snow + burbujas ---------- */
function Particles({
  count,
  area,
  speed,
  size,
  color,
  rise,
}: {
  count: number;
  area: [number, number, number];
  speed: number;
  size: number;
  color: string;
  rise: boolean;
}) {
  const pts = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      a[i * 3] = (Math.random() - 0.5) * area[0];
      a[i * 3 + 1] = (Math.random() - 0.5) * area[1];
      a[i * 3 + 2] = (Math.random() - 0.5) * area[2] - 4;
    }
    return a;
  }, [count, area]);

  useFrame((_, delta) => {
    const arr = pts.current.geometry.attributes.position.array as Float32Array;
    const dir = rise ? 1 : -1;
    const half = area[1] / 2;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += delta * speed * dir;
      if (rise && arr[i * 3 + 1] > half) arr[i * 3 + 1] = -half;
      if (!rise && arr[i * 3 + 1] < -half) arr[i * 3 + 1] = half;
      if (rise) arr[i * 3] += Math.sin(arr[i * 3 + 1] * 0.5 + i) * delta * 0.05;
    }
    pts.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pts}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ---------- Parallax de cámara ---------- */
function Rig() {
  useFrame((state) => {
    state.camera.position.x += (state.pointer.x * 2.2 - state.camera.position.x) * 0.03;
    state.camera.position.y += (state.pointer.y * 1.3 - state.camera.position.y) * 0.03;
    state.camera.lookAt(0, 0, -2);
  });
  return null;
}

export function OceanScene() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 16], fov: 55 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <fog attach="fog" args={["#06283d", 11, 38]} />
      <ambientLight intensity={0.65} color="#a9e6ff" />
      <directionalLight position={[3, 12, 5]} intensity={1.15} color="#cdf5ff" />
      <directionalLight position={[-5, 8, -6]} intensity={0.4} color="#3f7fd0" />

      <FishSchools />
      <Gliders />
      <Particles count={1500} area={[44, 26, 32]} speed={0.25} size={0.05} color="#bfeef5" rise={false} />
      <Particles count={120} area={[34, 24, 20]} speed={0.7} size={0.09} color="#9fe8f5" rise={true} />

      <Rig />
    </Canvas>
  );
}
