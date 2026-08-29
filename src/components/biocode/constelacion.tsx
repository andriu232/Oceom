"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Dimension, Mapa } from "@/lib/biocode/dimensiones";
import { elegidasDe } from "@/lib/biocode/dimensiones";

/* ============================================================
   El mapa radial de una zona (§4 del manual de experiencia).

   La zona en el centro y sus dimensiones alrededor. Lo que la persona va
   eligiendo se cuelga de su dimensión, para que se vea cómo se conecta —
   que es la sensación que pide el manual: "estoy descubriendo mi propio mapa".

   Las líneas van en un SVG de fondo y los satélites son botones de HTML
   encima: así el texto se ajusta solo, el teclado funciona y el foco se ve.
   ============================================================ */

interface Props {
  centro: string;
  dimensiones: Dimension[];
  mapa: Mapa;
  activa: string | null;
  onAbrir: (key: string) => void;
}

/** Posición en porcentaje sobre el contenedor cuadrado. */
function polar(angulo: number, radio: number) {
  return {
    left: `${50 + Math.cos(angulo) * radio}%`,
    top: `${50 + Math.sin(angulo) * radio}%`,
  };
}

function recorta(texto: string, max = 17) {
  return texto.length > max ? `${texto.slice(0, max - 1)}…` : texto;
}

export function Constelacion({ centro, dimensiones, mapa, activa, onAbrir }: Props) {
  const puestos = useMemo(() => {
    const n = dimensiones.length || 1;
    // Se arranca arriba (-90°) para que la primera quede en la corona.
    return dimensiones.map((d, i) => {
      const angulo = (i / n) * Math.PI * 2 - Math.PI / 2;
      return { d, angulo, elegidas: elegidasDe(mapa, d.key) };
    });
  }, [dimensiones, mapa]);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px]">
      {/* Líneas: del centro a cada dimensión, y de cada dimensión a lo elegido */}
      <svg
        viewBox="0 0 100 100"
        className="pointer-events-none absolute inset-0 size-full"
        aria-hidden="true"
      >
        {puestos.map(({ d, angulo, elegidas }) => {
          const x = 50 + Math.cos(angulo) * 31;
          const y = 50 + Math.sin(angulo) * 31;
          return (
            <g key={d.key}>
              <line
                x1="50"
                y1="50"
                x2={x}
                y2={y}
                stroke={d.color}
                strokeWidth={elegidas.length ? 0.6 : 0.3}
                strokeOpacity={elegidas.length ? 0.65 : 0.28}
              />
              {elegidas.map((_, j) => {
                const sep = (j - (elegidas.length - 1) / 2) * 0.46;
                const x2 = 50 + Math.cos(angulo + sep) * 45;
                const y2 = 50 + Math.sin(angulo + sep) * 45;
                return (
                  <line
                    key={j}
                    x1={x}
                    y1={y}
                    x2={x2}
                    y2={y2}
                    stroke={d.color}
                    strokeWidth="0.4"
                    strokeOpacity="0.5"
                  />
                );
              })}
            </g>
          );
        })}
      </svg>

      {/* Centro */}
      <div
        className="absolute grid size-[112px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-ocean-violet/40 bg-ocean-violet/12 px-3 text-center backdrop-blur"
        style={{ left: "50%", top: "50%" }}
      >
        <span className="font-display text-sm font-semibold leading-tight text-foreground">
          {centro}
        </span>
      </div>

      {/* Satélites */}
      {puestos.map(({ d, angulo, elegidas }) => (
        <div key={d.key}>
          <button
            onClick={() => onAbrir(d.key)}
            aria-expanded={activa === d.key}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur transition",
              "hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
              activa === d.key ? "text-ocean-abyss" : "text-foreground/90",
            )}
            style={{
              ...polar(angulo, 31),
              borderColor: d.color,
              background: activa === d.key ? d.color : `${d.color}1f`,
            }}
          >
            {d.label}
            {elegidas.length > 0 && (
              <span
                className="ml-1.5 rounded-full px-1.5 text-[0.65rem] font-semibold"
                style={{
                  background: activa === d.key ? "rgba(3,6,14,.25)" : d.color,
                  color: activa === d.key ? "inherit" : "#03060e",
                }}
              >
                {elegidas.length}
              </span>
            )}
          </button>

          {/* Lo que la persona eligió, colgando de su dimensión */}
          {elegidas.map((texto, j) => {
            const sep = (j - (elegidas.length - 1) / 2) * 0.46;
            return (
              <span
                key={texto}
                title={texto}
                className="animate-[aparecer_.35s_ease-out] absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg border px-2 py-[3px] text-[0.62rem] leading-tight backdrop-blur"
                style={{
                  ...polar(angulo + sep, 45),
                  borderColor: `${d.color}66`,
                  background: "rgba(10,17,36,.85)",
                  color: d.color,
                }}
              >
                {recorta(texto)}
              </span>
            );
          })}
        </div>
      ))}

      <style>{`
        @keyframes aparecer {
          from { opacity: 0; transform: translate(-50%, -50%) scale(.82); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[aparecer_\\.35s_ease-out\\] { animation: none; }
        }
      `}</style>
    </div>
  );
}
