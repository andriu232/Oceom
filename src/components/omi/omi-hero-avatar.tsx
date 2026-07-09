"use client";

import Image from "next/image";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "motion/react";
import { cn } from "@/lib/utils";

/** Avatar hero de OMI (Valeria IA). Presencia 3D premium sin dependencias
 *  pesadas: cápsula glass + capas de profundidad con parallax al mouse
 *  (framer-motion), tilt 3D, halo geométrico en rotación, aura que respira y
 *  grado holográfico cian. El arte vive en /public/omi/omi-avatar-main.png y es
 *  reemplazable. En prefers-reduced-motion se apaga el parallax. */
export function OmiHeroAvatar({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0); // -0.5..0.5 (posición del puntero)
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 110, damping: 18, mass: 0.4 });
  const sy = useSpring(my, { stiffness: 110, damping: 18, mass: 0.4 });

  // Tilt 3D de la cápsula + parallax por capa (profundidad).
  const rotateY = useTransform(sx, [-0.5, 0.5], [9, -9]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [-7, 7]);
  const avatarX = useTransform(sx, [-0.5, 0.5], [-14, 14]);
  const avatarY = useTransform(sy, [-0.5, 0.5], [-10, 10]);
  const haloX = useTransform(sx, [-0.5, 0.5], [12, -12]);
  const haloY = useTransform(sy, [-0.5, 0.5], [9, -9]);

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
    <div className={cn("relative [perspective:1100px]", className)}>
      <motion.div
        onMouseMove={onMove}
        onMouseLeave={recenter}
        style={reduce ? undefined : { rotateX, rotateY }}
        className="relative aspect-[4/5] [transform-style:preserve-3d]"
      >
        {/* Halo geométrico (capa trasera, con parallax + rotación lenta) */}
        <Depth x={haloX} y={haloY} z={-42} reduce={reduce}>
          <div className="pointer-events-none absolute -inset-3">
            <div className="absolute inset-0 rounded-full border border-ocean-cyan/15 [animation:spin-slow_48s_linear_infinite] motion-reduce:animate-none" />
            <div className="absolute inset-[9%] rounded-full border border-ocean-violet/12 [animation:spin-slow_34s_linear_infinite_reverse] motion-reduce:animate-none" />
            <div className="absolute inset-[20%] rounded-full border border-oceom-blue/10 [animation:spin-slow_60s_linear_infinite] motion-reduce:animate-none" />
          </div>
        </Depth>

        {/* Aura que respira (detrás del retrato) */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-5 rounded-full opacity-70 blur-2xl [animation:pulse-glow_6s_ease-in-out_infinite] motion-reduce:animate-none"
          style={{
            background:
              "radial-gradient(circle at 50% 42%, rgba(34,211,238,0.5), rgba(94,234,212,0.22) 46%, transparent 72%)",
          }}
        />

        {/* Cápsula glass + retrato (capa frontal, con parallax) */}
        <Depth x={avatarX} y={avatarY} z={32} reduce={reduce} className="absolute inset-0">
          <div className="relative size-full overflow-hidden rounded-[1.9rem] border border-white/10 shadow-[0_24px_60px_-24px_rgba(34,211,238,0.6),inset_0_1px_0_rgba(255,255,255,0.09)] ring-1 ring-inset ring-ocean-cyan/25">
            <Image
              src="/omi/omi-avatar-main.png"
              alt="OMI, la guía consciente de OCEOM, con la presencia de Valeria"
              fill
              sizes="(max-width: 640px) 45vw, 260px"
              className="object-cover object-[50%_16%]"
              priority
            />
            {/* Iluminación volumétrica cian en altas luces */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-55 mix-blend-screen"
              style={{
                background:
                  "radial-gradient(85% 65% at 50% 26%, rgba(34,211,238,0.32), transparent 60%)",
              }}
            />
            {/* Sombras hacia teal + fundido inferior (emerge de la card) */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(118% 82% at 50% 32%, transparent 38%, rgba(5,15,30,0.5) 72%, rgba(4,10,22,0.88) 100%)," +
                  "linear-gradient(to top, rgba(4,10,22,0.92) 1%, rgba(4,10,22,0.35) 26%, transparent 48%)",
              }}
            />
            {/* Scanlines holográficas muy sutiles */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.06] mix-blend-screen"
              style={{
                background:
                  "repeating-linear-gradient(0deg, rgba(160,245,255,0.6) 0 1px, transparent 1px 4px)",
              }}
            />
            {/* Brillo de borde interior (rim light) */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[1.9rem]"
              style={{ boxShadow: "inset 0 0 40px -14px rgba(94,234,212,0.5)" }}
            />
            {/* Destello del corazón (gema de luz) */}
            <div
              aria-hidden
              className="pointer-events-none absolute bottom-[9%] left-1/2 size-8 -translate-x-1/2 rounded-full opacity-70 blur-md [animation:pulse-glow_4500ms_ease-in-out_infinite] motion-reduce:animate-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(94,234,212,0.9), transparent 70%)",
              }}
            />
          </div>
        </Depth>
      </motion.div>
    </div>
  );
}

/** Capa con profundidad (translateZ) + parallax (x/y). Separada para componer
 *  transform 3D sin que chocen las clases de Tailwind con framer-motion. */
function Depth({
  x,
  y,
  z,
  reduce,
  className,
  children,
}: {
  x: MotionValue<number>;
  y: MotionValue<number>;
  z: number;
  reduce: boolean | null;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      aria-hidden={className ? undefined : true}
      style={reduce ? undefined : { x, y, z, transformStyle: "preserve-3d" }}
      className={cn("absolute inset-0", className)}
    >
      {children}
    </motion.div>
  );
}
