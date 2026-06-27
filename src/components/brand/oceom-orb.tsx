import { cn } from "@/lib/utils";

/**
 * OceomOrb — esfera oceánica viva: cuerpo de profundidad marina, brillo
 * glossy superior, anillos orbitando, halo externo y una ola interior.
 * Decorativa, 100% CSS (performante). Escala con `className` (define el size).
 */
export function OceomOrb({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("relative aspect-square", className)}>
      {/* Halo externo que respira */}
      <div
        className="absolute inset-[-22%] rounded-full blur-2xl [animation:pulse-glow_6s_ease-in-out_infinite]"
        style={{
          background:
            "radial-gradient(circle, rgba(34,211,238,0.5) 0%, rgba(129,140,248,0.28) 45%, transparent 72%)",
        }}
      />

      {/* Anillo orbital lento */}
      <div className="absolute inset-[-6%] rounded-full border border-ocean-cyan/25 [animation:spin-slow_26s_linear_infinite]" />
      <div className="absolute inset-[4%] rounded-full border border-ocean-glow/15 [animation:spin-slow_38s_linear_infinite_reverse]" />

      {/* Cuerpo de la esfera */}
      <div
        className="absolute inset-[8%] overflow-hidden rounded-full [animation:orb-breathe_7s_ease-in-out_infinite]"
        style={{
          background:
            "radial-gradient(circle at 34% 28%, #bdf3ff 0%, #38bdf8 26%, #1366b8 56%, #071d35 100%)",
          boxShadow:
            "inset 0 -18px 40px rgba(2,8,20,0.7), inset 0 14px 30px rgba(190,243,255,0.45), 0 0 60px -8px rgba(34,211,238,0.55)",
        }}
      >
        {/* Brillo glossy superior */}
        <div
          className="absolute left-[18%] top-[10%] h-[34%] w-[46%] rounded-full opacity-80 blur-md"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.9), transparent 70%)" }}
        />
        {/* Destello puntual */}
        <div className="absolute left-[26%] top-[18%] size-2 rounded-full bg-white/90 blur-[1px]" />
        {/* Ola interior */}
        <div
          className="absolute inset-x-[-10%] bottom-[18%] h-[42%] rounded-[50%] opacity-90 [animation:float_9s_ease-in-out_infinite]"
          style={{
            background:
              "radial-gradient(60% 120% at 50% 0%, rgba(214,242,255,0.85), rgba(56,189,248,0.25) 55%, transparent 75%)",
          }}
        />
      </div>
    </div>
  );
}
