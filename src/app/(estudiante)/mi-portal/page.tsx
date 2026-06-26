import { CircleUser } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata = { title: "Mi Portal · OCEOM" };

export default function MiPortalPage() {
  return (
    <ComingSoon
      title="Mi Portal"
      subtitle="Tu perfil y preferencias en OCEOM."
      icon={CircleUser}
      sprint="Sprint 6"
      description="Gestionarás tu nombre, avatar, datos de cuenta y preferencias de tu experiencia."
    />
  );
}
