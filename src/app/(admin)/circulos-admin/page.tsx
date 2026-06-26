import { Radio } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata = { title: "Círculos · OCEOM" };

export default function CirculosAdminPage() {
  return (
    <ComingSoon
      title="Círculos en Vivo"
      subtitle="Programa y gestiona tus sesiones."
      icon={Radio}
      sprint="Sprint 7"
      description="Crearás sesiones con fecha, programa y link de acceso, registrarás asistencia y subirás grabaciones."
    />
  );
}
