import { Compass } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata = { title: "Explorar · OCEOM" };

export default function ExplorarPage() {
  return (
    <ComingSoon
      title="Explorar"
      subtitle="Descubre los programas y rutas disponibles en OCEOM."
      icon={Compass}
      sprint="Sprint 2"
      description="Aquí navegarás los programas E-MOTION® y Arquitectura Neuropsíquica, con sus fases y experiencias."
    />
  );
}
