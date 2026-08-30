"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Check, Loader2 } from "lucide-react";
import { guardarExploracion, type Ficha as FichaDatos } from "@/lib/actions/biocode";
import type { Mapa } from "@/lib/biocode/dimensiones";
import { elegidasDe } from "@/lib/biocode/dimensiones";
import type { BiocodeNode } from "@/lib/biocode/nodes";

/* ============================================================
   "LO QUE HE DESCUBIERTO" (§18) + el ejercicio personalizado (§19) + el
   recurso de OCEOM (§25), que juntos son el cierre de cada exploración.

   Los campos NO los redacta el modelo: salen de lo que la persona eligió en
   la constelación. Así la ficha siempre aparece y siempre dice la verdad de
   lo que pasó en la sesión, en vez de depender de que la IA se acuerde de
   cerrar bien.
   ============================================================ */

/** Las herramientas del §19, apuntando a lo que ya existe en OCEOM. */
const HERRAMIENTAS = [
  { label: "Respirar", href: "/lab/respiracion" },
  { label: "Escribir", href: "/bitacora" },
  { label: "Meditar", href: "/deep-waves" },
  { label: "Visualizar", href: "/lab/observador" },
  { label: "Ver una clase", href: "/academia" },
] as const;

function Campo({ etiqueta, valor }: { etiqueta: string; valor?: string }) {
  if (!valor) return null;
  return (
    <div>
      <dt className="text-[0.7rem] uppercase tracking-wider text-muted/70">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm leading-relaxed text-foreground">{valor}</dd>
    </div>
  );
}

export function Ficha({
  nodo,
  mapa,
  sessionId,
  entrada,
  onSeguir,
}: {
  nodo: BiocodeNode;
  mapa: Mapa;
  sessionId: string | null;
  /** Lo que la persona respondió en la puerta por la que entró (§9, §10,
   *  §12, §13): es su punto de partida y no debería perderse. */
  entrada?: string | null;
  onSeguir: () => void;
}) {
  const [reflexion, setReflexion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [numero, setNumero] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const datos: FichaDatos = {
    // Si se entró por la puerta de la emoción, el centro del mapa es la
    // emoción y la zona es la que la persona señaló en su cuerpo.
    zona: elegidasDe(mapa, "cuerpo")[0] ?? nodo.name,
    emocion: elegidasDe(mapa, "emociones")[0],
    creencia: elegidasDe(mapa, "creencias")[0],
    patron: elegidasDe(mapa, "patrones")[0],
    pregunta: elegidasDe(mapa, "reflexion")[0],
    ejercicio: elegidasDe(mapa, "ejercicio")[0],
  };

  async function guardar() {
    if (!sessionId) {
      setError("Escríbele algo a BIOCODE antes de guardar, para que exista la exploración.");
      return;
    }
    setGuardando(true);
    setError(null);
    const res = await guardarExploracion({
      sessionId,
      mapa,
      ficha: { ...datos, reflexion },
      tema: entrada ?? nodo.name,
      completada: true,
    });
    setGuardando(false);
    if (res.ok) setNumero(res.numero ?? null);
    else setError(res.error ?? "No pude guardarla.");
  }

  return (
    <div className="glass rounded-[24px] border border-ocean-violet/20 p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-ocean-violet" />
        <h2 className="font-display text-lg font-semibold text-foreground">
          Lo que he descubierto
        </h2>
        {numero !== null && (
          <span className="ml-auto rounded-full bg-ocean-violet/15 px-2.5 py-1 text-xs text-ocean-violet">
            Exploración #{String(numero).padStart(3, "0")}
          </span>
        )}
      </div>

      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Zona corporal" valor={datos.zona} />
        <Campo etiqueta="Emoción" valor={datos.emocion} />
        <Campo etiqueta="Creencia" valor={datos.creencia} />
        <Campo etiqueta="Patrón" valor={datos.patron} />
        <div className="sm:col-span-2">
          <Campo etiqueta="Punto de partida" valor={entrada ?? undefined} />
        </div>
        <div className="sm:col-span-2">
          <Campo etiqueta="Pregunta principal" valor={datos.pregunta} />
        </div>
      </dl>

      <label className="mt-5 block">
        <span className="text-[0.7rem] uppercase tracking-wider text-muted/70">
          Mi reflexión
        </span>
        <textarea
          value={reflexion}
          onChange={(e) => setReflexion(e.target.value)}
          rows={4}
          placeholder="Lo que quieras dejar escrito de esta exploración…"
          className="mt-1.5 w-full resize-y rounded-xl border border-card-border bg-ocean-surface/60 px-4 py-3 text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted/70 focus:border-ocean-violet focus:ring-2 focus:ring-[var(--ring)]"
        />
      </label>

      <div className="mt-5">
        <p className="text-sm text-muted">¿Quieres hacer algo con esta información?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {HERRAMIENTAS.map((h) => (
            <Link
              key={h.label}
              href={h.href}
              className="rounded-full border border-card-border bg-ocean-surface/50 px-3.5 py-1.5 text-xs text-foreground/85 transition-colors hover:border-ocean-violet/40 hover:text-ocean-violet"
            >
              {h.label}
            </Link>
          ))}
          <button
            onClick={onSeguir}
            className="rounded-full border border-ocean-violet/40 bg-ocean-violet/12 px-3.5 py-1.5 text-xs text-ocean-violet transition hover:bg-ocean-violet/20"
          >
            Continuar explorando
          </button>
        </div>
      </div>

      {nodo.oceom_resource && (
        <div className="mt-5 rounded-2xl border border-card-border bg-ocean-surface/40 px-4 py-3">
          <p className="text-[0.7rem] uppercase tracking-wider text-muted/70">
            Si quieres profundizar
          </p>
          {nodo.oceom_link ? (
            <Link
              href={nodo.oceom_link}
              className="text-sm text-ocean-violet underline-offset-4 hover:underline"
            >
              {nodo.oceom_resource}
            </Link>
          ) : (
            <p className="text-sm text-foreground">{nodo.oceom_resource}</p>
          )}
        </div>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={guardar}
          disabled={guardando || numero !== null}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-ocean-violet px-5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {guardando ? (
            <Loader2 className="size-4 animate-spin" />
          ) : numero !== null ? (
            <Check className="size-4" />
          ) : null}
          {numero !== null ? "Guardada en tu mapa" : "Guardar en mi mapa"}
        </button>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    </div>
  );
}
