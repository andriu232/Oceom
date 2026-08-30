import Link from "next/link";
import { Map, TreeDeciduous } from "lucide-react";
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
      {/* Los dos accesos van arriba y con cuerpo: antes eran dos enlaces
          pequeños al final de la página y nadie los encontraba. */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        <Link
          href="/biocode/mi-mapa"
          className="glass group flex items-center gap-4 rounded-2xl p-4 transition hover:border-ocean-violet/40"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-ocean-violet/12 text-ocean-violet transition group-hover:bg-ocean-violet/20">
            <Map className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block font-medium text-foreground">Mi Mapa BIOCODE</span>
            <span className="block text-xs leading-relaxed text-muted">
              Lo que has explorado y lo que se te repite
            </span>
          </span>
        </Link>
        <Link
          href="/biocode/arbol"
          className="glass group flex items-center gap-4 rounded-2xl p-4 transition hover:border-ocean-violet/40"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-ocean-glow/12 text-ocean-glow transition group-hover:bg-ocean-glow/20">
            <TreeDeciduous className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block font-medium text-foreground">Mi Árbol BIOCODE</span>
            <span className="block text-xs leading-relaxed text-muted">
              Cuatro generaciones y lo que coincide entre ellas
            </span>
          </span>
        </Link>
      </div>

      <BiocodeExplorer firstName={firstName} />
    </div>
  );
}
