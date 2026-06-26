"use client";

import { useEffect } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

/**
 * ImmersiveBackdrop — atmósfera oceánica/cósmica premium de OCEOM.
 *
 * Capas (de fondo a frente):
 *  1. Aurora oceánica en deriva lenta
 *  2. Gran esfera de energía con pulso suave
 *  3. Orbes a la deriva con parallax sutil al mover el mouse
 *  4. Corrientes fluidas (SVG) que ondulan lentamente
 *  5. Campo de partículas luminosas ascendentes
 *  6. Niebla/viñeta para profundidad y legibilidad
 *
 * Todo es decorativo (pointer-events: none) y está optimizado:
 * animaciones por CSS + un único listener de mouse con spring.
 */

// Posiciones deterministas (evita mismatch de hidratación; sin Math.random).
const PARTICLES = Array.from({ length: 20 }).map((_, i) => ({
  left: (i * 53) % 100,
  top: 30 + ((i * 37) % 65),
  size: 1 + (i % 3),
  delay: (i % 7) * 1.1,
  duration: 16 + (i % 6) * 3,
  opacity: 0.3 + (i % 4) * 0.12,
}));

export function ImmersiveBackdrop() {
  // Parallax: posición normalizada del mouse (-0.5 a 0.5) suavizada con spring.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 40, damping: 20 });
  const sy = useSpring(py, { stiffness: 40, damping: 20 });

  const orbAx = useTransform(sx, (v) => v * 34);
  const orbAy = useTransform(sy, (v) => v * 34);
  const orbBx = useTransform(sx, (v) => v * -22);
  const orbBy = useTransform(sy, (v) => v * -22);
  const coreX = useTransform(sx, (v) => v * 14);
  const coreY = useTransform(sy, (v) => v * 14);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      px.set(e.clientX / window.innerWidth - 0.5);
      py.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [px, py]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* 1. Aurora oceánica en deriva */}
      <div
        className="absolute -inset-[20%] opacity-70 [animation:aurora_26s_ease-in-out_infinite]"
        style={{
          background:
            "radial-gradient(45% 55% at 30% 25%, #0b3a63 0%, transparent 60%)," +
            "radial-gradient(40% 50% at 75% 20%, #123a86 0%, transparent 55%)," +
            "radial-gradient(50% 60% at 60% 90%, #0c4f4a 0%, transparent 60%)",
        }}
      />

      {/* 2. Gran esfera de energía (núcleo) */}
      <motion.div
        style={{ x: coreX, y: coreY }}
        className="absolute left-1/2 top-[8%] -translate-x-1/2"
      >
        <motion.div
          className="size-[46rem] rounded-full blur-[130px]"
          style={{
            background:
              "radial-gradient(circle at 40% 35%, rgba(94,234,212,0.45) 0%, rgba(34,211,238,0.28) 35%, transparent 70%)",
          }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.55, 0.85, 0.55] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* 3. Orbes a la deriva con parallax */}
      <motion.div
        style={{ x: orbAx, y: orbAy }}
        className="absolute -left-32 top-[18%]"
      >
        <div
          className="size-[34rem] rounded-full opacity-40 blur-[120px] [animation:var(--animate-drift)]"
          style={{
            background: "radial-gradient(circle, #0e4f6b 0%, transparent 70%)",
          }}
        />
      </motion.div>
      <motion.div
        style={{ x: orbBx, y: orbBy }}
        className="absolute right-[-12%] bottom-[6%]"
      >
        <div
          className="size-[32rem] rounded-full opacity-35 blur-[120px] [animation:var(--animate-drift)]"
          style={{
            background: "radial-gradient(circle, #1e3a8a 0%, transparent 70%)",
            animationDelay: "-9s",
          }}
        />
      </motion.div>

      {/* 4. Corrientes fluidas */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.18]"
        preserveAspectRatio="none"
        viewBox="0 0 1440 900"
      >
        <defs>
          <linearGradient id="current" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="#5eead4" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <motion.path
          d="M-100 280 C 300 180, 600 380, 900 260 S 1500 200, 1600 320"
          fill="none"
          stroke="url(#current)"
          strokeWidth="1.5"
          animate={{ d: [
            "M-100 280 C 300 180, 600 380, 900 260 S 1500 200, 1600 320",
            "M-100 300 C 320 260, 620 300, 900 320 S 1500 280, 1600 260",
            "M-100 280 C 300 180, 600 380, 900 260 S 1500 200, 1600 320",
          ] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d="M-100 620 C 360 560, 560 720, 920 600 S 1480 560, 1600 660"
          fill="none"
          stroke="url(#current)"
          strokeWidth="1"
          opacity="0.7"
          animate={{ d: [
            "M-100 620 C 360 560, 560 720, 920 600 S 1480 560, 1600 660",
            "M-100 600 C 340 660, 600 600, 920 660 S 1480 620, 1600 600",
            "M-100 620 C 360 560, 560 720, 920 600 S 1480 560, 1600 660",
          ] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>

      {/* 5. Partículas luminosas ascendentes */}
      <div className="absolute inset-0">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-ocean-glow"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              boxShadow: "0 0 6px rgba(94,234,212,0.8)",
              animation: `rise ${p.duration}s linear ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* 6. Niebla / viñeta para profundidad y legibilidad */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, transparent 50%, rgba(3,6,14,0.55) 100%)," +
            "linear-gradient(180deg, transparent 60%, rgba(3,6,14,0.5) 100%)",
        }}
      />
    </div>
  );
}
