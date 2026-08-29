import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { getMiMapa } from "@/lib/biocode/mi-mapa";
import { MiMapaPanel } from "@/components/biocode/mi-mapa-panel";

/* MI MAPA BIOCODE (§16), el historial (§21) y el control de datos (§26) del
   manual de experiencia. Vive junto a BIOCODE en el área de mentora mientras
   la herramienta está en construcción. */

export const dynamic = "force-dynamic";
export const metadata = { title: "Mi Mapa BIOCODE · OCEOM" };

export default async function MiMapaPage() {
  await requireRole("mentor", "super_admin");
  const datos = await getMiMapa();

  return (
    <div>
      <PageHeader
        title="Mi Mapa BIOCODE"
        subtitle="Lo que has explorado, lo que se repite y lo que decidiste guardar."
      />
      <Link
        href="/biocode"
        className="mb-6 inline-flex items-center gap-1.5 rounded-xl border border-card-border bg-ocean-surface/60 px-3 py-1.5 text-xs text-foreground/85 transition hover:text-ocean-violet"
      >
        <ArrowLeft className="size-3.5" /> Volver a explorar
      </Link>
      <MiMapaPanel datos={datos} />
    </div>
  );
}
