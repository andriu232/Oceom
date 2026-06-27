import { requireStudentArea } from "@/lib/auth";
import { listCatalog } from "@/lib/queries/catalog";
import { PageHeader } from "@/components/shared/page-header";
import { ExploreClient } from "@/components/explorar/explore-client";
import type { ExploreItem } from "@/config/explore";

export const dynamic = "force-dynamic";
export const metadata = { title: "Explorar · OCEOM" };

export default async function ExplorarPage() {
  const profile = await requireStudentArea();
  const catalog = await listCatalog(profile.id);

  // Programas reales → items de Explorar (categoría/color por tipo de programa).
  const programs: ExploreItem[] = catalog.map((p) => {
    const neuro = p.type === "neuropsychic";
    return {
      id: p.id,
      title: p.title,
      blurb: p.subtitle ?? p.description ?? "Programa del ecosistema OCEOM.",
      kind: "Cursos",
      category: neuro ? "conciencia" : "bienestar",
      color: neuro ? "cyan" : "magenta",
      meta: `${p.lessons} experiencias`,
      href: p.enrolled ? "/mi-ruta" : "/academia",
      status: "live",
      enrolled: p.enrolled,
    };
  });

  return (
    <div>
      <PageHeader
        title="Explorar"
        subtitle="Descubre experiencias, cursos, meditaciones y talleres por categoría."
      />
      <ExploreClient programs={programs} />
    </div>
  );
}
