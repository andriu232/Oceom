import { Wrench } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata = { title: "Mis Herramientas · OCEOM" };

export default function HerramientasPage() {
  return (
    <ComingSoon
      title="Mis Herramientas"
      subtitle="Tu caja de recursos para el camino interior."
      icon={Wrench}
      sprint="Sprint 4"
      description="Plantillas, ejercicios descargables, guías y prácticas que tu mentora pondrá a tu disposición para integrar cada experiencia."
    />
  );
}
