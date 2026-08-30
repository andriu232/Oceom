"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronDown, Trash2, ShieldCheck, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { borrarExploracion, borrarMiMapa } from "@/lib/actions/biocode";
import type { Exploracion, MiMapa } from "@/lib/biocode/mi-mapa";

/* ============================================================
   MI MAPA BIOCODE (§16), el historial (§21) y el control de los datos (§26).

   Sobre el lenguaje: el manual insiste en que nunca se afirme un patrón. Por
   eso "lo que se repite" solo aparece cuando algo salió DOS veces o más, y
   se enuncia como observación, no como verdad sobre la persona.
   ============================================================ */

function fecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor?: string }) {
  if (!valor) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-24 shrink-0 text-[0.7rem] uppercase tracking-wider text-muted/70">
        {etiqueta}
      </span>
      <span className="text-foreground/90">{valor}</span>
    </div>
  );
}

function Tarjeta({ e, onBorrada }: { e: Exploracion; onBorrada: () => void }) {
  const [abierta, setAbierta] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [borrando, empezar] = useTransition();

  const titulo = e.tema ?? e.ficha?.zona ?? e.titulo;

  return (
    <div className="glass rounded-2xl border border-card-border">
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={() => setAbierta((v) => !v)}
          aria-expanded={abierta}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted transition-transform",
              abierta && "rotate-180",
            )}
          />
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-foreground">{titulo}</span>
              {e.numero !== null && (
                <span className="text-[0.7rem] text-muted/70">
                  Exploración #{String(e.numero).padStart(3, "0")}
                </span>
              )}
              {e.estado === "completada" && (
                <span className="rounded-full bg-ocean-glow/12 px-2 py-0.5 text-[0.65rem] text-ocean-glow">
                  Completada
                </span>
              )}
            </span>
            <span className="mt-0.5 block text-xs text-muted">{fecha(e.creada)}</span>
          </span>
        </button>

        {confirmando ? (
          <span className="flex shrink-0 items-center gap-2">
            <button
              onClick={() =>
                empezar(async () => {
                  const r = await borrarExploracion(e.id);
                  if (r.ok) onBorrada();
                })
              }
              disabled={borrando}
              className="rounded-lg bg-danger px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
            >
              {borrando ? "Borrando…" : "Sí, borrar"}
            </button>
            <button
              onClick={() => setConfirmando(false)}
              className="rounded-lg border border-card-border px-3 py-1.5 text-xs text-muted"
            >
              Cancelar
            </button>
          </span>
        ) : (
          <button
            onClick={() => setConfirmando(true)}
            aria-label={`Borrar la exploración ${titulo}`}
            className="grid size-8 shrink-0 place-items-center rounded-lg border border-card-border text-muted transition hover:border-danger/40 hover:text-danger"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>

      {abierta && (
        <div className="space-y-2 border-t border-card-border px-4 py-4">
          <Fila etiqueta="Zona" valor={e.ficha?.zona} />
          <Fila etiqueta="Emoción" valor={e.ficha?.emocion} />
          <Fila etiqueta="Creencia" valor={e.ficha?.creencia} />
          <Fila etiqueta="Patrón" valor={e.ficha?.patron} />
          <Fila etiqueta="Pregunta" valor={e.ficha?.pregunta} />
          {e.ficha?.reflexion && (
            <div className="mt-3 rounded-xl border border-card-border bg-ocean-surface/40 p-3">
              <p className="text-[0.7rem] uppercase tracking-wider text-muted/70">
                Mi reflexión
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {e.ficha.reflexion}
              </p>
            </div>
          )}
          {!e.ficha && (
            <p className="text-sm text-muted">
              Aquí solo hubo conversación: no llegaste a marcar nada en el mapa.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function MiMapaPanel({ datos }: { datos: MiMapa }) {
  const [exploraciones, setExploraciones] = useState(datos.exploraciones);
  const [confirmarTodo, setConfirmarTodo] = useState(false);
  const [borrandoTodo, empezarTodo] = useTransition();

  if (datos.faltaMigracion) {
    return (
      <div className="rounded-2xl border border-danger/30 bg-danger/8 p-5">
        <p className="text-sm text-foreground">
          Falta aplicar la migración <code>0030_biocode_mapa.sql</code> en la base de
          datos. Sin ella no hay dónde guardar el mapa ni las fichas.
        </p>
      </div>
    );
  }

  if (exploraciones.length === 0) {
    return (
      <div className="glass rounded-[24px] border border-ocean-violet/15 p-10 text-center">
        <Compass className="mx-auto size-6 text-ocean-violet" />
        <p className="mt-3 text-sm text-muted">
          Tu mapa está en blanco todavía. Cada exploración que guardes se irá quedando
          aquí, y con el tiempo vas a poder ver qué se repite.
        </p>
        <Link
          href="/biocode"
          className="mt-4 inline-flex h-10 items-center rounded-xl bg-ocean-violet px-5 text-sm font-medium text-white transition hover:brightness-110"
        >
          Empezar a explorar
        </Link>
      </div>
    );
  }

  const quitar = (id: string) => setExploraciones((xs) => xs.filter((x) => x.id !== id));
  const conFicha = exploraciones.filter((e) => e.ficha || e.mapa.nodos.length > 0);
  const sueltas = exploraciones.filter((e) => !e.ficha && e.mapa.nodos.length === 0);

  const repetidos = datos.porDimension
    .map((d) => ({ ...d, temas: d.temas.filter((t) => t.veces > 1) }))
    .filter((d) => d.temas.length > 0);

  return (
    <div className="space-y-8">
      {/* Lo que se repite (§16) */}
      {repetidos.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Lo que se repite
          </h2>
          <p className="mt-1 text-sm text-muted">
            Esto no es un diagnóstico ni una verdad sobre ti: es lo que has vuelto a
            tocar más de una vez. Puede ser un buen punto de partida.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {repetidos.map((d) => (
              <div
                key={d.key}
                className="rounded-2xl border p-4"
                style={{ borderColor: `${d.color}33`, background: `${d.color}0a` }}
              >
                <p className="text-[0.7rem] uppercase tracking-wider" style={{ color: d.color }}>
                  {d.label}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {d.temas.map((t) => (
                    <li key={t.texto} className="flex items-start justify-between gap-2">
                      <span className="text-sm leading-snug text-foreground/90">{t.texto}</span>
                      <span
                        className="mt-0.5 shrink-0 rounded-full px-1.5 text-[0.65rem] font-semibold"
                        style={{ background: `${d.color}22`, color: d.color }}
                      >
                        ×{t.veces}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Todo lo explorado, por dimensión */}
      {datos.porDimension.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Todo tu mapa
          </h2>
          <div className="mt-4 space-y-3">
            {datos.porDimension.map((d) => (
              <div key={d.key} className="flex flex-wrap items-baseline gap-2">
                <span
                  className="w-full text-[0.7rem] uppercase tracking-wider sm:w-40"
                  style={{ color: d.color }}
                >
                  {d.label}
                </span>
                <span className="flex flex-1 flex-wrap gap-1.5">
                  {d.temas.map((t) => (
                    <span
                      key={t.texto}
                      className="rounded-lg border px-2 py-1 text-xs"
                      style={{ borderColor: `${d.color}44`, color: d.color }}
                    >
                      {t.texto}
                      {t.veces > 1 && <span className="ml-1 opacity-70">×{t.veces}</span>}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Historial (§21). Se separan las exploraciones que dejaron ficha de
          las conversaciones sueltas: mezclarlas hacía que el historial se
          viera lleno de entradas a medias. */}
      {conFicha.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Tus exploraciones
          </h2>
          <p className="mt-1 text-sm text-muted">
            {conFicha.length}{" "}
            {conFicha.length === 1 ? "exploración guardada" : "exploraciones guardadas"}.
          </p>
          <div className="mt-4 space-y-2.5">
            {conFicha.map((e) => (
              <Tarjeta key={e.id} e={e} onBorrada={() => quitar(e.id)} />
            ))}
          </div>
        </section>
      )}

      {sueltas.length > 0 && (
        <section>
          <h2 className="font-display text-base font-semibold text-foreground">
            Conversaciones sueltas
          </h2>
          <p className="mt-1 text-sm text-muted">
            Charlas en las que no marcaste nada en el mapa. Se quedan aquí por si
            quieres releerlas, y puedes borrarlas cuando quieras.
          </p>
          <div className="mt-4 space-y-2.5 opacity-80">
            {sueltas.map((e) => (
              <Tarjeta key={e.id} e={e} onBorrada={() => quitar(e.id)} />
            ))}
          </div>
        </section>
      )}

      {/* Privacidad (§26) */}
      <section className="rounded-[24px] border border-card-border bg-ocean-surface/40 p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-ocean-glow" />
          <h2 className="font-display text-base font-semibold text-foreground">
            Tus datos
          </h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          De cada exploración se guarda lo que elegiste en el mapa, la ficha y lo que
          escribiste en tu reflexión, junto con la conversación de esa sesión. Es
          información privada tuya: nadie más de OCEOM la ve. Puedes borrar una
          exploración suelta con el ícono de papelera, o borrarlo todo aquí abajo.
        </p>
        <div className="mt-4">
          {confirmarTodo ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-foreground">
                Se borran las {exploraciones.length} exploraciones y no se pueden
                recuperar. ¿Seguimos?
              </span>
              <button
                onClick={() =>
                  empezarTodo(async () => {
                    const r = await borrarMiMapa();
                    if (r.ok) {
                      setExploraciones([]);
                      setConfirmarTodo(false);
                    }
                  })
                }
                disabled={borrandoTodo}
                className="rounded-lg bg-danger px-3.5 py-2 text-xs font-medium text-white disabled:opacity-60"
              >
                {borrandoTodo ? "Borrando…" : "Sí, borrar todo mi mapa"}
              </button>
              <button
                onClick={() => setConfirmarTodo(false)}
                className="rounded-lg border border-card-border px-3.5 py-2 text-xs text-muted"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmarTodo(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-danger/30 px-4 py-2 text-xs text-danger transition hover:bg-danger/8"
            >
              <Trash2 className="size-3.5" /> Borrar todo mi mapa
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
