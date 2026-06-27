import { cn } from "@/lib/utils";

/** Avatar energético de OMI: orbe luminoso con anillos en rotación y núcleo
 *  pulsante. Construido con CSS (sin assets), listo para reemplazar por arte
 *  final si llega. */
export function OmiAvatar({ className }: { className?: string }) {
  return (
    <div className={cn("relative aspect-square", className)} aria-hidden>
      {/* Halo */}
      <div
        className="absolute inset-0 rounded-full opacity-70 blur-2xl"
        style={{
          background:
            "radial-gradient(circle, rgba(56,189,248,0.5) 0%, rgba(129,140,248,0.3) 45%, transparent 72%)",
        }}
      />
      {/* Anillos */}
      <div className="absolute inset-0 rounded-full border border-ocean-cyan/30 [animation:spin-slow_28s_linear_infinite]" />
      <div className="absolute inset-[12%] rounded-full border border-ocean-violet/30 [animation:spin-slow_20s_linear_infinite_reverse]" />
      <div className="absolute inset-[24%] rounded-full border border-oceom-blue/20 [animation:spin-slow_34s_linear_infinite]" />
      {/* Núcleo */}
      <div
        className="absolute inset-[30%] rounded-full [animation:pulse-glow_5s_ease-in-out_infinite]"
        style={{
          background:
            "radial-gradient(circle at 40% 35%, #d6f2ff 0%, #38bdf8 42%, #6d6df8 82%)",
          boxShadow: "0 0 50px rgba(56,189,248,0.55)",
        }}
      />
    </div>
  );
}
