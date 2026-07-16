"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

/* ============================================================
   Observador Profundo (Mundo 1): se genera una escena marina aleatoria,
   el viajero la observa unos segundos y luego responde 3 preguntas sobre
   sus detalles. Todo procedural (SVG): cada inmersión es distinta.
   ============================================================ */

const OBSERVE_SECONDS = 8;

const FISH_COLORS = [
  { key: "cian", label: "Cian", fill: "#22d3ee" },
  { key: "violeta", label: "Violeta", fill: "#818cf8" },
  { key: "dorado", label: "Dorado", fill: "#eab308" },
  { key: "turquesa", label: "Turquesa", fill: "#2dd4bf" },
];

interface Scene {
  fishCount: number; // 3-6
  fishColor: (typeof FISH_COLORS)[number];
  starColor: (typeof FISH_COLORS)[number];
  hasJellyfish: boolean;
  anchorLeft: boolean;
  fishes: { x: number; y: number; flip: boolean }[];
}

function makeScene(): Scene {
  const rnd = (n: number) => Math.floor(Math.random() * n);
  const fishCount = 3 + rnd(4);
  const fishColor = FISH_COLORS[rnd(FISH_COLORS.length)];
  let starColor = FISH_COLORS[rnd(FISH_COLORS.length)];
  while (starColor.key === fishColor.key) starColor = FISH_COLORS[rnd(FISH_COLORS.length)];
  const fishes = Array.from({ length: fishCount }, (_, i) => ({
    x: 40 + ((i * 97 + rnd(40)) % 300),
    y: 34 + ((i * 53 + rnd(30)) % 110),
    flip: Math.random() < 0.5,
  }));
  return { fishCount, fishColor, starColor, hasJellyfish: Math.random() < 0.5, anchorLeft: Math.random() < 0.5, fishes };
}

interface Question {
  q: string;
  options: string[];
  answer: string;
}

function makeQuestions(s: Scene): Question[] {
  const counts = [3, 4, 5, 6].map(String);
  return [
    { q: "¿Cuántos peces habitaban la escena?", options: counts, answer: String(s.fishCount) },
    {
      q: "¿De qué color era la estrella de mar?",
      options: FISH_COLORS.map((c) => c.label),
      answer: s.starColor.label,
    },
    {
      q: "¿Había una medusa en la escena?",
      options: ["Sí", "No"],
      answer: s.hasJellyfish ? "Sí" : "No",
    },
  ];
}

export function ObservadorGame({
  finish,
}: {
  finish: (metrics: Record<string, unknown>, reflexion?: string) => void;
}) {
  const scene = useMemo(() => makeScene(), []);
  const questions = useMemo(() => makeQuestions(scene), [scene]);
  const [left, setLeft] = useState(OBSERVE_SECONDS);
  const [qi, setQi] = useState(0);
  const [aciertos, setAciertos] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const observing = left > 0;

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  function pick(opt: string) {
    if (picked) return;
    setPicked(opt);
    const ok = opt === questions[qi].answer;
    const total = aciertos + (ok ? 1 : 0);
    setTimeout(() => {
      setPicked(null);
      if (qi + 1 < questions.length) {
        setAciertos(total);
        setQi(qi + 1);
      } else {
        finish(
          { aciertos: total },
          total === 3
            ? "Tu mirada capturó cada detalle del océano. La atención plena es un músculo: hoy lo sentiste despierto."
            : "No se trata de acertar: se trata de notar QUÉ observas y qué se te escapa. Cada inmersión afina tu mirada.",
        );
      }
    }, 900);
  }

  if (observing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">Observa cada detalle de la escena…</p>
          <span className="grid size-9 place-items-center rounded-full border border-ocean-cyan/40 font-mono text-sm text-ocean-cyan">
            {left}
          </span>
        </div>
        <svg
          viewBox="0 0 380 200"
          className="w-full rounded-xl border border-card-border"
          role="img"
          aria-label="Escena marina para observar"
        >
          <rect width="380" height="200" fill="#06182e" />
          <circle cx="330" cy="30" r="40" fill="rgba(34,211,238,0.08)" />
          {/* Algas */}
          <path d="M20 200 q6 -30 -4 -55 q12 8 10 55z" fill="#0e3b34" />
          <path d="M355 200 q-8 -36 4 -62 q-14 10 -12 62z" fill="#0e3b34" />
          {/* Peces */}
          {scene.fishes.map((f, i) => (
            <g key={i} transform={`translate(${f.x} ${f.y}) ${f.flip ? "scale(-1,1)" : ""}`}>
              <ellipse cx="0" cy="0" rx="14" ry="7" fill={scene.fishColor.fill} />
              <path d="M12 0 L22 -6 L22 6 Z" fill={scene.fishColor.fill} />
              <circle cx="-6" cy="-1.5" r="1.6" fill="#04101f" />
            </g>
          ))}
          {/* Estrella de mar */}
          <g transform="translate(190 178)">
            <path
              d="M0 -14 L4 -4 L14 -4 L6 3 L9 13 L0 7 L-9 13 L-6 3 L-14 -4 L-4 -4 Z"
              fill={scene.starColor.fill}
            />
          </g>
          {/* Medusa */}
          {scene.hasJellyfish && (
            <g transform="translate(300 70)" opacity="0.9">
              <path d="M-14 0 a14 14 0 0 1 28 0 z" fill="rgba(129,140,248,0.75)" />
              {[-9, -3, 3, 9].map((x) => (
                <path key={x} d={`M${x} 1 q2 8 -1 16`} stroke="rgba(129,140,248,0.6)" strokeWidth="2" fill="none" />
              ))}
            </g>
          )}
          {/* Ancla */}
          <g transform={`translate(${scene.anchorLeft ? 60 : 320} 168)`} stroke="#8aa0c6" strokeWidth="3" fill="none">
            <circle cx="0" cy="-14" r="4" />
            <line x1="0" y1="-10" x2="0" y2="12" />
            <path d="M-10 4 q0 12 10 12 q10 0 10 -12" />
          </g>
          {/* Burbujas */}
          {[50, 140, 250].map((x, i) => (
            <circle key={x} cx={x} cy={30 + i * 14} r={3 + i} fill="none" stroke="rgba(160,245,255,0.35)" />
          ))}
        </svg>
      </div>
    );
  }

  const q = questions[qi];
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Pregunta {qi + 1} de {questions.length}
      </p>
      <p className="font-display text-lg font-semibold text-foreground">{q.q}</p>
      <div className="grid grid-cols-2 gap-2">
        {q.options.map((opt) => {
          const isPicked = picked === opt;
          const showState = picked !== null && (isPicked || opt === q.answer);
          const good = opt === q.answer;
          return (
            <button
              key={opt}
              onClick={() => pick(opt)}
              disabled={picked !== null}
              className={cn(
                "rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
                showState
                  ? good
                    ? "border-success/50 bg-success/15 text-success"
                    : "border-danger/40 bg-danger/10 text-danger"
                  : "border-card-border text-foreground/85 hover:border-ocean-cyan/40 hover:text-ocean-cyan",
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
