"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  ChevronRight,
  Users,
  GraduationCap,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface StudentRow {
  id: string;
  name: string;
  email: string | null;
  programTitle: string | null;
  programId: string | null;
  enrollmentStatus: string | null;
  totalLessons: number;
  completedLessons: number;
  progressPct: number;
  currentLesson: string | null;
  lastActivity: string | null;
  lastActivityLabel: string;
  needsAttention: boolean;
}

export interface StudentStats {
  total: number;
  active: number;
  avgProgress: number | null;
  attention: number;
}

type FilterKey = "all" | "active" | "noprogram" | "attention";
type SortKey = "activity" | "progress" | "name";

/** Panel CRM de estudiantes para la mentora: resumen + búsqueda + filtros + orden. */
export function StudentsPanel({
  students,
  stats,
}: {
  students: StudentRow[];
  stats: StudentStats;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("activity");

  const counts = useMemo(
    () => ({
      all: students.length,
      active: students.filter((s) => s.enrollmentStatus === "active").length,
      noprogram: students.filter((s) => !s.programId).length,
      attention: students.filter((s) => s.needsAttention).length,
    }),
    [students],
  );

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    let r = students.filter((s) => {
      if (term) {
        const hay = `${s.name} ${s.email ?? ""}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (filter === "active") return s.enrollmentStatus === "active";
      if (filter === "noprogram") return !s.programId;
      if (filter === "attention") return s.needsAttention;
      return true;
    });
    r = [...r].sort((a, b) => {
      if (sort === "progress") return b.progressPct - a.progressPct;
      if (sort === "name") return a.name.localeCompare(b.name);
      // actividad reciente (nulls al final)
      return (b.lastActivity ?? "").localeCompare(a.lastActivity ?? "");
    });
    return r;
  }, [students, q, filter, sort]);

  const FILTERS: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: "Todos", count: counts.all },
    { key: "active", label: "Con programa", count: counts.active },
    { key: "noprogram", label: "Sin programa", count: counts.noprogram },
    { key: "attention", label: "Atención", count: counts.attention },
  ];

  return (
    <div className="space-y-5">
      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={Users} value={stats.total} label="Estudiantes" />
        <StatTile icon={GraduationCap} value={stats.active} label="Con programa activo" />
        <StatTile
          icon={TrendingUp}
          value={stats.avgProgress == null ? "—" : `${stats.avgProgress}%`}
          label="Progreso promedio"
        />
        <StatTile
          icon={AlertTriangle}
          value={stats.attention}
          label="Sin actividad reciente"
          alert={stats.attention > 0}
        />
      </div>

      {/* Buscador + filtros + orden */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative lg:max-w-xs lg:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o correo…"
            className="w-full rounded-xl border border-card-border bg-ocean-surface/40 py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted/60 focus:border-ocean-cyan/40 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                filter === f.key
                  ? "border-ocean-cyan/30 bg-ocean-cyan/15 text-ocean-cyan"
                  : "border-card-border text-muted hover:text-foreground",
                f.key === "attention" && f.count > 0 && filter !== f.key && "text-oceom-gold",
              )}
            >
              {f.label} · {f.count}
            </button>
          ))}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-xl border border-card-border bg-ocean-surface/40 px-3 py-2 text-xs text-muted focus:border-ocean-cyan/40 focus:outline-none"
            aria-label="Ordenar"
          >
            <option value="activity">Actividad reciente</option>
            <option value="progress">Mayor progreso</option>
            <option value="name">Nombre (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Lista */}
      <div className="glass overflow-hidden rounded-2xl">
        <div className="hidden grid-cols-12 gap-4 border-b border-card-border px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted lg:grid">
          <span className="col-span-3">Estudiante</span>
          <span className="col-span-3">Programa</span>
          <span className="col-span-3">Progreso · clase actual</span>
          <span className="col-span-2">Última actividad</span>
          <span className="col-span-1 text-right">Acceso</span>
        </div>

        {rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">
            No hay estudiantes que coincidan con la búsqueda.
          </p>
        ) : (
          <ul className="divide-y divide-card-border">
            {rows.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/estudiantes/${s.id}`}
                  className="grid grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-white/5 lg:grid-cols-12 lg:items-center lg:gap-4"
                >
                  {/* Estudiante */}
                  <div className="flex items-center gap-3 lg:col-span-3">
                    <div className="relative">
                      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-ocean-glow to-ocean-violet text-sm font-semibold text-[var(--ocean-abyss)]">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      {s.needsAttention && (
                        <span
                          title="Sin actividad reciente"
                          className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-oceom-gold ring-2 ring-[var(--ocean-abyss)]"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{s.name}</p>
                      <p className="truncate text-xs text-muted">{s.email}</p>
                    </div>
                  </div>

                  {/* Programa */}
                  <div className="lg:col-span-3">
                    <p className="truncate text-sm text-foreground/90">
                      {s.programTitle ?? (
                        <span className="text-muted">Sin programa</span>
                      )}
                    </p>
                  </div>

                  {/* Progreso + clase */}
                  <div className="lg:col-span-3">
                    {s.totalLessons > 0 ? (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/5">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-ocean-glow to-ocean-cyan"
                              style={{ width: `${s.progressPct}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted">
                            {s.completedLessons}/{s.totalLessons}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-ocean-cyan">
                          {s.currentLesson}
                        </p>
                      </>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </div>

                  {/* Última actividad */}
                  <div className="text-xs text-muted lg:col-span-2">
                    {s.lastActivityLabel}
                  </div>

                  {/* Acceso */}
                  <div className="flex items-center justify-between lg:col-span-1 lg:justify-end">
                    <span
                      className={
                        s.enrollmentStatus === "active"
                          ? "rounded-full bg-success/15 px-2.5 py-0.5 text-xs text-success"
                          : "rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-muted"
                      }
                    >
                      {s.enrollmentStatus === "active" ? "Activo" : "Inactivo"}
                    </span>
                    <ChevronRight className="ml-2 hidden size-4 text-muted lg:block" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  value,
  label,
  alert = false,
}: {
  icon: typeof Users;
  value: string | number;
  label: string;
  alert?: boolean;
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl",
            alert ? "bg-oceom-gold/15 text-oceom-gold" : "bg-ocean-cyan/12 text-ocean-cyan",
          )}
        >
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
