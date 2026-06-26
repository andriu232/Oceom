import { Library } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata = { title: "Programas · OCEOM" };

export default function ProgramasPage() {
  return (
    <ComingSoon
      title="Programas"
      subtitle="El CMS de tus rutas y experiencias."
      icon={Library}
      sprint="Sprint 2 / 3"
      description="Crearás y editarás programas, fases, módulos y experiencias; subirás videos, audios y PDFs; y publicarás o despublicarás contenido."
    />
  );
}
