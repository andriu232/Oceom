import { CreditCard } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata = { title: "Membresía · OCEOM" };

export default function MembresiaPage() {
  return (
    <ComingSoon
      title="Membresía"
      subtitle="Tu plan y los beneficios de tu acceso a OCEOM."
      icon={CreditCard}
      sprint="Sprint 13"
      description="Gestiona tu plan, accede a beneficios exclusivos del ecosistema y desbloquea contenido premium de forma continua."
    />
  );
}
