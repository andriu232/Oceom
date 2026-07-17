import { Orbit } from "lucide-react";
import { requireStudentArea } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { GaleriaAstral, type AstralItemData } from "@/components/galeria/galeria-astral";

export const dynamic = "force-dynamic";
export const metadata = { title: "Galería Astral · OCEOM" };

export default async function GaleriaPage() {
  await requireStudentArea();
  const supabase = await createClient();
  const { data } = await supabase
    .from("astral_items")
    .select("id,kind,title,description,content,file_url")
    .order("created_at", { ascending: false })
    .limit(40);
  const items = (data ?? []) as AstralItemData[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Galería Astral"
        subtitle="Un recorrido inmersivo por las fotos y poemas que tu mentora eligió para ti. Desliza para orbitar; toca para acercarte."
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Orbit}
          title="La galería aún está vacía"
          description="Tu mentora está eligiendo fotos y poemas para este espacio. Vuelve pronto."
        />
      ) : (
        <GaleriaAstral items={items} />
      )}
    </div>
  );
}
