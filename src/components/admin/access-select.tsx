"use client";

import { useEffect, useRef, useState } from "react";
import {
  Users,
  GraduationCap,
  User,
  Search,
  ChevronDown,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProgramOption {
  id: string;
  title: string;
}
export interface StudentOption {
  id: string;
  name: string;
}

type Access =
  | { type: "all" }
  | { type: "program"; id: string }
  | { type: "student"; id: string };

const FIELD =
  "h-11 w-full rounded-xl border border-card-border bg-ocean-surface/40 px-3 text-sm text-foreground outline-none focus:border-ocean-cyan/40";

/**
 * Selector de acceso del círculo (popover custom, no el <select> nativo):
 *  • Abierto a todos
 *  • Solo inscritos en un programa
 *  • Solo para UN estudiante (1:1) — con búsqueda.
 * Emite `program_id` y `student_id` (mutuamente excluyentes) como hidden inputs.
 */
export function AccessSelect({
  programs,
  students,
  defaultProgramId,
  defaultStudentId,
}: {
  programs: ProgramOption[];
  students: StudentOption[];
  defaultProgramId?: string | null;
  defaultStudentId?: string | null;
}) {
  const [access, setAccess] = useState<Access>(
    defaultStudentId
      ? { type: "student", id: defaultStudentId }
      : defaultProgramId
        ? { type: "program", id: defaultProgramId }
        : { type: "all" },
  );
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const programId = access.type === "program" ? access.id : "";
  const studentId = access.type === "student" ? access.id : "";

  const label =
    access.type === "all"
      ? "Abierto a todos los estudiantes"
      : access.type === "program"
        ? `Solo inscritos en: ${programs.find((p) => p.id === access.id)?.title ?? "—"}`
        : `Solo para: ${students.find((s) => s.id === access.id)?.name ?? "—"}`;

  const CurrentIcon =
    access.type === "all" ? Users : access.type === "program" ? GraduationCap : User;

  const term = q.trim().toLowerCase();
  const filtered = term
    ? students.filter((s) => s.name.toLowerCase().includes(term))
    : students;

  const choose = (a: Access) => {
    setAccess(a);
    setOpen(false);
    setQ("");
  };

  return (
    <div className="relative" ref={ref}>
      <input type="hidden" name="program_id" value={programId} />
      <input type="hidden" name="student_id" value={studentId} />

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(FIELD, "flex items-center justify-between gap-2 text-left")}
      >
        <span className="flex min-w-0 items-center gap-2">
          <CurrentIcon className="size-4 shrink-0 text-ocean-cyan" />
          <span className="truncate">{label}</span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute z-40 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-card-border bg-[#0a1b30] p-2 shadow-2xl shadow-black/50">
          <Row
            icon={Users}
            label="Abierto a todos los estudiantes"
            active={access.type === "all"}
            onClick={() => choose({ type: "all" })}
          />

          {programs.length > 0 && <GroupLabel>Por programa</GroupLabel>}
          {programs.map((p) => (
            <Row
              key={p.id}
              icon={GraduationCap}
              label={`Solo inscritos en: ${p.title}`}
              active={access.type === "program" && access.id === p.id}
              onClick={() => choose({ type: "program", id: p.id })}
            />
          ))}

          {students.length > 0 && (
            <>
              <GroupLabel>Un solo estudiante (1:1)</GroupLabel>
              <div className="relative px-1 pb-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar estudiante…"
                  className="w-full rounded-lg border border-card-border bg-ocean-surface/40 py-1.5 pl-8 pr-2 text-xs text-foreground placeholder:text-muted/60 focus:border-ocean-cyan/40 focus:outline-none"
                />
              </div>
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-xs text-muted">Sin coincidencias.</p>
              ) : (
                filtered.slice(0, 50).map((s) => (
                  <Row
                    key={s.id}
                    icon={User}
                    label={s.name}
                    active={access.type === "student" && access.id === s.id}
                    onClick={() => choose({ type: "student", id: s.id })}
                  />
                ))
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pb-1 pt-2 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-muted/60">
      {children}
    </p>
  );
}

function Row({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Users;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
        active ? "bg-ocean-cyan/15 text-ocean-cyan" : "text-foreground/90 hover:bg-white/5",
      )}
    >
      <Icon className="size-4 shrink-0 opacity-80" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {active && <Check className="size-4 shrink-0" />}
    </button>
  );
}
