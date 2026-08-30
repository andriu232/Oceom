"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Dimension, Mapa } from "@/lib/biocode/dimensiones";
import { elegidasDe } from "@/lib/biocode/dimensiones";

/* ============================================================
   El mapa radial de una zona (§4 del manual de experiencia).

   La zona en el centro y sus dimensiones alrededor. Lo que la persona va
   eligiendo se cuelga de su dimensión, para que se vea cómo se conecta —
   la sensación que pide el manual: "estoy descubriendo mi propio mapa".

   Sobre el movimiento: es todo SVG y CSS, sin bucle de animación en
   JavaScript. Las conexiones son curvas y no rectas porque un radial de
   rectas se lee como un diagrama de red; la curva, y la luz que corre por
   ella, lo acercan a lo que es: una corriente entre partes de un cuerpo.
   La entrada es escalonada, el centro primero y las dimensiones abriéndose
   hacia afuera. Con `prefers-reduced-motion` todo queda quieto.

   Las líneas van en un SVG de fondo y los nodos son botones de HTML encima:
   así el texto se ajusta solo, el teclado funciona y el foco se ve.
   ============================================================ */

interface Props {
  centro: string;
  dimensiones: Dimension[];
  mapa: Mapa;
  activa: string | null;
  onAbrir: (key: string) => void;
}

const R_NODO = 31; // radio de las dimensiones, en % del lado
const R_ELECCION = 45; // radio de lo elegido

/** Posición en porcentaje sobre el contenedor cuadrado. */
function polar(angulo: number, radio: number) {
  return {
    left: `${50 + Math.cos(angulo) * radio}%`,
    top: `${50 + Math.sin(angulo) * radio}%`,
  };
}

/** Curva suave entre dos radios del mismo ángulo: se separa de la recta con
 *  un punto de control perpendicular, proporcional a la distancia. */
function curva(a: number, r1: number, r2: number, curvatura = 0.16) {
  const x1 = 50 + Math.cos(a) * r1;
  const y1 = 50 + Math.sin(a) * r1;
  const x2 = 50 + Math.cos(a) * r2;
  const y2 = 50 + Math.sin(a) * r2;
  const d = r2 - r1;
  const cx = (x1 + x2) / 2 + Math.cos(a + Math.PI / 2) * d * curvatura;
  const cy = (y1 + y2) / 2 + Math.sin(a + Math.PI / 2) * d * curvatura;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
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
      return { d, angulo, elegidas: elegidasDe(mapa, d.key), i };
    });
  }, [dimensiones, mapa]);

  return (
    <div className="constelacion relative mx-auto aspect-square w-full max-w-[560px]">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden="true">
        <defs>
          {/* Un degradado por dimensión: del violeta del núcleo a su color. */}
          {puestos.map(({ d, angulo }) => (
            <linearGradient
              key={d.key}
              id={`hilo-${d.key}`}
              gradientUnits="userSpaceOnUse"
              x1={50}
              y1={50}
              x2={50 + Math.cos(angulo) * R_NODO}
              y2={50 + Math.sin(angulo) * R_NODO}
            >
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.14" />
              <stop offset="100%" stopColor={d.color} stopOpacity="0.9" />
            </linearGradient>
          ))}
          <radialGradient id="nucleo-halo">
            <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.5" />
            <stop offset="55%" stopColor="#4c5fd7" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#0a1124" stopOpacity="0" />
          </radialGradient>
          <filter id="halo" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="1.1" />
          </filter>
        </defs>

        {/* Anillos de referencia, como una carta estelar. Giran muy despacio. */}
        <g className="orbita">
          <circle
            cx="50"
            cy="50"
            r={R_NODO}
            fill="none"
            stroke="#818cf8"
            strokeOpacity="0.12"
            strokeWidth="0.15"
            strokeDasharray="0.6 2.4"
          />
          <circle
            cx="50"
            cy="50"
            r={R_ELECCION}
            fill="none"
            stroke="#22d3ee"
            strokeOpacity="0.08"
            strokeWidth="0.12"
            strokeDasharray="0.4 3.6"
          />
        </g>

        <circle cx="50" cy="50" r="22" fill="url(#nucleo-halo)" className="respira" />

        {puestos.map(({ d, angulo, elegidas, i }) => {
          const viva = activa === d.key || elegidas.length > 0;
          return (
            <g key={d.key} className="hilo" style={{ animationDelay: `${140 + i * 70}ms` }}>
              {viva && (
                <path
                  d={curva(angulo, 9, R_NODO)}
                  fill="none"
                  stroke={d.color}
                  strokeOpacity="0.22"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  filter="url(#halo)"
                />
              )}
              <path
                d={curva(angulo, 9, R_NODO)}
                fill="none"
                stroke={`url(#hilo-${d.key})`}
                strokeWidth={viva ? 0.5 : 0.28}
                strokeLinecap="round"
                opacity={viva ? 1 : 0.55}
              />
              {/* La luz que corre del centro hacia afuera. */}
              <path
                className="corriente"
                d={curva(angulo, 9, R_NODO)}
                fill="none"
                stroke={d.color}
                strokeWidth="0.55"
                strokeLinecap="round"
                strokeDasharray="1.6 26"
                style={{ animationDelay: `${i * 900}ms`, opacity: viva ? 0.9 : 0.3 }}
              />

              {elegidas.map((_, j) => {
                const sep = (j - (elegidas.length - 1) / 2) * 0.46;
                return (
                  <path
                    key={j}
                    d={curva(angulo + sep * 0.35, R_NODO, R_ELECCION, 0.22)}
                    fill="none"
                    stroke={d.color}
                    strokeOpacity="0.5"
                    strokeWidth="0.3"
                    strokeLinecap="round"
                  />
                );
              })}
            </g>
          );
        })}
      </svg>

      {/* Núcleo */}
      <div
        className="nucleo absolute grid size-[118px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full px-3 text-center"
        style={{ left: "50%", top: "50%" }}
      >
        <span className="font-display text-sm font-semibold leading-tight text-foreground">
          {centro}
        </span>
      </div>

      {/* Dimensiones */}
      {puestos.map(({ d, angulo, elegidas, i }) => (
        <div key={d.key}>
          <button
            onClick={() => onAbrir(d.key)}
            aria-expanded={activa === d.key}
            className={cn(
              "nodo group absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-1.5",
              "text-xs font-medium transition-[box-shadow,background,border-color] duration-300",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
            )}
            style={{
              ...polar(angulo, R_NODO),
              animationDelay: `${180 + i * 70}ms`,
              borderColor: activa === d.key ? d.color : `${d.color}66`,
              background:
                activa === d.key
                  ? `linear-gradient(180deg, ${d.color}2e, rgba(10,17,36,.94))`
                  : "rgba(10,17,36,.9)",
              color: d.color,
              boxShadow:
                activa === d.key || elegidas.length > 0
                  ? `0 0 18px -4px ${d.color}, inset 0 0 12px -8px ${d.color}`
                  : "none",
            }}
          >
            <span
              className="mr-1.5 inline-block size-1.5 rounded-full align-middle transition-transform duration-300 group-hover:scale-150"
              style={{ background: d.color, boxShadow: `0 0 8px ${d.color}` }}
            />
            {d.label}
            {elegidas.length > 0 && (
              <span
                className="ml-1.5 rounded-full px-1.5 text-[0.65rem] font-semibold text-ocean-abyss"
                style={{ background: d.color }}
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
                className="eleccion absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg border px-2 py-[3px] text-[0.62rem] leading-tight"
                style={{
                  ...polar(angulo + sep, R_ELECCION),
                  borderColor: `${d.color}59`,
                  background: "rgba(10,17,36,.94)",
                  color: d.color,
                  boxShadow: `0 0 14px -6px ${d.color}`,
                }}
              >
                {recorta(texto)}
              </span>
            );
          })}
        </div>
      ))}

      <style>{`
        .constelacion .nucleo {
          background: radial-gradient(circle at 50% 35%,
            rgba(165,180,252,.30), rgba(76,95,215,.18) 45%, rgba(10,17,36,.92) 78%);
          border: 1px solid rgba(129,140,248,.45);
          box-shadow: 0 0 46px -12px rgba(129,140,248,.85),
                      inset 0 0 26px -12px rgba(165,180,252,.9);
          animation: latir 7s ease-in-out infinite;
        }
        .constelacion .nodo { animation: brotar .6s cubic-bezier(.2,.8,.3,1) both; }
        .constelacion .nodo:hover { filter: brightness(1.25); }
        .constelacion .eleccion { animation: chispa .45s cubic-bezier(.2,.8,.3,1) both; }
        .constelacion .hilo { animation: aclarar .8s ease-out both; }
        .constelacion .corriente { animation: fluir 5.5s linear infinite; }
        .constelacion .orbita { animation: girar 120s linear infinite; transform-origin: 50px 50px; }
        .constelacion .respira { animation: respirar 9s ease-in-out infinite; transform-origin: 50px 50px; }

        /* OJO: en Tailwind v4 las clases -translate-x-1/2 usan la propiedad
           CSS \`translate\`, no \`transform\`. Las dos se COMPONEN, así que si
           una animación repite el translate aquí, el elemento se va media
           caja. Estos keyframes solo escalan. */
        @keyframes latir {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.035); }
        }
        @keyframes respirar {
          0%, 100% { opacity: .75; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.06); }
        }
        @keyframes brotar {
          from { opacity: 0; transform: scale(.72); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes chispa {
          from { opacity: 0; transform: scale(.6); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes aclarar { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fluir { from { stroke-dashoffset: 28; } to { stroke-dashoffset: 0; } }
        @keyframes girar { to { transform: rotate(360deg); } }

        @media (prefers-reduced-motion: reduce) {
          .constelacion .nucleo,
          .constelacion .nodo,
          .constelacion .eleccion,
          .constelacion .hilo,
          .constelacion .corriente,
          .constelacion .orbita,
          .constelacion .respira { animation: none; }
          .constelacion .nodo,
          .constelacion .eleccion,
          .constelacion .hilo { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
