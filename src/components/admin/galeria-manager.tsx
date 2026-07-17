"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Feather,
  Image as ImageIcon,
  Trash2,
  Loader2,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
  X,
  Orbit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  addAstralPoemAction,
  uploadAstralFotoAction,
  deleteAstralItemAction,
  toggleAstralItemAction,
  type AstralState,
} from "@/lib/actions/galeria";

export interface AstralRow {
  id: string;
  kind: "foto" | "poema";
  title: string;
  description: string | null;
  file_url: string | null;
  is_published: boolean;
  created_at: string;
}

export function GaleriaManager({ items }: { items: AstralRow[] }) {
  const [tab, setTab] = useState<"foto" | "poema">("foto");

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Agregar a la Galería Astral
        </h2>
        <p className="mt-1 text-sm text-muted">
          Fotos y poemas que tus estudiantes recorren en una galería 3D inmersiva.
        </p>

        <div className="mt-4 inline-flex rounded-xl border border-card-border bg-ocean-surface/40 p-1">
          <TabButton active={tab === "foto"} onClick={() => setTab("foto")} icon={ImageIcon}>
            Subir foto
          </TabButton>
          <TabButton active={tab === "poema"} onClick={() => setTab("poema")} icon={Feather}>
            Escribir poema
          </TabButton>
        </div>

        <div className="mt-4">{tab === "foto" ? <FotoForm /> : <PoemaForm />}</div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
          En la galería ({items.length})
        </h2>
        {items.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center">
            <Orbit className="mx-auto size-8 text-muted/50" />
            <p className="mt-3 text-sm font-medium text-foreground">La galería está vacía</p>
            <p className="mt-1 text-sm text-muted">Sube tu primera foto o poema.</p>
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

function FotoForm() {
  const [state, action, pending] = useActionState<AstralState, FormData>(
    uploadAstralFotoAction,
    undefined,
  );
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state?.ok]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      <Field name="title" label="Título (opcional)" placeholder="Ej. Amanecer en el retiro" />
      <Field name="description" label="Pie de foto (opcional)" placeholder="Una línea que la acompañe" />
      <div>
        <label className="text-xs font-medium text-muted">Imagen · JPG, PNG o WebP (máx. 10 MB)</label>
        <input
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          className="mt-1 block w-full rounded-xl border border-card-border bg-ocean-surface/50 px-3 py-2.5 text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-ocean-cyan/15 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ocean-cyan hover:file:bg-ocean-cyan/25"
        />
      </div>
      <SubmitRow pending={pending} state={state} label="Subir a la galería" />
    </form>
  );
}

function PoemaForm() {
  const [state, action, pending] = useActionState<AstralState, FormData>(
    addAstralPoemAction,
    undefined,
  );
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state?.ok]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      <Field name="title" label="Título" placeholder="Ej. El océano que soy" required />
      <div>
        <label className="text-xs font-medium text-muted">Poema</label>
        <textarea
          name="content"
          required
          rows={7}
          placeholder={"Escribe el poema…\nLos saltos de línea se respetan como versos."}
          className="mt-1 w-full resize-y rounded-xl border border-card-border bg-ocean-surface/50 px-3 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted/60 focus:border-ocean-cyan/40 focus:outline-none"
        />
      </div>
      <SubmitRow pending={pending} state={state} label="Publicar poema" />
    </form>
  );
}

function Field({
  name,
  label,
  placeholder,
  required,
}: {
  name: string;
  label: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted">{label}</label>
      <input
        name={name}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-card-border bg-ocean-surface/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-ocean-cyan/40 focus:outline-none"
      />
    </div>
  );
}

function SubmitRow({
  pending,
  state,
  label,
}: {
  pending: boolean;
  state: AstralState;
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

function ItemRow({ item }: { item: AstralRow }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = () =>
    start(async () => {
      setError(null);
      const r = await toggleAstralItemAction(item.id, !item.is_published);
      if (r?.error) setError(r.error);
      else router.refresh();
    });
  const remove = () =>
    start(async () => {
      setError(null);
      const r = await deleteAstralItemAction(item.id);
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
      {item.kind === "foto" && item.file_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.file_url}
          alt=""
          className="size-11 shrink-0 rounded-lg object-cover ring-1 ring-inset ring-card-border"
        />
      ) : (
        <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-ocean-violet/12 text-ocean-violet">
          <Feather className="size-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
        <p className="truncate text-xs text-muted">
          {item.kind === "foto" ? "Foto" : "Poema"}
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
        title={item.is_published ? "Ocultar" : "Publicar"}
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
