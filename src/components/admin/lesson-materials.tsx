"use client";

import { useActionState, useEffect, useRef } from "react";
import { FileText, Upload, Trash2, Paperclip } from "lucide-react";
import {
  uploadMaterialAction,
  deleteMaterialAction,
  type MaterialState,
} from "@/lib/actions/materials";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface MaterialItem {
  id: string;
  title: string;
  description: string | null;
  file_type: string | null;
}

export function LessonMaterials({
  lessonId,
  programId,
  resources,
}: {
  lessonId: string;
  programId: string;
  resources: MaterialItem[];
}) {
  const [state, action, pending] = useActionState<MaterialState, FormData>(
    uploadMaterialAction,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Limpia el formulario al subir con éxito.
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state?.ok]);

  return (
    <section className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2">
        <Paperclip className="size-4 text-ocean-cyan" />
        <h2 className="font-display text-lg font-semibold text-foreground">
          Materiales de apoyo
        </h2>
      </div>
      <p className="mt-1 text-sm text-muted">
        PDFs, audios, ejercicios… El estudiante podrá descargarlos en esta
        experiencia (máx. 50 MB).
      </p>

      {/* Lista de materiales */}
      {resources.length > 0 ? (
        <ul className="mt-5 space-y-2">
          {resources.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-3 rounded-xl border border-card-border bg-ocean-surface/40 p-3"
            >
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-ocean-violet/15 text-ocean-violet">
                <FileText className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {r.title}
                  {r.file_type && (
                    <span className="ml-2 rounded bg-white/5 px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wide text-muted">
                      {r.file_type}
                    </span>
                  )}
                </p>
                {r.description && (
                  <p className="truncate text-xs text-muted">{r.description}</p>
                )}
              </div>
              <form action={deleteMaterialAction.bind(null, r.id, lessonId, programId)}>
                <button
                  className="grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                  aria-label="Eliminar material"
                >
                  <Trash2 className="size-4" />
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 rounded-xl border border-dashed border-card-border p-4 text-sm text-muted">
          Aún no hay materiales en esta experiencia.
        </p>
      )}

      {/* Formulario de subida */}
      <form ref={formRef} action={action} className="mt-6 space-y-4 border-t border-card-border pt-6">
        <input type="hidden" name="lessonId" value={lessonId} />
        <input type="hidden" name="programId" value={programId} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="material-title">Título</Label>
            <Input id="material-title" name="title" placeholder="Ej: Guía de la sesión (PDF)" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="material-desc">Descripción (opcional)</Label>
            <Input id="material-desc" name="description" placeholder="Breve nota" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="material-file">Archivo</Label>
          <input
            id="material-file"
            name="file"
            type="file"
            required
            className="block w-full cursor-pointer rounded-xl border border-card-border bg-ocean-surface/40 text-sm text-muted file:mr-4 file:cursor-pointer file:border-0 file:bg-ocean-cyan/15 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-ocean-cyan hover:file:bg-ocean-cyan/25"
          />
        </div>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}
        {state?.ok && <p className="text-sm text-success">Material subido ✓</p>}

        <Button type="submit" disabled={pending}>
          <Upload className="size-4" /> {pending ? "Subiendo…" : "Subir material"}
        </Button>
      </form>
    </section>
  );
}
