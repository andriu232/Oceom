"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Type,
  FileText,
  Trash2,
  Loader2,
  Check,
  AlertTriangle,
  Database,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  addTextDocumentAction,
  createBibliotecaUpload,
  refreshBibliotecaAction,
  deleteDocumentAction,
  toggleDocumentAction,
  type BibliotecaState,
} from "@/lib/actions/biblioteca";
import { createClient } from "@/lib/supabase/client";

export interface DocRow {
  id: string;
  title: string;
  source_type: "text" | "file";
  file_name: string | null;
  char_count: number;
  chunk_count: number;
  status: "processing" | "ready" | "error";
  is_active: boolean;
  created_at: string;
}

export function BibliotecaManager({
  docs,
  stats,
}: {
  docs: DocRow[];
  stats: { total: number; active: number; chunks: number };
}) {
  const [tab, setTab] = useState<"file" | "text">("file");

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        <StatTile icon={FileText} value={stats.total} label="Documentos" />
        <StatTile icon={Eye} value={stats.active} label="Activos en OMI" />
        <StatTile icon={Database} value={stats.chunks} label="Fragmentos indexados" />
      </div>

      {/* Agregar material */}
      <div className="glass rounded-2xl p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Agregar material al cerebro de OMI
        </h2>
        <p className="mt-1 text-sm text-muted">
          Lo que subas aquí, OMI lo usará como fuente para acompañar a los
          estudiantes. Sube tus protocolos, guiones, ejercicios o notas.
        </p>

        <div className="mt-4 inline-flex rounded-xl border border-card-border bg-ocean-surface/40 p-1">
          <TabButton active={tab === "file"} onClick={() => setTab("file")} icon={Upload}>
            Subir archivo
          </TabButton>
          <TabButton active={tab === "text"} onClick={() => setTab("text")} icon={Type}>
            Pegar texto
          </TabButton>
        </div>

        <div className="mt-4">
          {tab === "file" ? <FileForm /> : <TextForm />}
        </div>
      </div>

      {/* Lista de documentos */}
      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
          Material de la biblioteca
        </h2>
        {docs.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center">
            <Database className="mx-auto size-8 text-muted/50" />
            <p className="mt-3 text-sm font-medium text-foreground">
              Aún no has subido material
            </p>
            <p className="mt-1 text-sm text-muted">
              Sube tu primer documento arriba y OMI empezará a aprender de él.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {docs.map((d) => (
              <DocItem key={d.id} doc={d} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ── Formularios ── */

const BIBLIOTECA_BUCKET = "omi-biblioteca";
const MAX_UPLOAD_BYTES = 26_214_400; // 25 MB

/** Subida en 3 pasos: firmar ruta → subir DIRECTO a Storage → indexar.
 *  El archivo no pasa por la Server Action (su cuerpo va topado muy por
 *  debajo de lo que pesa un PDF de libro). */
function FileForm() {
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<BibliotecaState>(undefined);
  const [pending, setPending] = useState(false);
  const [step, setStep] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const title = String(fd.get("title") ?? "").trim();
    const file = fd.get("file");

    setState(undefined);
    if (!(file instanceof File) || file.size === 0)
      return setState({ error: "Selecciona un archivo." });
    if (file.size > MAX_UPLOAD_BYTES)
      return setState({ error: "El archivo supera los 25 MB." });

    setPending(true);
    try {
      setStep("Preparando la subida…");
      const signed = await createBibliotecaUpload(file.name, file.size);
      if ("error" in signed) return setState({ error: signed.error });

      setStep("Subiendo el archivo…");
      const supabase = createClient();
      const { error: upErr } = await supabase.storage
        .from(BIBLIOTECA_BUCKET)
        .uploadToSignedUrl(signed.path, signed.token, file, {
          contentType: file.type || undefined,
        });
      if (upErr) return setState({ error: `No se pudo subir: ${upErr.message}` });

      setStep("Leyendo e indexando para OMI…");
      const res = await fetch("/api/biblioteca/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: signed.path, title, fileName: file.name }),
      });
      const json = (await res.json()) as { error?: string; chunks?: number };
      if (!res.ok || json.error)
        return setState({ error: json.error ?? "No se pudo indexar el documento." });

      form.reset();
      setState({ ok: true });
      await refreshBibliotecaAction();
      router.refresh();
    } catch (err) {
      setState({
        error: err instanceof Error ? err.message : "Algo falló durante la subida.",
      });
    } finally {
      setPending(false);
      setStep(null);
    }
  }

  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="text-xs font-medium text-muted">Título (opcional)</label>
        <input
          name="title"
          placeholder="Ej. Protocolo de Sanación de la Niñez"
          className="mt-1 w-full rounded-xl border border-card-border bg-ocean-surface/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-ocean-cyan/40 focus:outline-none"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted">Archivo · PDF, TXT o MD (máx. 25 MB)</label>
        <input
          name="file"
          type="file"
          accept=".pdf,.txt,.md,.markdown,text/plain,application/pdf"
          required
          className="mt-1 block w-full rounded-xl border border-card-border bg-ocean-surface/50 px-3 py-2.5 text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-ocean-cyan/15 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ocean-cyan hover:file:bg-ocean-cyan/25"
        />
      </div>
      <SubmitRow pending={pending} state={state} label="Subir e indexar" pendingLabel={step} />
    </form>
  );
}

function TextForm() {
  const [state, action, pending] = useActionState<BibliotecaState, FormData>(
    addTextDocumentAction,
    undefined,
  );
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state?.ok]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      <div>
        <label className="text-xs font-medium text-muted">Título</label>
        <input
          name="title"
          required
          placeholder="Ej. Guion de hipnosis · Merecimiento"
          className="mt-1 w-full rounded-xl border border-card-border bg-ocean-surface/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-ocean-cyan/40 focus:outline-none"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted">Texto</label>
        <textarea
          name="text"
          required
          rows={7}
          placeholder="Pega aquí tu protocolo, ejercicio, notas, transcripción…"
          className="mt-1 w-full resize-y rounded-xl border border-card-border bg-ocean-surface/50 px-3 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted/60 focus:border-ocean-cyan/40 focus:outline-none"
        />
      </div>
      <SubmitRow pending={pending} state={state} label="Guardar e indexar" />
    </form>
  );
}

function SubmitRow({
  pending,
  state,
  label,
  pendingLabel,
}: {
  pending: boolean;
  state: BibliotecaState;
  label: string;
  /** Texto del paso en curso (subiendo, indexando…). */
  pendingLabel?: string | null;
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
            <Loader2 className="size-4 animate-spin" /> {pendingLabel ?? "Indexando…"}
          </>
        ) : (
          label
        )}
      </button>
      {state?.ok && (
        <span className="inline-flex items-center gap-1 text-sm text-success">
          <Check className="size-4" /> Agregado al cerebro de OMI
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

/* ── Item de documento ── */

function DocItem({ doc }: { doc: DocRow }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = () =>
    start(async () => {
      setError(null);
      const r = await toggleDocumentAction(doc.id, !doc.is_active);
      if (r?.error) setError(r.error);
      else router.refresh();
    });

  const remove = () =>
    start(async () => {
      setError(null);
      const r = await deleteDocumentAction(doc.id);
      if (r?.error) {
        setError(r.error);
        setConfirm(false);
      } else router.refresh();
    });

  return (
    <li
      className={cn(
        "glass flex items-center gap-3 rounded-xl px-4 py-3 transition-opacity",
        !doc.is_active && "opacity-55",
      )}
    >
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-ocean-cyan/12 text-ocean-cyan">
        <FileText className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{doc.title}</p>
        <p className="truncate text-xs text-muted">
          {doc.source_type === "file" && doc.file_name ? `${doc.file_name} · ` : ""}
          {doc.chunk_count} fragmentos
          {doc.status === "error" && (
            <span className="text-danger"> · error al procesar</span>
          )}
          {doc.status === "processing" && <span> · procesando…</span>}
        </p>
        {error && <p className="mt-0.5 text-xs text-danger">{error}</p>}
      </div>

      {/* Estado activo */}
      <span
        className={cn(
          "hidden shrink-0 rounded-full px-2.5 py-0.5 text-xs sm:inline",
          doc.is_active
            ? "bg-success/15 text-success"
            : "bg-white/5 text-muted",
        )}
      >
        {doc.is_active ? "Activo" : "Inactivo"}
      </span>

      {/* Activar/desactivar */}
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        title={doc.is_active ? "Desactivar (OMI deja de usarlo)" : "Activar"}
        className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-foreground disabled:opacity-50"
      >
        {doc.is_active ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
      </button>

      {/* Borrar (confirmación inline) */}
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
          title="Eliminar documento"
          className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-danger/10 hover:text-danger"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </li>
  );
}

/* ── Auxiliares ── */

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

function StatTile({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof FileText;
  value: number;
  label: string;
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-ocean-cyan/12 text-ocean-cyan">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="font-display text-2xl font-bold leading-none text-foreground">
            {value}
          </p>
          <p className="mt-1 truncate text-xs text-muted">{label}</p>
        </div>
      </div>
    </div>
  );
}
