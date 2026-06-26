import { Users } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata = { title: "Círculos en Vivo · OCEOM" };

export default function CirculosPage() {
  return (
    <ComingSoon
      title="Círculos en Vivo"
      subtitle="Tus sesiones en vivo y grabaciones."
      icon={Users}
      sprint="Sprint 7"
      description="Verás las próximas sesiones, entrarás al círculo con un clic y accederás a grabaciones y recursos posteriores."
    />
  );
}
