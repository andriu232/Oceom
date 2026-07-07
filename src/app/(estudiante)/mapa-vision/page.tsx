import { requireStudentArea } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { VisionBoard } from "@/components/vision/vision-board";
import { getVisionBoard } from "@/lib/queries/vision";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mapa de Visión · OCEOM" };

export default async function MapaVisionPage() {
  const profile = await requireStudentArea();
  const board = await getVisionBoard(profile.id);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Mapa de Visión"
        subtitle="Cinco dimensiones que integran tu evolución. Escribe tu visión, tus afirmaciones y las metas que te acercan a tu mejor versión."
      />

      <VisionBoard board={board} />

      <p className="text-center text-sm text-muted/70">
        Tu mapa se guarda automáticamente. Vuelve cuando quieras a revisarlo, marcar metas cumplidas
        y expandir tu visión.
      </p>
    </div>
  );
}
