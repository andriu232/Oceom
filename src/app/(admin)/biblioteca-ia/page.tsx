import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import {
  BibliotecaManager,
  type DocRow,
} from "@/components/admin/biblioteca-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Biblioteca IA · OCEOM" };

export default async function BibliotecaIaPage() {
  await requireRole("mentor", "super_admin");
  const supabase = await createClient();
  const { data } = await supabase
    .from("omi_documents")
    .select(
      "id,title,source_type,file_name,char_count,chunk_count,status,is_active,created_at",
    )
    .order("created_at", { ascending: false });

  const docs = (data ?? []) as DocRow[];
  const stats = {
    total: docs.length,
    active: docs.filter((d) => d.is_active).length,
    chunks: docs.reduce((s, d) => s + (d.chunk_count || 0), 0),
  };

  return (
    <div>
      <PageHeader
        title="Biblioteca IA"
        subtitle="El conocimiento que alimenta a OMI. Lo que subas aquí, OMI lo usa para acompañar a tus estudiantes."
      />
      <BibliotecaManager docs={docs} stats={stats} />
    </div>
  );
}
