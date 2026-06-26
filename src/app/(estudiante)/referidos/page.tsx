import { Gift } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata = { title: "Referidos · OCEOM" };

export default function ReferidosPage() {
  return (
    <ComingSoon
      title="Referidos"
      subtitle="Comparte el océano. Crece tu comunidad y gana beneficios."
      icon={Gift}
      sprint="Sprint 15"
      description="Tu enlace único de invitación, seguimiento de personas que se unen gracias a ti, y recompensas por cada referido que inicia su proceso."
    />
  );
}
