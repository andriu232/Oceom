"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, X, AlertTriangle } from "lucide-react";
import { deleteStudentAction } from "@/lib/actions/students";

/** Botón (papelera) + modal de confirmación para eliminar a un estudiante de
 *  forma permanente. Vive FUERA del <Link> de la fila para no navegar al hacer
 *  click. Solo lo ve la mentora / super admin. */
export function DeleteStudentButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function confirm() {
    setError(null);
    start(async () => {
      const res = await deleteStudentAction(id);
      if (res?.error) setError(res.error);
      else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        aria-label={`Eliminar a ${name}`}
        title="Eliminar estudiante"
        className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-danger/10 hover:text-danger"
      >
        <Trash2 className="size-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ocean-abyss/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="glass-strong w-full max-w-md rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-danger/12 text-danger">
                  <AlertTriangle className="size-5" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Eliminar estudiante
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="text-muted transition-colors hover:text-foreground disabled:opacity-60"
                aria-label="Cerrar"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-foreground/80">
              Vas a eliminar a{" "}
              <span className="font-semibold text-foreground">{name}</span> de
              forma permanente. Se borrará su cuenta y todos sus datos: progreso,
              bitácora, comunidad, inscripciones y entregas.{" "}
              <span className="text-danger">Esta acción no se puede deshacer.</span>
            </p>

            {error && <p className="mt-3 text-sm text-danger">{error}</p>}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="rounded-lg border border-card-border px-4 py-2 text-sm text-muted transition-colors hover:text-foreground disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Eliminando…
                  </>
                ) : (
                  "Eliminar definitivamente"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
