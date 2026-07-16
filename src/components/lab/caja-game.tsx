"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

/* ============================================================
   Caja Misteriosa (Mundo 2): antes de revelar el objeto, el viajero
   describe cómo lo imagina (forma, textura, tamaño). Después compara su
   percepción con el objeto real y reflexiona sobre su proceso.
   Sin aciertos ni errores: coincidencias como espejo del proceso.
   ============================================================ */

interface Objeto {
  key: string;
  name: string;
  emoji: string;
  forma: "redondeada" | "angular" | "alargada";
  textura: "suave" | "rugosa" | "lisa y fría";
  tamano: "cabe en una mano" | "necesita dos manos" | "grande";
}

const OBJETOS: Objeto[] = [
  { key: "caracola", name: "Una caracola", emoji: "🐚", forma: "redondeada", textura: "rugosa", tamano: "cabe en una mano" },
  { key: "cuarzo", name: "Un cuarzo", emoji: "💎", forma: "angular", textura: "lisa y fría", tamano: "cabe en una mano" },
  { key: "remo", name: "Un remo de madera", emoji: "🛶", forma: "alargada", textura: "suave", tamano: "grande" },
  { key: "vasija", name: "Una vasija de barro", emoji: "🏺", forma: "redondeada", textura: "rugosa", tamano: "necesita dos manos" },
  { key: "pluma", name: "Una pluma", emoji: "🪶", forma: "alargada", textura: "suave", tamano: "cabe en una mano" },
  { key: "farol", name: "Un farol de vidrio", emoji: "🏮", forma: "angular", textura: "lisa y fría", tamano: "necesita dos manos" },
  { key: "cuenco", name: "Un cuenco tibetano", emoji: "🥣", forma: "redondeada", textura: "lisa y fría", tamano: "necesita dos manos" },
  { key: "madera", name: "Un trozo de madera de mar", emoji: "🪵", forma: "alargada", textura: "rugosa", tamano: "necesita dos manos" },
];

const FORMAS = ["redondeada", "angular", "alargada"] as const;
const TEXTURAS = ["suave", "rugosa", "lisa y fría"] as const;
const TAMANOS = ["cabe en una mano", "necesita dos manos", "grande"] as const;

const pickObjeto = () => OBJETOS[Math.floor(Math.random() * OBJETOS.length)];

export function CajaGame({
  finish,
}: {
  finish: (metrics: Record<string, unknown>, reflexion?: string) => void;
}) {
  const objeto = useMemo(() => pickObjeto(), []);
  const [forma, setForma] = useState<string | null>(null);
  const [textura, setTextura] = useState<string | null>(null);
  const [tamano, setTamano] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const listo = forma && textura && tamano;
  const coincidencias = revealed
    ? Number(forma === objeto.forma) + Number(textura === objeto.textura) + Number(tamano === objeto.tamano)
    : 0;

  if (!revealed) {
    return (
      <div className="space-y-5">
        <div className="mx-auto grid size-28 place-items-center rounded-2xl border border-oceom-gold/30 bg-gradient-to-br from-ocean-surface/60 to-ocean-abyss text-5xl shadow-[0_0_40px_-12px_rgba(234,179,8,0.35)]">
          ?
        </div>
        <p className="text-center text-sm text-muted">
          Dentro de esta caja hay un objeto. Antes de verlo, siéntelo con la imaginación.
        </p>

        <Selector label="Su forma es…" options={FORMAS} value={forma} onPick={setForma} />
        <Selector label="Su textura es…" options={TEXTURAS} value={textura} onPick={setTextura} />
        <Selector label="Su tamaño…" options={TAMANOS} value={tamano} onPick={setTamano} />

        <button
          onClick={() => setRevealed(true)}
          disabled={!listo}
          className="inline-flex items-center gap-2 rounded-xl bg-oceom-gold px-5 py-2.5 text-sm font-semibold text-[var(--ocean-abyss)] transition hover:brightness-110 disabled:opacity-40"
        >
          Abrir la caja
        </button>
      </div>
    );
  }

  const filas: { label: string; tuyo: string; real: string }[] = [
    { label: "Forma", tuyo: forma!, real: objeto.forma },
    { label: "Textura", tuyo: textura!, real: objeto.textura },
    { label: "Tamaño", tuyo: tamano!, real: objeto.tamano },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <span className="grid size-20 place-items-center rounded-2xl border border-oceom-gold/40 bg-ocean-surface/50 text-4xl">
          {objeto.emoji}
        </span>
        <p className="font-display text-lg font-semibold text-foreground">{objeto.name}</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-card-border">
        {filas.map((f, i) => {
          const match = f.tuyo === f.real;
          return (
            <div
              key={f.label}
              className={cn(
                "grid grid-cols-3 gap-2 px-4 py-2.5 text-sm",
                i > 0 && "border-t border-card-border/60",
              )}
            >
              <span className="text-muted">{f.label}</span>
              <span className={cn(match ? "text-oceom-turquoise" : "text-foreground/80")}>{f.tuyo}</span>
              <span className="text-foreground/60">{f.real}</span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted/70">Tu percepción · lo revelado. Las coincidencias brillan en turquesa.</p>

      <button
        onClick={() =>
          finish(
            { coincidencias, objeto: objeto.key },
            coincidencias >= 2
              ? "Tu imaginación tocó el objeto antes que tus ojos. Nota QUÉ sentiste primero al imaginar: ¿una imagen, un peso, una temperatura? Ese es tu canal perceptivo dominante."
              : "No se trataba de adivinar: se trataba de OBSERVAR cómo imagina tu mente. ¿Desde dónde construiste el objeto — memoria, lógica, sensación? Ese proceso es lo que entrenas.",
          )
        }
        className="inline-flex items-center gap-2 rounded-xl bg-ocean-cyan px-5 py-2.5 text-sm font-semibold text-[var(--ocean-abyss)] transition hover:brightness-110"
      >
        Reflexionar y cerrar
      </button>
    </div>
  );
}

function Selector({
  label,
  options,
  value,
  onPick,
}: {
  label: string;
  options: readonly string[];
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
                ? "border-oceom-gold/50 bg-oceom-gold/12 text-oceom-gold"
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
