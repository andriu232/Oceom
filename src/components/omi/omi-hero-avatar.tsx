"use client";

import Image from "next/image";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "motion/react";
import { cn } from "@/lib/utils";

/** Avatar hero de OMI (Valeria IA) — presencia holográfica 3D viva.
 *  Composición en capas (preserve-3d):
 *    1. Tilt 3D que sigue al mouse (springs).
 *    2. Levitación idle continua: flota en Y y oscila suavemente en rotateY,
 *       como un holograma proyectado (sin necesidad de hover).
 *    3. Cápsula glass con el retrato a translateZ(+24px) y un destello
 *       holográfico que barre el retrato cada ~7s.
 *    4. Glow "de proyección" bajo la cápsula que respira a contratiempo,
 *       vendiendo la sensación de levitación.
 *  Todo con transform/opacity (GPU). prefers-reduced-motion lo apaga.
 *  El arte es reemplazable: /public/omi/omi-avatar-main.png. */
export function OmiHeroAvatar({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0); // -0.5..0.5
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 110, damping: 18, mass: 0.4 });
  const sy = useSpring(my, { stiffness: 110, damping: 18, mass: 0.4 });

  const rotateY = useTransform(sx, [-0.5, 0.5], [11, -11]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [-8, 8]);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }
  const recenter = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <div className={cn("relative [perspective:1000px]", className)}>
      {/* Aura que respira detrás de la cápsula */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-[2.3rem] opacity-60 blur-2xl [animation:pulse-glow_6s_ease-in-out_infinite] motion-reduce:animate-none"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(34,211,238,0.4), rgba(94,234,212,0.16) 50%, transparent 74%)",
        }}
      />

      {/* Glow de proyección bajo el holograma (vende la levitación) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-3 left-1/2 h-5 w-3/4 -translate-x-1/2 rounded-[100%] opacity-70 blur-md [animation:pulse-glow_7s_ease-in-out_infinite] motion-reduce:animate-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(34,211,238,0.45), transparent 70%)",
        }}
      />

      {/* Capa 1: tilt 3D con el mouse */}
      <motion.div
        onMouseMove={onMove}
        onMouseLeave={recenter}
        style={reduce ? undefined : { rotateX, rotateY }}
        className="relative aspect-[4/5] [transform-style:preserve-3d]"
      >
        {/* Capa 2: levitación idle continua (flota + oscila en 3D) */}
        <motion.div
          data-omi-hero
          animate={
            reduce
              ? undefined
              : {
                  y: [0, -7, 0],
                  rotateY: [-3.5, 3.5, -3.5],
                  rotateZ: [-0.5, 0.5, -0.5],
                }
          }
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 [transform-style:preserve-3d]"
        >
          {/* Capa 3: cápsula glass con el retrato en profundidad */}
          <motion.div
            style={reduce ? undefined : { z: 24 }}
            className="relative size-full overflow-hidden rounded-[1.9rem] border border-ocean-cyan/20 shadow-[0_24px_60px_-22px_rgba(34,211,238,0.55),inset_0_1px_0_rgba(255,255,255,0.09)] ring-1 ring-inset ring-white/10 [transform-style:preserve-3d]"
          >
            <Image
              src="/omi/omi-avatar-main.png"
              alt="OMI, la guía consciente de OCEOM, con la presencia de Valeria"
              fill
              sizes="(max-width: 640px) 45vw, 260px"
              className="object-cover object-[50%_12%]"
              priority
            />
            {/* Destello holográfico que barre el retrato */}
            <motion.div
              aria-hidden
              initial={{ x: "-140%" }}
              animate={reduce ? undefined : { x: ["-140%", "240%"] }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                repeatDelay: 4.6,
                ease: "easeInOut",
              }}
              className="pointer-events-none absolute inset-y-0 w-1/3 opacity-40 mix-blend-screen"
              style={{
                background:
                  "linear-gradient(105deg, transparent, rgba(160,245,255,0.55) 50%, transparent)",
                transform: "skewX(-12deg)",
              }}
            />
            {/* Fundido inferior sutil para integrar con la card */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4"
              style={{
                background: "linear-gradient(to top, rgba(4,10,22,0.55), transparent)",
              }}
            />
            {/* Rim light interior */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[1.9rem]"
              style={{ boxShadow: "inset 0 0 34px -16px rgba(94,234,212,0.45)" }}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
