import { Settings } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata = { title: "Ajustes · OCEOM" };

export default function AjustesPage() {
  return (
    <ComingSoon
      title="Ajustes"
      subtitle="Preferencias de tu cuenta y experiencia."
      icon={Settings}
      sprint="Sprint 6"
      description="Configura tus datos, notificaciones, privacidad, idioma y preferencias de tu experiencia en OCEOM."
    />
  );
}
