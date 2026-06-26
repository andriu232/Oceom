import { ClipboardCheck } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata = { title: "Entregas · OCEOM" };

export default function EntregasPage() {
  return (
    <ComingSoon
      title="Entregas"
      subtitle="Revisión de integraciones y tareas."
      icon={ClipboardCheck}
      sprint="Sprint 4"
      description="Revisarás las entregas de tus estudiantes, darás feedback privado y marcarás integraciones como revisadas."
    />
  );
}
