import { GraduationCap } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata = { title: "Estudiantes · OCEOM" };

export default function EstudiantesPage() {
  return (
    <ComingSoon
      title="Estudiantes"
      subtitle="Tu CRM de acompañamiento."
      icon={GraduationCap}
      sprint="Sprint 6"
      description="Lista, filtros y perfil individual: progreso, tareas, asistencia, estado emocional, notas privadas y control de acceso."
    />
  );
}
