import { cn } from "@/lib/utils";

/**
 * LightBackdrop — atmósfera del modo claro: "océano al sol / espuma marina".
 * Misma gama OCEOM (cyan/teal/violeta) sobre superficies luminosas, sin el
 * WebGL oscuro. Sereno y liviano.
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
      {/* Base luminosa */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -10%, #e4f3fd 0%, transparent 55%)," +
            "linear-gradient(180deg, #f6fbff 0%, #ebf4fb 46%, #e0ecf7 100%)",
        }}
      />

      {/* Resplandor central (alineado al contenido) */}
      <div className={cn("absolute inset-0", offsetSidebar && "lg:left-[19rem]")}>
        <div
          className="absolute left-1/2 top-1/2 size-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px] [animation:pulse-glow_8s_ease-in-out_infinite]"
          style={{
            background:
              "radial-gradient(circle, rgba(45,212,191,0.20) 0%, rgba(56,189,248,0.13) 45%, transparent 72%)",
          }}
        />
        {/* Caústicas suaves */}
        <div
          className="absolute inset-0 opacity-60 mix-blend-multiply [animation:caustic-drift_22s_ease-in-out_infinite]"
          style={{
            background:
              "radial-gradient(40% 30% at 26% 22%, rgba(45,212,191,0.10), transparent 60%)," +
              "radial-gradient(36% 28% at 74% 66%, rgba(56,189,248,0.10), transparent 60%)",
          }}
        />
      </div>

      {/* Orbes de luz en esquinas */}
      <div
        className="absolute -left-24 -top-24 size-80 rounded-full opacity-50 blur-3xl [animation:float_12s_ease-in-out_infinite]"
        style={{ background: "radial-gradient(circle, rgba(34,211,238,0.24), transparent 70%)" }}
      />
      <div
        className="absolute -bottom-28 right-[-6rem] size-96 rounded-full opacity-40 blur-3xl [animation:float_16s_ease-in-out_infinite_reverse]"
        style={{ background: "radial-gradient(circle, rgba(129,140,248,0.2), transparent 70%)" }}
      />

      {/* Grano fino */}
      <div className="grain absolute inset-0 opacity-[0.03] mix-blend-multiply" />

      {/* Viñeta muy suave para dar profundidad */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(130% 90% at 50% 8%, transparent 56%, rgba(176,202,224,0.34) 100%)",
        }}
      />
    </div>
  );
}
