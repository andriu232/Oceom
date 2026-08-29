"use client";

import { useActionState, useState } from "react";
import { Check, ShieldCheck, ShieldAlert, TriangleAlert } from "lucide-react";
import {
  mentorLinkPhoneAction,
  mentorUnlinkPhoneAction,
  type HermesState,
} from "@/lib/actions/hermes";
import { maskPhone } from "@/lib/hermes/phone";
import type { HermesStudentRow, HermesAlert } from "@/lib/queries/hermes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* ============================================================
   Panel de HERMES para Valeria: quién tiene WhatsApp vinculado, quién no,
   vinculación manual, y las alertas de bandera roja que Hermes atrapó.
   ============================================================ */

const CADENCIA: Record<string, string> = {
  diario: "Diario",
  semanal: "Semanal",
  nunca: "Sin recordatorios",
};

function fecha(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HermesAdminPanel({
  students,
  alerts,
}: {
  students: HermesStudentRow[];
  alerts: HermesAlert[];
}) {
  return (
    <div className="space-y-8">
      {alerts.length > 0 && <Alerts alerts={alerts} />}

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted/70">
          Estudiantes ({students.length})
        </h2>
        <div className="glass overflow-hidden rounded-2xl">
          <div className="divide-y divide-white/5">
            {students.map((s) => (
              <StudentRow key={s.id} student={s} />
            ))}
            {students.length === 0 && (
              <p className="p-6 text-sm text-muted">Todavía no hay estudiantes.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Alerts({ alerts }: { alerts: HermesAlert[] }) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-danger">
        <TriangleAlert className="size-4" />
        Mensajes que necesitan tu atención ({alerts.length})
      </h2>
      <div className="glass space-y-3 rounded-2xl border border-danger/25 p-5">
        <p className="text-sm text-muted">
          Hermes detectó estas señales antes de responder, entregó el protocolo de
          seguridad y detuvo el acompañamiento. La entrada quedó en su bitácora.
        </p>
        {alerts.map((a) => (
          <div key={a.id} className="rounded-xl bg-white/5 p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">{a.full_name ?? "Persona sin nombre"}</span>
              <span className="rounded-full bg-danger/15 px-2 py-0.5 text-xs text-danger">
                {a.red_flag === "crisis" ? "crisis emocional" : "urgencia médica"}
              </span>
              <span className="text-xs text-muted/70">{fecha(a.created_at)}</span>
            </div>
            {a.body && (
              <p className="mt-2 line-clamp-3 text-sm text-muted">{a.body}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function StudentRow({ student }: { student: HermesStudentRow }) {
  const [editing, setEditing] = useState(false);
  const [state, link, linking] = useActionState<HermesState, FormData>(
    mentorLinkPhoneAction,
    undefined,
  );

  const vinculado = !!student.phone_e164;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
      <div className="min-w-[12rem] flex-1">
        <p className="text-sm font-medium">{student.full_name ?? "Sin nombre"}</p>
        <p className="text-xs text-muted/70">{student.email}</p>
      </div>

      <div className="min-w-[11rem]">
        {vinculado ? (
          <span className="inline-flex items-center gap-1.5 text-sm">
            {student.phone_verified_at ? (
              <ShieldCheck className="size-4 text-success" />
            ) : (
              <ShieldAlert className="size-4 text-warning" />
            )}
            {maskPhone(student.phone_e164)}
          </span>
        ) : (
          <span className="text-sm text-muted/60">Sin WhatsApp</span>
        )}
      </div>

      <div className="min-w-[9rem] text-xs text-muted">
        {vinculado && student.hermes_opt_in
          ? `${CADENCIA[student.hermes_cadence] ?? student.hermes_cadence} · ${String(student.hermes_hour).padStart(2, "0")}:00`
          : vinculado
            ? "Recordatorios apagados"
            : "—"}
      </div>

      <div className="min-w-[7rem] text-xs text-muted">
        {student.entriesFromWhatsapp > 0
          ? `${student.entriesFromWhatsapp} entrada${student.entriesFromWhatsapp > 1 ? "s" : ""}`
          : "—"}
      </div>

      <div className="flex items-center gap-2">
        {editing ? (
          <form action={link} className="flex items-center gap-2">
            <input type="hidden" name="student_id" value={student.id} />
            <Input
              name="phone"
              type="tel"
              placeholder="+57 300 123 4567"
              defaultValue={student.phone_e164 ?? ""}
              className="h-9 w-44"
              required
            />
            <Button type="submit" disabled={linking} className="h-9">
              {linking ? "…" : "Guardar"}
            </Button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs text-muted hover:underline"
            >
              Cancelar
            </button>
            {state?.ok && <Check className="size-4 text-success" />}
            {state?.error && (
              <span className="max-w-[14rem] text-xs text-danger">{state.error}</span>
            )}
          </form>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-sm text-muted underline-offset-2 hover:text-fg hover:underline"
            >
              {vinculado ? "Cambiar" : "Vincular"}
            </button>
            {vinculado && (
              <form action={mentorUnlinkPhoneAction}>
                <input type="hidden" name="student_id" value={student.id} />
                <button
                  type="submit"
                  className="text-sm text-muted underline-offset-2 hover:text-danger hover:underline"
                >
                  Quitar
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
