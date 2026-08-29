import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { BiocodeExplorer } from "@/components/biocode/biocode-explorer";

/* MAPA BIOCODE — en construcción. Vive en el área de mentora mientras se
   monta: cuando esté listo se mueve a (estudiante) y vuelve al menú de
   estudiantes en `studentGroups`. */

export const dynamic = "force-dynamic";
export const metadata = { title: "Mapa BIOCODE · OCEOM" };

export default async function BiocodePage() {
  const profile = await requireRole("mentor", "super_admin");
  const firstName = (profile.full_name ?? "").trim().split(" ")[0] || "Valeria";

  return (
    <div>
      <PageHeader
        title="Mapa BIOCODE"
        subtitle="El mapa inteligente del mundo interior. En construcción — solo visible para ti."
      />
      <BiocodeExplorer firstName={firstName} />
    </div>
  );
}
