import { BookOpenText } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata = { title: "Bitácora Interior · OCEOM" };

export default function BitacoraPage() {
  return (
    <ComingSoon
      title="Bitácora Interior"
      subtitle="Tu espacio privado de escritura y check-in emocional."
      icon={BookOpenText}
      sprint="Sprint 10"
      description="Escribirás entradas, asociarás emociones e intensidad, marcarás insights y verás tu evolución emocional en el tiempo."
    />
  );
}
