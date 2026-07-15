"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Type,
  FileText,
  Feather,
  BookOpenText,
  Trash2,
  Loader2,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  addLibraryTextAction,
  uploadLibraryFileAction,
  deleteLibraryItemAction,
  toggleLibraryItemAction,
  type LibraryState,
} from "@/lib/actions/biblioteca-contenido";

export interface LibraryRow {
  id: string;
  title: string;
  description: string | null;
  kind: "texto" | "poema" | "archivo";
  file_name: string | null;
  is_published: boolean;
  created_at: string;
}

const KIND_META = {
  texto: { label: "Texto", icon: BookOpenText },
  poema: { label: "Poema", icon: Feather },
  archivo: { label: "Archivo", icon: FileText },
} as const;

export function LibraryManager({ items }: { items: LibraryRow[] }) {
  const [tab, setTab] = useState<"texto" | "archivo">("texto");

  return (
    <div className="space-y-6">
      {/* Agregar contenido */}
      <div className="glass rounded-2xl p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Agregar a la Biblioteca
        </h2>
        <p className="mt-1 text-sm text-muted">
          Lo que publiques aquí queda disponible para todos tus estudiantes.
        </p>

        <div className="mt-4 inline-flex rounded-xl border border-card-border bg-ocean-surface/40 p-1">
          <TabButton active={tab === "texto"} onClick={() => setTab("texto")} icon={Type}>
            Escribir texto o poema
          </TabButton>
          <TabButton active={tab === "archivo"} onClick={() => setTab("archivo")} icon={Upload}>
            Subir archivo
          </TabButton>
        </div>

        <div className="mt-4">{tab === "texto" ? <TextForm /> : <FileForm />}</div>
      </div>

      {/* Contenido publicado */}
      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
          Contenido de la Biblioteca ({items.length})
        </h2>
        {items.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center">
            <BookOpenText className="mx-auto size-8 text-muted/50" />
            <p className="mt-3 text-sm font-medium text-foreground">
              La Biblioteca está vacía
            </p>
            <p className="mt-1 text-sm text-muted">
              Publica tu primer texto, poema o PDF arriba.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => (
              <ItemRow key={it.id} item={it} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ── Formularios ── */

function TextForm() {
  const [state, action, pending] = useActionState<LibraryState, FormData>(
    addLibraryTextAction,
    undefined,
  );
  const [kind, setKind] = useState<"texto" | "poema">("texto");
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state?.ok]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="kind" value={kind} />
      <div className="flex gap-2">
        {(["texto", "poema"] as const).map((k) => {
          const Icon = KIND_META[k].icon;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                kind === k
                  ? "border-ocean-cyan/40 bg-ocean-cyan/10 text-foreground"
                  : "border-card-border text-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" /> {KIND_META[k].label}
            </button>
          );
        })}
      </div>
      <div>
        <label className="text-xs font-medium text-muted">Título</label>
        <input
          name="title"
          required
          placeholder={kind === "poema" ? "Ej. El océano que soy" : "Ej. Carta sobre el merecimiento"}
          className="mt-1 w-full rounded-xl border border-card-border bg-ocean-surface/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-ocean-cyan/40 focus:outline-none"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted">Descripción (opcional)</label>
        <input
          name="description"
          placeholder="Una línea que invite a leerlo"
          className="mt-1 w-full rounded-xl border border-card-border bg-ocean-surface/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-ocean-cyan/40 focus:outline-none"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted">Contenido</label>
        <textarea
          name="content"
          required
          rows={8}
          placeholder="Escribe o pega aquí el texto completo…"
          className="mt-1 w-full resize-y rounded-xl border border-card-border bg-ocean-surface/50 px-3 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted/60 focus:border-ocean-cyan/40 focus:outline-none"
        />
      </div>
      <SubmitRow pending={pending} state={state} label="Publicar en la Biblioteca" />
    </form>
  );
}

function FileForm() {
  const [state, action, pending] = useActionState<LibraryState, FormData>(
    uploadLibraryFileAction,
    undefined,
  );
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state?.ok]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      <div>
        <label className="text-xs font-medium text-muted">Título (opcional)</label>
        <input
          name="title"
          placeholder="Ej. Guía de respiración consciente"
          className="mt-1 w-full rounded-xl border border-card-border bg-ocean-surface/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-ocean-cyan/40 focus:outline-none"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted">Descripción (opcional)</label>
        <input
          name="description"
          placeholder="Una línea que invite a abrirlo"
          className="mt-1 w-full rounded-xl border border-card-border bg-ocean-surface/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-ocean-cyan/40 focus:outline-none"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted">
          Archivo · PDF, DOC, EPUB, TXT o MD (máx. 20 MB)
        </label>
        <input
          name="file"
          type="file"
          accept=".pdf,.doc,.docx,.epub,.txt,.md,application/pdf"
          required
          className="mt-1 block w-full rounded-xl border border-card-border bg-ocean-surface/50 px-3 py-2.5 text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-ocean-cyan/15 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ocean-cyan hover:file:bg-ocean-cyan/25"
        />
      </div>
      <SubmitRow pending={pending} state={state} label="Subir a la Biblioteca" />
    </form>
  );
}

function SubmitRow({
  pending,
  state,
  label,
}: {
  pending: boolean;
  state: LibraryState;
  label: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-ocean-cyan px-4 text-sm font-medium text-[var(--ocean-abyss)] transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Publicando…
          </>
        ) : (
          label
        )}
      </button>
      {state?.ok && (
        <span className="inline-flex items-center gap-1 text-sm text-success">
          <Check className="size-4" /> Publicado
        </span>
      )}
      {state?.error && (
        <span className="inline-flex items-center gap-1 text-sm text-danger">
          <AlertTriangle className="size-4" /> {state.error}
        </span>
      )}
    </div>
  );
}

/* ── Fila de la lista ── */

function ItemRow({ item }: { item: LibraryRow }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const meta = KIND_META[item.kind] ?? KIND_META.texto;
  const Icon = meta.icon;

  const toggle = () =>
    start(async () => {
      setError(null);
      const r = await toggleLibraryItemAction(item.id, !item.is_published);
      if (r?.error) setError(r.error);
      else router.refresh();
    });

  const remove = () =>
    start(async () => {
      setError(null);
      const r = await deleteLibraryItemAction(item.id);
      if (r?.error) {
        setError(r.error);
        setConfirm(false);
      } else router.refresh();
    });

  return (
    <li
      className={cn(
        "glass flex items-center gap-3 rounded-xl px-4 py-3 transition-opacity",
        !item.is_published && "opacity-55",
      )}
    >
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-ocean-cyan/12 text-ocean-cyan">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
        <p className="truncate text-xs text-muted">
          {meta.label}
          {item.file_name ? ` · ${item.file_name}` : ""}
          {item.description ? ` · ${item.description}` : ""}
        </p>
        {error && <p className="mt-0.5 text-xs text-danger">{error}</p>}
      </div>

      <span
        className={cn(
          "hidden shrink-0 rounded-full px-2.5 py-0.5 text-xs sm:inline",
          item.is_published ? "bg-success/15 text-success" : "bg-white/5 text-muted",
        )}
      >
        {item.is_published ? "Publicado" : "Oculto"}
      </span>

      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        title={item.is_published ? "Ocultar a los estudiantes" : "Publicar"}
        className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-foreground disabled:opacity-50"
      >
        {item.is_published ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
      </button>

      {confirm ? (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-lg bg-danger px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-60"
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : "Borrar"}
          </button>
          <button
            type="button"
            onClick={() => setConfirm(false)}
            disabled={pending}
            className="grid size-8 place-items-center rounded-lg text-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirm(true)}
          title="Eliminar"
          className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-danger/10 hover:text-danger"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </li>
  );
}

/* ── Aux ── */

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Upload;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-ocean-cyan/15 text-ocean-cyan" : "text-muted hover:text-foreground",
      )}
    >
      <Icon className="size-4" /> {children}
    </button>
  );
}
