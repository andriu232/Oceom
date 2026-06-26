import { Settings } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata = { title: "Configuración · OCEOM" };

export default function ConfiguracionPage() {
  return (
    <ComingSoon
      title="Configuración"
      subtitle="Ajustes de la plataforma."
      icon={Settings}
      sprint="Sprint 12"
      description="Integraciones, roles, branding y preferencias globales de OCEOM."
    />
  );
}
