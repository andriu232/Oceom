"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Trash2, Search, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NIVELES,
  ECONOMIAS,
  detectarCoincidencias,
  comoSeLlama,
  AVISO_COINCIDENCIAS,
  type Nivel,
  type PersonaArbol,
} from "@/lib/biocode/arbol";
import { guardarPersona, borrarPersona, type ArbolCargado } from "@/lib/actions/arbol";

/* ============================================================
   MI ÁRBOL BIOCODE (§14) y las coincidencias (§15).

   La detección corre en el navegador sobre lo que ya está en pantalla: es
   una función pura y así las coincidencias se actualizan mientras la persona
   escribe, sin ida y vuelta al servidor.
   ============================================================ */

const VACIA = (nivel: Nivel): PersonaArbol => ({
  id: "",
  nivel,
  parentesco: null,
  nombre: null,
  nacimiento: null,
  fallecimiento: null,
  profesion: null,
  economia: null,
  enfermedades: [],
  acontecimientos: [],
  separacion: false,
  migracion: false,
  perdida: false,
  conflicto: false,
  notas: null,
});

const HECHOS = [
  { campo: "separacion", label: "Separación" },
  { campo: "migracion", label: "Migración" },
  { campo: "perdida", label: "Pérdida importante" },
  { campo: "conflicto", label: "Conflicto familiar" },
] as const;

const campo =
  "h-10 w-full rounded-xl border border-card-border bg-ocean-surface/60 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-ocean-violet focus:ring-2 focus:ring-[var(--ring)]";

function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1 block text-[0.68rem] uppercase tracking-wider text-muted/70">
      {children}
    </span>
  );
}

function Formulario({
  inicial,
  onGuardar,
  onCancelar,
}: {
  inicial: PersonaArbol;
  onGuardar: (p: PersonaArbol) => void;
  onCancelar: () => void;
}) {
  const [p, setP] = useState<PersonaArbol>(inicial);
  const set = <K extends keyof PersonaArbol>(k: K, v: PersonaArbol[K]) =>
    setP((x) => ({ ...x, [k]: v }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onGuardar(p);
      }}
      className="space-y-4 rounded-2xl border border-ocean-violet/25 bg-ocean-surface/40 p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <Etiqueta>Nombre</Etiqueta>
          <input
            className={campo}
            value={p.nombre ?? ""}
            onChange={(e) => set("nombre", e.target.value)}
            placeholder="Rosa"
          />
        </label>
        <label>
          <Etiqueta>Parentesco</Etiqueta>
          <input
            className={campo}
            value={p.parentesco ?? ""}
            onChange={(e) => set("parentesco", e.target.value)}
            placeholder="Abuela materna"
          />
        </label>
        <label>
          <Etiqueta>Nacimiento</Etiqueta>
          <input
            type="date"
            className={campo}
            value={p.nacimiento ?? ""}
            onChange={(e) => set("nacimiento", e.target.value)}
          />
        </label>
        <label>
          <Etiqueta>Fallecimiento</Etiqueta>
          <input
            type="date"
            className={campo}
            value={p.fallecimiento ?? ""}
            onChange={(e) => set("fallecimiento", e.target.value)}
          />
        </label>
        <label>
          <Etiqueta>Profesión</Etiqueta>
          <input
            className={campo}
            value={p.profesion ?? ""}
            onChange={(e) => set("profesion", e.target.value)}
            placeholder="Modista"
          />
        </label>
        <label>
          <Etiqueta>Situación económica</Etiqueta>
          <select
            className={campo}
            value={p.economia ?? ""}
            onChange={(e) => set("economia", e.target.value || null)}
          >
            <option value="">Sin registrar</option>
            {ECONOMIAS.map((e) => (
              <option key={e.key} value={e.key}>
                {e.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <Etiqueta>Enfermedades registradas</Etiqueta>
        <input
          className={campo}
          value={p.enfermedades.join(", ")}
          onChange={(e) => set("enfermedades", e.target.value.split(",").map((x) => x.trim()))}
          placeholder="Diabetes, migraña… (separadas por comas)"
        />
      </label>

      <div>
        <Etiqueta>Acontecimientos</Etiqueta>
        <p className="-mt-0.5 mb-2 text-xs text-muted">
          La edad importa: es lo que permite ver si algo se repite a edades parecidas.
        </p>
        <div className="space-y-2">
          {p.acontecimientos.map((a, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={campo}
                value={a.texto}
                onChange={(e) =>
                  set(
                    "acontecimientos",
                    p.acontecimientos.map((x, j) =>
                      j === i ? { ...x, texto: e.target.value } : x,
                    ),
                  )
                }
                placeholder="Se separó, migró, perdió a su madre…"
              />
              <input
                type="number"
                min={0}
                max={120}
                className={cn(campo, "w-24 shrink-0")}
                value={a.edad ?? ""}
                onChange={(e) =>
                  set(
                    "acontecimientos",
                    p.acontecimientos.map((x, j) =>
                      j === i ? { ...x, edad: e.target.value ? Number(e.target.value) : null } : x,
                    ),
                  )
                }
                placeholder="Edad"
              />
              <button
                type="button"
                onClick={() =>
                  set(
                    "acontecimientos",
                    p.acontecimientos.filter((_, j) => j !== i),
                  )
                }
                aria-label="Quitar acontecimiento"
                className="grid size-10 shrink-0 place-items-center rounded-xl border border-card-border text-muted hover:text-danger"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => set("acontecimientos", [...p.acontecimientos, { texto: "", edad: null }])}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-card-border px-3 py-1.5 text-xs text-muted transition hover:text-ocean-violet"
        >
          <Plus className="size-3.5" /> Añadir acontecimiento
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {HECHOS.map((h) => (
          <button
            key={h.campo}
            type="button"
            onClick={() => set(h.campo, !p[h.campo])}
            aria-pressed={p[h.campo]}
            className={cn(
              "rounded-xl border px-3 py-1.5 text-xs transition",
              p[h.campo]
                ? "border-ocean-violet bg-ocean-violet/15 text-ocean-violet"
                : "border-card-border text-muted hover:text-foreground",
            )}
          >
            {h.label}
          </button>
        ))}
      </div>

      <label className="block">
        <Etiqueta>Notas</Etiqueta>
        <textarea
          rows={2}
          className="w-full resize-y rounded-xl border border-card-border bg-ocean-surface/60 px-3 py-2 text-sm text-foreground outline-none focus:border-ocean-violet focus:ring-2 focus:ring-[var(--ring)]"
          value={p.notas ?? ""}
          onChange={(e) => set("notas", e.target.value)}
          placeholder="Lo que quieras recordar de esta persona."
        />
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          className="h-10 rounded-xl bg-ocean-violet px-4 text-sm font-medium text-white transition hover:brightness-110"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="h-10 rounded-xl border border-card-border px-4 text-sm text-muted"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function Persona({
  p,
  onEditar,
  onBorrar,
}: {
  p: PersonaArbol;
  onEditar: () => void;
  onBorrar: () => void;
}) {
  const marcas = HECHOS.filter((h) => p[h.campo]).map((h) => h.label);
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-card-border bg-ocean-surface/40 p-3">
      <button onClick={onEditar} className="min-w-0 flex-1 text-left">
        <span className="block font-medium text-foreground">{comoSeLlama(p)}</span>
        {p.parentesco && p.nombre && (
          <span className="block text-xs text-muted">{p.parentesco}</span>
        )}
        {(p.enfermedades.length > 0 || marcas.length > 0 || p.acontecimientos.length > 0) && (
          <span className="mt-1.5 flex flex-wrap gap-1">
            {marcas.map((m) => (
              <span
                key={m}
                className="rounded-full bg-ocean-violet/12 px-2 py-0.5 text-[0.65rem] text-ocean-violet"
              >
                {m}
              </span>
            ))}
            {p.enfermedades.slice(0, 3).map((e) => (
              <span
                key={e}
                className="rounded-full bg-ocean-surface px-2 py-0.5 text-[0.65rem] text-muted"
              >
                {e}
              </span>
            ))}
            {p.acontecimientos.length > 0 && (
              <span className="rounded-full bg-ocean-surface px-2 py-0.5 text-[0.65rem] text-muted">
                {p.acontecimientos.length}{" "}
                {p.acontecimientos.length === 1 ? "acontecimiento" : "acontecimientos"}
              </span>
            )}
          </span>
        )}
      </button>
      <button
        onClick={onBorrar}
        aria-label={`Borrar a ${comoSeLlama(p)}`}
        className="grid size-8 shrink-0 place-items-center rounded-lg border border-card-border text-muted transition hover:border-danger/40 hover:text-danger"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

export function ArbolPanel({ datos }: { datos: ArbolCargado }) {
  const [personas, setPersonas] = useState(datos.personas);
  const [editando, setEditando] = useState<PersonaArbol | null>(null);
  const [, empezar] = useTransition();

  const coincidencias = useMemo(() => detectarCoincidencias(personas), [personas]);

  if (datos.faltaMigracion) {
    return (
      <div className="rounded-2xl border border-danger/30 bg-danger/8 p-5">
        <p className="text-sm text-foreground">
          Falta aplicar la migración <code>0031_biocode_arbol.sql</code>: todavía no existe
          la tabla del árbol.
        </p>
      </div>
    );
  }

  function guardar(p: PersonaArbol) {
    setEditando(null);
    empezar(async () => {
      const res = await guardarPersona({ ...p, id: p.id || undefined });
      if (!res.ok || !res.id) return;
      setPersonas((xs) =>
        p.id ? xs.map((x) => (x.id === p.id ? { ...p } : x)) : [...xs, { ...p, id: res.id! }],
      );
    });
  }

  function borrar(id: string) {
    setPersonas((xs) => xs.filter((x) => x.id !== id));
    empezar(async () => {
      await borrarPersona(id);
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-2 rounded-2xl border border-card-border bg-ocean-surface/40 px-4 py-3">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-ocean-glow" />
        <p className="text-xs leading-relaxed text-muted">
          Aquí estás registrando información de otras personas de tu familia. Solo tú la
          ves: ni la mentora ni nadie más del equipo tiene acceso. Puedes borrar cualquier
          persona cuando quieras.
        </p>
      </div>

      {/* Coincidencias (§15) */}
      {coincidencias.length > 0 && (
        <section className="rounded-[24px] border border-ocean-violet/25 bg-ocean-violet/6 p-6">
          <div className="flex items-center gap-2">
            <Search className="size-4 text-ocean-violet" />
            <h2 className="font-display text-lg font-semibold text-foreground">
              Coincidencias para explorar
            </h2>
          </div>
          <ul className="mt-3 space-y-2.5">
            {coincidencias.map((c, i) => (
              <li key={i} className="text-sm leading-relaxed text-foreground/90">
                {c.texto}{" "}
                <span className="text-muted">({c.personas.join(", ")})</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-ocean-violet/20 pt-3 text-xs leading-relaxed text-muted">
            {AVISO_COINCIDENCIAS}
          </p>
        </section>
      )}

      {/* Los cuatro niveles (§14) */}
      {NIVELES.map((n) => {
        const suyas = personas.filter((p) => p.nivel === n.key);
        return (
          <section key={n.key}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-foreground">{n.label}</h2>
              <button
                onClick={() => setEditando(VACIA(n.key))}
                className="inline-flex items-center gap-1.5 rounded-xl border border-card-border bg-ocean-surface/60 px-3 py-1.5 text-xs text-foreground/85 transition hover:border-ocean-violet/40 hover:text-ocean-violet"
              >
                <Plus className="size-3.5" /> Añadir
              </button>
            </div>

            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {suyas.map((p) => (
                <Persona
                  key={p.id}
                  p={p}
                  onEditar={() => setEditando(p)}
                  onBorrar={() => borrar(p.id)}
                />
              ))}
            </div>
            {suyas.length === 0 && (
              <p className="mt-2 text-sm text-muted">Todavía no hay nadie en este nivel.</p>
            )}

            {editando && editando.nivel === n.key && (
              <div className="mt-3">
                <Formulario
                  inicial={editando}
                  onGuardar={guardar}
                  onCancelar={() => setEditando(null)}
                />
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
