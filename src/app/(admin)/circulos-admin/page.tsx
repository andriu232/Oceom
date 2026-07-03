import Link from "next/link";
import { Radio, Pencil, Clock, Dot, DoorOpen } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listCirclesForAdmin, circleState, type Circle } from "@/lib/queries/circles";
import { PageHeader } from "@/components/shared/page-header";
import { CircleForm } from "@/components/admin/circle-form";
import { formatDayLabel, formatTime } from "@/lib/scheduling/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "Círculos · OCEOM" };

export default async function CirculosAdminPage() {
  await requireRole("mentor", "super_admin");
  const supabase = await createClient();
  const [{ upcoming, past }, programsRes, studentsRes] = await Promise.all([
    listCirclesForAdmin(),
    supabase.from("programs").select("id,title").eq("status", "published").order("created_at"),
    supabase.from("profiles").select("id,full_name,email").eq("role", "student").order("full_name"),
  ]);
  const students = (studentsRes.data ?? []).map((s) => ({
    id: s.id,
    name: s.full_name ?? s.email ?? "Estudiante",
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Círculos en Vivo"
        subtitle="Programa los encuentros en vivo con tu comunidad."
      />

      <CircleForm programs={programsRes.data ?? []} students={students} />

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
          Próximos y en vivo
        </h2>
        {upcoming.length > 0 ? (
          <div className="space-y-2">
            {upcoming.map((c) => <AdminRow key={c.id} c={c} />)}
          </div>
        ) : (
          <p className="glass rounded-xl p-4 text-sm text-muted">
            Aún no has programado círculos. Crea el primero arriba.
          </p>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
            Pasados
          </h2>
          <div className="space-y-2 opacity-80">
            {past.map((c) => <AdminRow key={c.id} c={c} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function AdminRow({ c }: { c: Circle }) {
  const st = circleState(c);
  return (
    <div className="glass flex items-center gap-4 rounded-xl p-4">
      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-ocean-violet/15 text-ocean-violet">
        <Radio className="size-5" />
      </div>
      <Link href={`/circulos-admin/${c.id}`} className="group min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium text-foreground transition-colors group-hover:text-ocean-cyan">
            {c.title}
          </p>
          {st === "live" && (
            <span className="inline-flex items-center rounded-full bg-danger/15 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-danger">
              <Dot className="-ml-1 size-4 animate-pulse" /> En vivo
            </span>
          )}
        </div>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
          <Clock className="size-3.5" />
          {formatDayLabel(c.starts_at)} · {formatTime(c.starts_at)}
          <span className="mx-1">·</span>
          {c.studentName
            ? `1:1 con ${c.studentName}`
            : c.programTitle
              ? `Solo ${c.programTitle}`
              : "Abierto a todos"}
        </p>
      </Link>
      {st === "live" && (
        <Link
          href={`/circulos/${c.id}`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-ocean-cyan/15 px-3 py-2 text-sm font-medium text-ocean-cyan transition-colors hover:bg-ocean-cyan/25"
        >
          <DoorOpen className="size-4" /> Ir a la sala
        </Link>
      )}
      <Link
        href={`/circulos-admin/${c.id}`}
        className="shrink-0 text-muted transition-colors hover:text-ocean-cyan"
        title="Editar"
        aria-label="Editar círculo"
      >
        <Pencil className="size-4" />
      </Link>
    </div>
  );
}
