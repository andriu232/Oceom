import { BarChart3 } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata = { title: "Métricas · OCEOM" };

export default function MetricasPage() {
  return (
    <ComingSoon
      title="Métricas"
      subtitle="La salud de tu mentoría, de un vistazo."
      icon={BarChart3}
      sprint="Sprint 5 / 6"
      description="Estudiantes activos, progreso promedio, entregas, asistencia, uso de AURA y experiencias con mayor abandono."
    />
  );
}
