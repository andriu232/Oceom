import { TrendingUp } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata = { title: "Mi Evolución · OCEOM" };

export default function MiEvolucionPage() {
  return (
    <ComingSoon
      title="Mi Evolución"
      subtitle="El mapa de tu progreso y transformación."
      icon={TrendingUp}
      sprint="Sprint 5"
      description="Verás tu avance por programa, fase y módulo, experiencias completadas, audios escuchados y tu evolución emocional."
    />
  );
}
