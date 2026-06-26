"use client";

import { useEffect, type CSSProperties, type ReactElement } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

/* ============================================================
   OceanDepthBackdrop — fondo de profundidad oceánica "3D" para OCEOM.

   Logra la sensación 3D por composición:
   • Luz volumétrica (god rays) que baja desde la superficie.
   • 3 capas de profundidad con animales marinos a distinta escala,
     velocidad, opacidad y desenfoque (depth of field).
   • Parallax con el mouse: las capas cercanas se mueven más que las lejanas.
   • Marine snow, burbujas y niebla de profundidad.

   Todo decorativo (pointer-events:none) y optimizado (CSS transforms + 1 listener).
   ============================================================ */

/* ---------- Siluetas de criaturas (SVG, fill currentColor) ---------- */

function Whale({ style }: { style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 200 90" style={style} fill="currentColor">
      <path d="M8,52 C28,20 92,12 132,26 C146,31 158,28 172,16 C166,34 170,42 160,50 C172,56 180,62 192,74 C174,68 160,68 148,72 C112,86 44,84 20,66 C12,60 8,56 8,52 Z" />
      <path d="M150,52 C158,50 168,52 176,58 C166,60 158,60 150,58 Z" opacity="0.85" />
    </svg>
  );
}

function MantaRay({ style }: { style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 160 100" style={style} fill="currentColor">
      <path d="M80,14 C54,14 26,34 6,50 C26,50 40,60 50,72 C60,58 70,55 80,55 C90,55 100,58 110,72 C120,60 134,50 154,50 C134,34 106,14 80,14 Z" />
      <path d="M80,55 C82,70 82,84 80,98 C78,84 78,70 80,55 Z" />
      <path d="M62,20 C56,16 50,16 46,20 C52,20 58,21 64,24 Z" opacity="0.8" />
      <path d="M98,20 C104,16 110,16 114,20 C108,20 102,21 96,24 Z" opacity="0.8" />
    </svg>
  );
}

function Turtle({ style }: { style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 120 96" style={style} fill="currentColor">
      {/* Caparazón */}
      <ellipse cx="60" cy="50" rx="34" ry="27" />
      {/* Cabeza */}
      <ellipse cx="60" cy="16" rx="10" ry="11" />
      {/* Aletas delanteras */}
      <path d="M30,34 C14,22 4,26 8,40 C14,50 26,46 34,42 Z" />
      <path d="M90,34 C106,22 116,26 112,40 C106,50 94,46 86,42 Z" />
      {/* Aletas traseras */}
      <ellipse cx="38" cy="78" rx="11" ry="8" transform="rotate(28 38 78)" />
      <ellipse cx="82" cy="78" rx="11" ry="8" transform="rotate(-28 82 78)" />
    </svg>
  );
}

function Fish({ style }: { style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 70 34" style={style} fill="currentColor">
      <path d="M4,17 C16,4 44,4 58,17 C44,30 16,30 4,17 Z" />
      <path d="M58,17 L70,8 L66,17 L70,26 Z" />
      <path d="M28,8 C32,3 40,3 44,7 C38,8 32,9 28,12 Z" opacity="0.7" />
    </svg>
  );
}

function Jellyfish({ style }: { style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 64 100" style={style} fill="currentColor">
      <path d="M6,30 C6,10 58,10 58,30 C58,37 53,42 46,42 L18,42 C11,42 6,37 6,30 Z" />
      <g stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.7">
        <path d="M16,42 C12,58 20,70 15,90" />
        <path d="M26,44 C24,62 30,74 26,94" />
        <path d="M38,44 C40,62 34,74 39,94" />
        <path d="M48,42 C52,58 44,70 50,90" />
      </g>
    </svg>
  );
}

/* ---------- Configuración de criaturas por capa ---------- */
type Dir = "ltr" | "rtl";
interface Creature {
  Comp: (p: { style?: CSSProperties }) => ReactElement;
  top: string;
  width: number;
  dir: Dir;
  duration: number; // seg en cruzar
  delay: number;
  bob: number; // seg del cabeceo
}

const FAR: Creature[] = [
  { Comp: Whale, top: "16%", width: 360, dir: "rtl", duration: 150, delay: -20, bob: 11 },
  { Comp: MantaRay, top: "58%", width: 220, dir: "ltr", duration: 120, delay: -70, bob: 9 },
];

const MID: Creature[] = [
  { Comp: Turtle, top: "34%", width: 110, dir: "ltr", duration: 95, delay: -10, bob: 7 },
  { Comp: Fish, top: "70%", width: 78, dir: "rtl", duration: 80, delay: -40, bob: 6 },
  { Comp: Fish, top: "73%", width: 60, dir: "rtl", duration: 80, delay: -34, bob: 6.5 },
  { Comp: Fish, top: "67%", width: 66, dir: "rtl", duration: 80, delay: -46, bob: 5.5 },
];

const NEAR: Creature[] = [
  { Comp: Fish, top: "44%", width: 120, dir: "ltr", duration: 64, delay: -12, bob: 5 },
  { Comp: Fish, top: "26%", width: 92, dir: "rtl", duration: 70, delay: -52, bob: 6 },
];

// Medusas suben en vez de cruzar (deterministas).
const JELLIES = [
  { left: "18%", width: 50, duration: 34, delay: -6, sway: 7 },
  { left: "74%", width: 38, duration: 42, delay: -22, sway: 9 },
  { left: "48%", width: 30, duration: 38, delay: -14, sway: 8 },
];

// Burbujas (deterministas)
const BUBBLES = Array.from({ length: 14 }).map((_, i) => ({
  left: (i * 41 + 7) % 100,
  size: 2 + (i % 3),
  duration: 12 + (i % 6) * 3,
  delay: -(i % 9) * 2,
}));

function CreatureRow({ c, color }: { c: Creature; color: string }) {
  return (
    <div
      className="absolute"
      style={{
        top: c.top,
        animation: `swim-${c.dir} ${c.duration}s linear ${c.delay}s infinite`,
      }}
    >
      <div style={{ animation: `bob ${c.bob}s ease-in-out infinite` }}>
        <c.Comp
          style={{
            width: c.width,
            color,
            // Mira hacia donde nada
            transform: c.dir === "ltr" ? "scaleX(-1)" : "none",
          }}
        />
      </div>
    </div>
  );
}

export function OceanDepthBackdrop() {
  // Parallax suavizado
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 38, damping: 22 });
  const sy = useSpring(py, { stiffness: 38, damping: 22 });

  const farX = useTransform(sx, (v) => v * 10);
  const farY = useTransform(sy, (v) => v * 10);
  const midX = useTransform(sx, (v) => v * 22);
  const midY = useTransform(sy, (v) => v * 22);
  const nearX = useTransform(sx, (v) => v * 40);
  const nearY = useTransform(sy, (v) => v * 40);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      px.set(e.clientX / window.innerWidth - 0.5);
      py.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [px, py]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Degradado de profundidad: luz arriba, abismo abajo */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #0a2742 0%, #071a31 28%, #04101f 60%, #03060e 100%)",
        }}
      />

      {/* Resplandor de superficie */}
      <div
        className="absolute inset-x-0 top-0 h-1/3"
        style={{
          background:
            "radial-gradient(80% 100% at 50% 0%, rgba(94,234,212,0.18) 0%, transparent 70%)",
        }}
      />

      {/* Rayos de luz volumétrica */}
      <div className="absolute inset-0">
        {[12, 30, 52, 70, 86].map((left, i) => (
          <div
            key={left}
            className="absolute top-[-10%] h-[140%] w-24 blur-2xl"
            style={{
              left: `${left}%`,
              background:
                "linear-gradient(180deg, rgba(120,220,235,0.5) 0%, transparent 70%)",
              animation: `ray-shift ${16 + i * 3}s ease-in-out ${-i * 2}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Capa LEJANA (parallax leve, muy difusa) */}
      <motion.div className="absolute inset-0" style={{ x: farX, y: farY, filter: "blur(5px)" }}>
        {FAR.map((c, i) => (
          <CreatureRow key={i} c={c} color="rgba(28,90,120,0.45)" />
        ))}
      </motion.div>

      {/* Capa MEDIA */}
      <motion.div className="absolute inset-0" style={{ x: midX, y: midY, filter: "blur(1.5px)" }}>
        {MID.map((c, i) => (
          <CreatureRow key={i} c={c} color="rgba(40,120,150,0.6)" />
        ))}
      </motion.div>

      {/* Capa CERCANA (más nítida, parallax fuerte) */}
      <motion.div className="absolute inset-0" style={{ x: nearX, y: nearY }}>
        {NEAR.map((c, i) => (
          <CreatureRow key={i} c={c} color="rgba(60,150,180,0.72)" />
        ))}
        {/* Medusas ascendentes */}
        {JELLIES.map((j, i) => (
          <div
            key={i}
            className="absolute bottom-0"
            style={{ left: j.left, animation: `drift-up ${j.duration}s linear ${j.delay}s infinite` }}
          >
            <div style={{ animation: `sway ${j.sway}s ease-in-out infinite` }}>
              <Jellyfish style={{ width: j.width, color: "rgba(130,200,225,0.5)" }} />
            </div>
          </div>
        ))}
      </motion.div>

      {/* Marine snow + burbujas */}
      <div className="absolute inset-0">
        {BUBBLES.map((b, i) => (
          <span
            key={i}
            className="absolute bottom-0 rounded-full"
            style={{
              left: `${b.left}%`,
              width: b.size,
              height: b.size,
              background: "rgba(180,230,240,0.5)",
              boxShadow: "0 0 6px rgba(150,220,235,0.6)",
              animation: `bubble-up ${b.duration}s linear ${b.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Niebla de profundidad + viñeta para legibilidad */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 10%, transparent 45%, rgba(3,6,14,0.55) 100%)," +
            "linear-gradient(180deg, transparent 55%, rgba(3,6,14,0.6) 100%)",
        }}
      />
    </div>
  );
}
