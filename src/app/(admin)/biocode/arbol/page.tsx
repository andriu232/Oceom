import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { getArbol } from "@/lib/actions/arbol";
import { ArbolPanel } from "@/components/biocode/arbol-panel";

/* MI ÁRBOL BIOCODE (§14) y las coincidencias para explorar (§15). */

export const dynamic = "force-dynamic";
export const metadata = { title: "Mi Árbol BIOCODE · OCEOM" };

export default async function ArbolPage() {
  await requireRole("mentor", "super_admin");
  const datos = await getArbol();

  return (
    <div>
      <PageHeader
        title="Mi Árbol BIOCODE"
        subtitle="Cuatro generaciones. Lo que se repite se observa, no se afirma."
      />
      <Link
        href="/biocode"
        className="mb-6 inline-flex items-center gap-1.5 rounded-xl border border-card-border bg-ocean-surface/60 px-3 py-1.5 text-xs text-foreground/85 transition hover:text-ocean-violet"
      >
        <ArrowLeft className="size-3.5" /> Volver a explorar
      </Link>
      <ArbolPanel datos={datos} />
    </div>
  );
}
