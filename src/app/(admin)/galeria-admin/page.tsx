import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { GaleriaManager, type AstralRow } from "@/components/admin/galeria-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Galería Astral · OCEOM" };

export default async function GaleriaAdminPage() {
  await requireRole("mentor", "super_admin");
  const supabase = await createClient();
  const { data } = await supabase
    .from("astral_items")
    .select("id,kind,title,description,file_url,is_published,created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Galería Astral"
        subtitle="Fotos y poemas que tus estudiantes recorren en una galería 3D inmersiva."
      />
      <GaleriaManager items={(data ?? []) as AstralRow[]} />
    </div>
  );
}
