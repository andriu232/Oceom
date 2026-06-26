import { Map } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata = { title: "Mapa de Visión · OCEOM" };

export default function MapaVisionPage() {
  return (
    <ComingSoon
      title="Mapa de Visión"
      subtitle="Construye tu visión por áreas de vida."
      icon={Map}
      sprint="Sprint 10"
      description="Crearás tu visión en áreas como cuerpo, relaciones, abundancia y propósito, con imágenes, afirmaciones, metas y acciones."
    />
  );
}
