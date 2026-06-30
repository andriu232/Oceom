"use client";

import { Check, Lock, Plus } from "lucide-react";
import {
  enrollStudentAction,
  revokeEnrollmentAction,
} from "@/lib/actions/enrollment";
import { cn } from "@/lib/utils";

export interface EnrollProgram {
  id: string;
  title: string;
  type: string;
  enrolled: boolean;
}

/** Gestiona el acceso del estudiante a cada programa (abrir / quitar). */
export function EnrollmentManager({
  studentId,
  programs,
}: {
  studentId: string;
  programs: EnrollProgram[];
}) {
  return (
    <section className="glass rounded-2xl p-6">
      <h2 className="font-display text-lg font-semibold text-foreground">
        Acceso a programas
      </h2>
      <p className="mt-1 text-sm text-muted">
        Abre el acceso para que el estudiante vea la ruta, las experiencias y los
        materiales del programa.
      </p>

      {programs.length === 0 ? (
        <p className="mt-5 text-sm text-muted">
          Aún no hay programas publicados. Publica uno desde Programas.
        </p>
      ) : (
        <ul className="mt-5 space-y-2">
          {programs.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-card-border bg-ocean-surface/40 p-3"
            >
              <div
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-xl",
                  p.enrolled
                    ? "bg-success/15 text-success"
                    : "bg-white/5 text-muted",
                )}
              >
                {p.enrolled ? <Check className="size-4" /> : <Lock className="size-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{p.title}</p>
                <p className="text-xs text-muted">
                  {p.enrolled ? "Con acceso" : "Sin acceso"}
                </p>
              </div>
              {p.enrolled ? (
                <form action={revokeEnrollmentAction.bind(null, studentId, p.id)}>
                  <button className="rounded-lg border border-card-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-danger/40 hover:bg-danger/10 hover:text-danger">
                    Quitar acceso
                  </button>
                </form>
              ) : (
                <form action={enrollStudentAction.bind(null, studentId, p.id)}>
                  <button className="inline-flex items-center gap-1 rounded-lg bg-ocean-cyan/15 px-3 py-1.5 text-xs font-medium text-ocean-cyan transition-colors hover:bg-ocean-cyan/25">
                    <Plus className="size-3.5" /> Abrir acceso
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
