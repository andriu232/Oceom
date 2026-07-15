import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { LibraryManager, type LibraryRow } from "@/components/admin/library-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Biblioteca · OCEOM" };

export default async function BibliotecaAdminPage() {
  await requireRole("mentor", "super_admin");
  const supabase = await createClient();
  const { data } = await supabase
    .from("library_items")
    .select("id,title,description,kind,file_name,is_published,created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Biblioteca"
        subtitle="Textos, poemas y lecturas para tus estudiantes. Todo lo publicado aparece en su sección Biblioteca."
      />
      <LibraryManager items={(data ?? []) as LibraryRow[]} />
    </div>
  );
}
