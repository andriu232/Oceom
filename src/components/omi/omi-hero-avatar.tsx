import Image from "next/image";
import { cn } from "@/lib/utils";

/** Retrato holográfico de OMI (inspirado en Valeria) para el header de OMI.
 *  Foto real + tratamiento CSS: aura que respira, anillo holográfico en
 *  rotación lenta, grado de color cian y fundido inferior para que "emerja" de
 *  la card. Solo CSS (animaciones GPU: opacity/transform), sin assets pesados.
 *  El arte se puede reemplazar en /public/omi/valeria-ai-avatar.jpg. */
export function OmiHeroAvatar({ className }: { className?: string }) {
  return (
    <div className={cn("relative aspect-[4/5]", className)}>
      {/* Aura que respira (detrás) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-5 rounded-full opacity-70 blur-2xl [animation:pulse-glow_6s_ease-in-out_infinite] motion-reduce:animate-none"
        style={{
          background:
            "radial-gradient(circle at 50% 42%, rgba(34,211,238,0.5), rgba(94,234,212,0.24) 46%, transparent 72%)",
        }}
      />
      {/* Anillo holográfico en rotación lenta (gradiente cónico enmascarado) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-1.5 rounded-[2.1rem] [animation:spin-slow_38s_linear_infinite] motion-reduce:animate-none"
        style={{
          padding: "1.5px",
          background:
            "conic-gradient(from 0deg, transparent, rgba(34,211,238,0.65), rgba(129,140,248,0.5) 40%, rgba(94,234,212,0.6) 65%, transparent)",
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      {/* Marco del retrato */}
      <div className="absolute inset-0 overflow-hidden rounded-[1.9rem] shadow-[0_0_55px_-16px_rgba(34,211,238,0.55)] ring-1 ring-inset ring-ocean-cyan/30">
        <Image
          src="/omi/valeria-ai-avatar.jpg"
          alt="OMI, la guía consciente de OCEOM, con la presencia de Valeria"
          fill
          sizes="(max-width: 640px) 45vw, 240px"
          className="object-cover object-[50%_16%]"
          priority
        />
        {/* Grado cian en altas luces (sheen holográfico) */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-60 mix-blend-screen"
          style={{
            background:
              "radial-gradient(90% 70% at 50% 26%, rgba(34,211,238,0.35), transparent 60%)",
          }}
        />
        {/* Sombras hacia teal + fundido con la card (emerge del oscuro) */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 85% at 50% 22%, transparent 42%, rgba(6,20,38,0.6) 100%)," +
              "linear-gradient(to top, rgba(4,10,22,0.92) 1%, rgba(4,10,22,0.35) 24%, transparent 46%)," +
              "linear-gradient(to bottom, rgba(6,18,34,0.5) 0%, transparent 26%)",
          }}
        />
        {/* Scanlines holográficas muy sutiles */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07] mix-blend-screen"
          style={{
            background:
              "repeating-linear-gradient(0deg, rgba(160,245,255,0.6) 0 1px, transparent 1px 4px)",
          }}
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
    </div>
  );
}
