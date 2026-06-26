/** Atmósfera de fondo OCEOM: esferas de luz a la deriva + profundidad océano.
 *  Server component puro (CSS animations, sin JS). */
export function OceanBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -left-32 top-[-10%] h-[42rem] w-[42rem] rounded-full opacity-40 blur-[120px] [animation:var(--animate-drift)]"
        style={{ background: "radial-gradient(circle, #0e4f6b 0%, transparent 70%)" }}
      />
      <div
        className="absolute right-[-15%] top-[20%] h-[34rem] w-[34rem] rounded-full opacity-35 blur-[120px] [animation:var(--animate-drift)]"
        style={{ background: "radial-gradient(circle, #1e3a8a 0%, transparent 70%)", animationDelay: "-7s" }}
      />
      <div
        className="absolute bottom-[-15%] left-[30%] h-[38rem] w-[38rem] rounded-full opacity-30 blur-[130px] [animation:var(--animate-drift)]"
        style={{ background: "radial-gradient(circle, #134e4a 0%, transparent 70%)", animationDelay: "-14s" }}
      />
      {/* Velo de estrellas/partículas */}
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 20% 30%, rgba(230,246,255,0.6) 0, transparent 100%), radial-gradient(1px 1px at 70% 60%, rgba(94,234,212,0.5) 0, transparent 100%), radial-gradient(1px 1px at 45% 80%, rgba(230,246,255,0.4) 0, transparent 100%)",
        }}
      />
    </div>
  );
}
