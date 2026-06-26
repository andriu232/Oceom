import { Route } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata = { title: "Mi Ruta · OCEOM" };

export default function MiRutaPage() {
  return (
    <ComingSoon
      title="Mi Ruta"
      subtitle="Tu viaje personalizado a través del método."
      icon={Route}
      sprint="Sprint 2"
      description="Verás tu programa activo organizado en Fase → Módulo → Experiencia, con tu progreso paso a paso."
    />
  );
}
