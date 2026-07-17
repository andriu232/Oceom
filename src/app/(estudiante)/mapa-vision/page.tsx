import { requireStudentArea } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { VisionBoard } from "@/components/vision/vision-board";
import { VisionCollage } from "@/components/vision/vision-collage";
import { getVisionBoard, getVisionImages } from "@/lib/queries/vision";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mapa de Visión · OCEOM" };

export default async function MapaVisionPage() {
  const profile = await requireStudentArea();
  const [board, images] = await Promise.all([
    getVisionBoard(profile.id),
    getVisionImages(profile.id),
  ]);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Mapa de Visión"
        subtitle="Tu tablero de visión: sube imágenes que representan tus metas y míralas como un collage vivo. Debajo, escribe tu visión y las metas de cada dimensión."
      />

      <VisionCollage images={images} />

      <section className="space-y-6 border-t border-card-border/60 pt-8">
        <VisionBoard board={board} />
      </section>

      <p className="text-center text-sm text-muted/70">
        Tu mapa se guarda automáticamente. Vuelve cuando quieras a revisarlo, marcar metas cumplidas
        y expandir tu visión.
      </p>
    </div>
  );
}
