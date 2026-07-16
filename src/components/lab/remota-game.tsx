"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

/* ============================================================
   Visión Remota (Mundo 3): existe un "lugar oculto" (escena generada al
   azar). ANTES de verlo, el viajero registra sus impresiones — color,
   temperatura, elemento y formas. Luego la escena se revela y compara.
   No hay acierto/error: se observa el propio proceso perceptivo.
   ============================================================ */

const COLORES = [
  { key: "cian", label: "Cian", base: "#0e7490", luz: "#22d3ee" },
  { key: "violeta", label: "Violeta", base: "#4c1d95", luz: "#818cf8" },
  { key: "dorado", label: "Dorado", base: "#92400e", luz: "#eab308" },
  { key: "turquesa", label: "Turquesa", base: "#0f766e", luz: "#2dd4bf" },
] as const;
const AMBIENTES = ["cálido", "frío"] as const;
const ELEMENTOS = ["agua", "cielo", "tierra"] as const;
const FORMAS = ["curvas", "rectas"] as const;

interface Target {
  color: (typeof COLORES)[number];
  ambiente: (typeof AMBIENTES)[number];
  elemento: (typeof ELEMENTOS)[number];
  forma: (typeof FORMAS)[number];
}

function makeTarget(): Target {
  const r = (n: number) => Math.floor(Math.random() * n);
  return {
    color: COLORES[r(COLORES.length)],
    ambiente: AMBIENTES[r(2)],
    elemento: ELEMENTOS[r(3)],
    forma: FORMAS[r(2)],
  };
}

export function RemotaGame({
  finish,
}: {
  finish: (metrics: Record<string, unknown>, reflexion?: string) => void;
}) {
  const target = useMemo(() => makeTarget(), []);
  const [color, setColor] = useState<string | null>(null);
  const [ambiente, setAmbiente] = useState<string | null>(null);
  const [elemento, setElemento] = useState<string | null>(null);
  const [forma, setForma] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const listo = color && ambiente && elemento && forma;
  const matches = [
    { label: "Color dominante", tuyo: color, real: target.color.label },
    { label: "Temperatura", tuyo: ambiente, real: target.ambiente },
    { label: "Elemento", tuyo: elemento, real: target.elemento },
    { label: "Formas", tuyo: forma, real: target.forma },
  ];
  const coincidencias = matches.filter((m) => m.tuyo === m.real).length;

  if (!revealed) {
    return (
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-muted">
          En algún punto del océano existe un lugar que aún no has visto. Cierra
          los ojos un instante, respira, y registra las impresiones que lleguen —
          sin inventarlas, sin corregirlas.
        </p>
        <Selector label="¿Qué color domina ese lugar?" options={COLORES.map((c) => c.label)} value={color} onPick={setColor} />
        <Selector label="¿Se siente cálido o frío?" options={[...AMBIENTES]} value={ambiente} onPick={setAmbiente} />
        <Selector label="¿Qué elemento lo habita?" options={[...ELEMENTOS]} value={elemento} onPick={setElemento} />
        <Selector label="¿Sus formas son…?" options={[...FORMAS]} value={forma} onPick={setForma} />
        <button
          onClick={() => setRevealed(true)}
          disabled={!listo}
          className="inline-flex items-center gap-2 rounded-xl bg-oceom-turquoise px-5 py-2.5 text-sm font-semibold text-[var(--ocean-abyss)] transition hover:brightness-110 disabled:opacity-40"
        >
          Revelar el lugar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <TargetScene t={target} />
      <div className="overflow-hidden rounded-xl border border-card-border">
        {matches.map((m, i) => {
          const ok = m.tuyo === m.real;
          return (
            <div
              key={m.label}
              className={cn(
                "grid grid-cols-3 gap-2 px-4 py-2.5 text-sm",
                i > 0 && "border-t border-card-border/60",
              )}
            >
              <span className="text-muted">{m.label}</span>
              <span className={cn(ok ? "text-oceom-turquoise" : "text-foreground/80")}>{m.tuyo}</span>
              <span className="text-foreground/60">{m.real}</span>
            </div>
          );
        })}
      </div>
      <button
        onClick={() =>
          finish(
            { coincidencias },
            "Lo importante no es cuántas impresiones coincidieron, sino CÓMO llegaron: ¿viste, sentiste o supiste? Registrar sin corregir es el músculo de este mundo.",
          )
        }
        className="inline-flex items-center gap-2 rounded-xl bg-ocean-cyan px-5 py-2.5 text-sm font-semibold text-[var(--ocean-abyss)] transition hover:brightness-110"
      >
        Reflexionar y cerrar
      </button>
    </div>
  );
}

/** Escena del "lugar" generada desde sus atributos. */
function TargetScene({ t }: { t: Target }) {
  const { base, luz } = t.color;
  const warm = t.ambiente === "cálido";
  return (
    <svg viewBox="0 0 380 180" className="w-full rounded-xl border border-card-border" role="img" aria-label="El lugar revelado">
      <defs>
        <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={warm ? luz : base} stopOpacity={warm ? 0.55 : 0.9} />
          <stop offset="100%" stopColor="#04101f" />
        </linearGradient>
      </defs>
      <rect width="380" height="180" fill="url(#rg)" />
      {t.elemento === "agua" &&
        [70, 100, 130].map((y, i) => (
          <path
            key={y}
            d={
              t.forma === "curvas"
                ? `M0 ${y} q 32 -14 64 0 t 64 0 t 64 0 t 64 0 t 64 0 t 64 0`
                : `M0 ${y} l 38 -10 l 38 10 l 38 -10 l 38 10 l 38 -10 l 38 10 l 38 -10 l 38 10 l 38 -10 l 38 10`
            }
            fill="none"
            stroke={luz}
            strokeOpacity={0.5 - i * 0.12}
            strokeWidth="2.5"
          />
        ))}
      {t.elemento === "cielo" && (
        <>
          <circle cx="300" cy="46" r="22" fill={luz} opacity="0.8" />
          {[60, 130, 200, 250, 90, 170].map((x, i) =>
            t.forma === "curvas" ? (
              <circle key={x} cx={x} cy={30 + ((i * 23) % 70)} r={2 + (i % 3)} fill={luz} opacity="0.7" />
            ) : (
              <path
                key={x}
                d={`M${x} ${30 + ((i * 23) % 70)} l4 8 l-8 0 z`}
                fill={luz}
                opacity="0.7"
              />
            ),
          )}
        </>
      )}
      {t.elemento === "tierra" &&
        (t.forma === "rectas" ? (
          <>
            <path d="M0 180 L90 70 L180 180 Z" fill={base} opacity="0.9" />
            <path d="M120 180 L230 50 L340 180 Z" fill={luz} opacity="0.45" />
          </>
        ) : (
          <>
            <path d="M0 180 Q 95 60 190 180 Z" fill={base} opacity="0.9" />
            <path d="M120 180 Q 230 40 340 180 Z" fill={luz} opacity="0.45" />
          </>
        ))}
    </svg>
  );
}

function Selector({
  label,
  options,
  value,
  onPick,
}: {
  label: string;
  options: string[];
  value: string | null;
  onPick: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onPick(o)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
              value === o
                ? "border-oceom-turquoise/50 bg-oceom-turquoise/12 text-oceom-turquoise"
                : "border-card-border text-foreground/75 hover:text-foreground",
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
