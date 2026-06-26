import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2, Eye } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getProgramForEditor } from "@/lib/queries/admin-content";
import { deleteProgramAction } from "@/lib/actions/content";
import { ProgramForm } from "@/components/admin/program-form";
import { StructureEditor } from "@/components/admin/structure-editor";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  published: "Publicado",
  draft: "Borrador",
  archived: "Archivado",
};

export default async function ProgramEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireRole("mentor", "super_admin");
  const data = await getProgramForEditor(id);
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/programas"
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ocean-cyan"
      >
        <ArrowLeft className="size-4" /> Volver a Programas
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {data.program.title}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {STATUS_LABEL[data.program.status]} · /{data.program.slug}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/academia"
            className="glass inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-foreground transition hover:text-ocean-cyan"
          >
            <Eye className="size-4" /> Ver como estudiante
          </Link>
          <form action={deleteProgramAction.bind(null, id)}>
            <button className="inline-flex items-center gap-2 rounded-xl border border-card-border px-4 py-2 text-sm text-muted transition hover:border-danger/40 hover:bg-danger/10 hover:text-danger">
              <Trash2 className="size-4" /> Eliminar
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5 lg:items-start">
        <div className="lg:col-span-2">
          <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
            Información
          </h2>
          <ProgramForm program={data.program} />
        </div>
        <div className="lg:col-span-3">
          <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
            Estructura
          </h2>
          <StructureEditor programId={id} phases={data.phases} />
        </div>
      </div>
    </div>
  );
}
