"use client";

import { StickyNote, Trash2, Plus } from "lucide-react";
import {
  addMentorNoteAction,
  deleteMentorNoteAction,
} from "@/lib/actions/notes";

export interface NoteItem {
  id: string;
  note: string;
  dateLabel: string;
}

/** Notas privadas de la mentora sobre el estudiante (el estudiante nunca las ve). */
export function MentorNotes({
  studentId,
  notes,
}: {
  studentId: string;
  notes: NoteItem[];
}) {
  return (
    <section className="glass rounded-2xl p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
        <StickyNote className="size-5 text-ocean-cyan" /> Notas privadas
      </h2>
      <p className="mt-1 text-sm text-muted">
        Solo vos las ves. El estudiante nunca las verá.
      </p>

      {/* React 19 resetea el form al completar la acción → el textarea se limpia. */}
      <form action={addMentorNoteAction.bind(null, studentId)} className="mt-4">
        <textarea
          name="note"
          required
          rows={3}
          placeholder="Escribe una observación sobre este estudiante (avances, temas a trabajar, acuerdos…)"
          className="w-full resize-none rounded-xl border border-card-border bg-ocean-surface/40 p-3 text-sm text-foreground placeholder:text-muted/60 focus:border-ocean-cyan/40 focus:outline-none"
        />
        <div className="mt-2 flex justify-end">
          <button className="inline-flex items-center gap-1.5 rounded-xl bg-ocean-cyan/15 px-4 py-2 text-sm font-medium text-ocean-cyan transition-colors hover:bg-ocean-cyan/25">
            <Plus className="size-4" /> Guardar nota
          </button>
        </div>
      </form>

      {notes.length > 0 && (
        <ul className="mt-4 space-y-2">
          {notes.map((n) => (
            <li
              key={n.id}
              className="rounded-xl border border-card-border bg-ocean-surface/40 p-3"
            >
              <p className="whitespace-pre-wrap text-sm text-foreground/90">
                {n.note}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-muted">{n.dateLabel}</span>
                <form action={deleteMentorNoteAction.bind(null, n.id, studentId)}>
                  <button
                    className="text-muted transition-colors hover:text-danger"
                    title="Eliminar nota"
                    aria-label="Eliminar nota"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
