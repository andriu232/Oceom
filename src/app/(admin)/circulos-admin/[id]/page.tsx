import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCircle } from "@/lib/queries/circles";
import { deleteCircleAction } from "@/lib/actions/circles";
import { CircleForm } from "@/components/admin/circle-form";

export const dynamic = "force-dynamic";

export default async function EditCirclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireRole("mentor", "super_admin");

  const circle = await getCircle(id);
  if (!circle) notFound();

  const supabase = await createClient();
  const { data: programs } = await supabase
    .from("programs")
    .select("id,title")
    .eq("status", "published")
    .order("created_at");

  return (
    <div className="space-y-6">
      <Link
        href="/circulos-admin"
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ocean-cyan"
      >
        <ArrowLeft className="size-4" /> Volver a Círculos
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Editar círculo
        </h1>
        <form action={deleteCircleAction.bind(null, id)}>
          <button className="inline-flex items-center gap-2 rounded-xl border border-card-border px-4 py-2 text-sm text-muted transition hover:border-danger/40 hover:bg-danger/10 hover:text-danger">
            <Trash2 className="size-4" /> Eliminar
          </button>
        </form>
      </div>

      <CircleForm circle={circle} programs={programs ?? []} />
    </div>
  );
}
