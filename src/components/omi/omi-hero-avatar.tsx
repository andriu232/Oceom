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

/** Avatar hero de OMI (Valeria IA). El arte (render holográfico con su propio
 *  fondo cósmico, halo y glow) vive en /public/omi/omi-avatar-main.png. El
 *  tratamiento CSS es liviano a propósito para NO estropear el render: cápsula
 *  glass + aura sutil que respira + parallax/tilt 3D (framer-motion). Solo
 *  transform/opacity (GPU); en prefers-reduced-motion se apaga el parallax.
 *  Reemplazable: cambia el archivo omi-avatar-main.png. */
export function OmiHeroAvatar({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0); // -0.5..0.5
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 110, damping: 18, mass: 0.4 });
  const sy = useSpring(my, { stiffness: 110, damping: 18, mass: 0.4 });

  const rotateY = useTransform(sx, [-0.5, 0.5], [8, -8]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [-6, 6]);
  const imgX = useTransform(sx, [-0.5, 0.5], [-10, 10]);
  const imgY = useTransform(sy, [-0.5, 0.5], [-8, 8]);

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
      {/* Aura suave que respira detrás de la cápsula (complementa el halo del
          render sin taparlo). */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-[2.3rem] opacity-60 blur-2xl [animation:pulse-glow_6s_ease-in-out_infinite] motion-reduce:animate-none"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(34,211,238,0.4), rgba(94,234,212,0.16) 50%, transparent 74%)",
        }}
      />

      <motion.div
        onMouseMove={onMove}
        onMouseLeave={recenter}
        style={reduce ? undefined : { rotateX, rotateY }}
        className="relative aspect-[4/5] [transform-style:preserve-3d]"
      >
        <motion.div
          style={reduce ? undefined : { x: imgX, y: imgY, z: 20 }}
          className="absolute inset-0 [transform-style:preserve-3d]"
        >
          {/* Cápsula glass premium (borde + ring + sombra externa + brillo
              superior interno). El render se muestra limpio. */}
          <div className="relative size-full overflow-hidden rounded-[1.9rem] border border-ocean-cyan/20 shadow-[0_24px_60px_-22px_rgba(34,211,238,0.55),inset_0_1px_0_rgba(255,255,255,0.09)] ring-1 ring-inset ring-white/10">
            <Image
              src="/omi/omi-avatar-main.png"
              alt="OMI, la guía consciente de OCEOM, con la presencia de Valeria"
              fill
              sizes="(max-width: 640px) 45vw, 260px"
              className="object-cover object-[50%_12%]"
              priority
            />
            {/* Fundido inferior muy sutil para integrar con la card */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4"
              style={{
                background: "linear-gradient(to top, rgba(4,10,22,0.55), transparent)",
              }}
            />
            {/* Rim light interior sutil */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[1.9rem]"
              style={{ boxShadow: "inset 0 0 34px -16px rgba(94,234,212,0.45)" }}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
