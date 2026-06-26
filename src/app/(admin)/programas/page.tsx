import Link from "next/link";
import { Library, Plus, Pencil, Waves, Brain } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listAllPrograms } from "@/lib/queries/admin-content";
import { createProgramAction } from "@/lib/actions/content";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Programas · OCEOM" };

const STATUS_STYLE: Record<string, string> = {
  published: "bg-success/15 text-success",
  draft: "bg-white/10 text-muted",
  archived: "bg-danger/15 text-danger",
};
const STATUS_LABEL: Record<string, string> = {
  published: "Publicado",
  draft: "Borrador",
  archived: "Archivado",
};

export default async function ProgramasPage() {
  await requireRole("mentor", "super_admin");
  const programs = await listAllPrograms();

  return (
    <div>
      <PageHeader
        title="Programas"
        subtitle="Crea y gestiona las rutas del ecosistema OCEOM."
        action={
          <form action={createProgramAction}>
            <button className={buttonVariants({})}>
              <Plus className="size-4" /> Crear programa
            </button>
          </form>
        }
      />

      {programs.length === 0 ? (
        <EmptyState
          icon={Library}
          title="Aún no hay programas"
          description="Crea tu primer programa y empieza a construir sus fases, módulos y experiencias."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {programs.map((p) => {
            const Icon = p.type === "neuropsychic" ? Brain : Waves;
            return (
              <Link
                key={p.id}
                href={`/programas/${p.id}/editor`}
                className="glass group rounded-2xl p-5 transition-colors hover:border-ocean-cyan/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="grid size-11 place-items-center rounded-xl bg-ocean-cyan/12 text-ocean-cyan ring-1 ring-inset ring-ocean-cyan/20">
                    <Icon className="size-5" />
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      STATUS_STYLE[p.status],
                    )}
                  >
                    {STATUS_LABEL[p.status]}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                  {p.title}
                </h3>
                <p className="mt-1 text-sm text-muted">{p.lessons} experiencias</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-ocean-cyan opacity-0 transition-opacity group-hover:opacity-100">
                  <Pencil className="size-3.5" /> Editar
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
