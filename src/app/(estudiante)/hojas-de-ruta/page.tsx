import { Milestone } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata = { title: "Hojas de Ruta · OCEOM" };

export default function HojasDeRutaPage() {
  return (
    <ComingSoon
      title="Hojas de Ruta"
      subtitle="Itinerarios guiados por etapas hacia un objetivo de transformación."
      icon={Milestone}
      sprint="próximo sprint"
      description="Recorridos por etapas que combinan experiencias, prácticas y retos para llevarte de un punto A a un punto B en tu proceso."
    />
  );
}
