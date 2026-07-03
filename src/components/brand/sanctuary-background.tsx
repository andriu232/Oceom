"use client";

import { useEffect, useState } from "react";
import { FlowerScene } from "./flower-scene";
import { SacredScene } from "./sacred-scene";
import { CursorAura, usePointerControl } from "./pointer-interaction";
import { LightBackdrop } from "./light-backdrop";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

/* ============================================================
   OceomSanctuaryBackground — atmósfera global del santuario.
   Capas: base oceánica → geometría sagrada (WebGL) → caústicas
   de agua → orbes de luz en esquinas → grano fino → viñeta.
   La escena 3D solo monta en cliente. Pensado para integrarse
   (no competir) con el contenido.
   ============================================================ */

export function OceomSanctuaryBackground({
  scene = "flower",
  offsetSidebar = true,
}: {
  scene?: "flower" | "sacred";
  offsetSidebar?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const control = usePointerControl();
  const { theme } = useTheme();

  // No pintamos en SSR/primer frame: el lienzo (body --app-canvas) ya da el
  // fondo correcto por tema → sin flash oscuro al cargar en modo claro.
  if (!mounted) return null;
  if (theme === "light") {
    return <LightBackdrop offsetSidebar={offsetSidebar} />;
  }

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Base: superficie luminosa arriba → abismo abajo */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -8%, #0c2b48 0%, transparent 52%)," +
            "linear-gradient(180deg, #08203a 0%, #05162a 34%, #030d1a 66%, #02040b 100%)",
        }}
      />

      {/* Capa de escena + atmósfera, centrada en el contenido */}
      <div className={cn("absolute inset-0", offsetSidebar && "lg:left-[19rem]")}>
        {/* Resplandor central detrás del mandala */}
        <div
          className="absolute left-1/2 top-1/2 size-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px] [animation:pulse-glow_8s_ease-in-out_infinite]"
          style={{
            background:
              "radial-gradient(circle, rgba(34,211,238,0.16) 0%, rgba(129,140,248,0.09) 45%, transparent 72%)",
          }}
        />

        {/* Geometría sagrada (WebGL) */}
        {mounted && (scene === "sacred" ? <SacredScene control={control} /> : <FlowerScene control={control} />)}

        {/* Caústicas de agua: dos veladuras que ondulan lento */}
        <div
          className="absolute inset-0 mix-blend-screen [animation:caustic-drift_22s_ease-in-out_infinite]"
          style={{
            background:
              "radial-gradient(40% 30% at 28% 24%, rgba(94,234,212,0.10), transparent 60%)," +
              "radial-gradient(36% 28% at 74% 62%, rgba(56,189,248,0.10), transparent 60%)",
          }}
        />
      </div>

      {/* Orbes de luz en esquinas */}
      <div
        className="absolute -left-24 -top-24 size-80 rounded-full opacity-40 blur-3xl [animation:float_12s_ease-in-out_infinite]"
        style={{ background: "radial-gradient(circle, rgba(34,211,238,0.4), transparent 70%)" }}
      />
      <div
        className="absolute -bottom-28 right-[-6rem] size-96 rounded-full opacity-30 blur-3xl [animation:float_16s_ease-in-out_infinite_reverse]"
        style={{ background: "radial-gradient(circle, rgba(129,140,248,0.36), transparent 70%)" }}
      />

      {/* Velo de legibilidad */}
      <div className="absolute inset-0 bg-[#03060e]/45" />

      {/* Spotlight que sigue al cursor: re-ilumina la geometría al pasar el mouse */}
      <CursorAura control={control} />

      {/* Rayos desde la superficie */}
      <div className="absolute inset-0 mix-blend-screen">
        {[16, 40, 64, 86].map((left, i) => (
          <div
            key={left}
            className="absolute top-[-10%] h-[150%] w-28 blur-3xl"
            style={{
              left: `${left}%`,
              background: "linear-gradient(180deg, rgba(140,225,240,0.2) 0%, transparent 72%)",
              animation: `ray-shift ${18 + i * 3}s ease-in-out ${-i * 2}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Grano fino global */}
      <div className="grain absolute inset-0 opacity-[0.04] mix-blend-overlay" />

      {/* Niebla de profundidad + viñeta */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(125% 85% at 50% 10%, transparent 40%, rgba(2,4,11,0.7) 100%)," +
            "linear-gradient(180deg, transparent 54%, rgba(2,4,11,0.7) 100%)",
        }}
      />
    </div>
  );
}
