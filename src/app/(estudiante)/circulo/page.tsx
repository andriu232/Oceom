import { Users } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata = { title: "Círculo · OCEOM" };

export default function CirculoPage() {
  return (
    <ComingSoon
      title="Círculo"
      subtitle="La comunidad consciente de tu programa."
      icon={Users}
      sprint="Sprint 11"
      description="Compartirás y leerás publicaciones de estudiantes de tus programas y cohortes, en un espacio seguro y privado."
    />
  );
}
