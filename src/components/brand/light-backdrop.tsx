import { cn } from "@/lib/utils";

/**
 * LightBackdrop — capa ADITIVA de "agua viva" para el modo claro. El lienzo
 * base (gradiente oceánico) vive en `body` (--app-canvas), correcto desde el
 * primer frame; aquí solo sumamos luz que respira: resplandor central,
 * caústicas que ondulan, orbes flotantes, niebla finísima y una viñeta suave.
 */
export function LightBackdrop({
  offsetSidebar = false,
}: {
  offsetSidebar?: boolean;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Resplandor central + caústicas (alineado al contenido) */}
      <div className={cn("absolute inset-0", offsetSidebar && "lg:left-[19rem]")}>
        <div
          className="absolute left-1/2 top-1/2 size-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[150px] [animation:pulse-glow_9s_ease-in-out_infinite]"
          style={{
            background:
              "radial-gradient(circle, rgba(45,212,191,0.16) 0%, rgba(56,189,248,0.10) 45%, transparent 72%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-70 mix-blend-multiply [animation:caustic-drift_24s_ease-in-out_infinite]"
          style={{
            background:
              "radial-gradient(38% 30% at 24% 22%, rgba(20,165,160,0.08), transparent 60%)," +
              "radial-gradient(34% 28% at 76% 66%, rgba(56,189,248,0.08), transparent 60%)",
          }}
        />
      </div>

      {/* Orbes de luz flotando */}
      <div
        className="absolute -left-24 -top-24 size-80 rounded-full opacity-60 blur-3xl [animation:float_13s_ease-in-out_infinite]"
        style={{ background: "radial-gradient(circle, rgba(73,214,223,0.20), transparent 70%)" }}
      />
      <div
        className="absolute -bottom-28 right-[-6rem] size-96 rounded-full opacity-50 blur-3xl [animation:float_17s_ease-in-out_infinite_reverse]"
        style={{ background: "radial-gradient(circle, rgba(175,167,255,0.18), transparent 70%)" }}
      />

      {/* Niebla / grano finísimo */}
      <div className="grain absolute inset-0 opacity-[0.025] mix-blend-multiply" />

      {/* Viñeta suave: profundidad del agua */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(135% 95% at 50% 4%, transparent 58%, rgba(168,198,220,0.28) 100%)",
        }}
      />
    </div>
  );
}
