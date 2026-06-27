import { Sparkles } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata = { title: "Biblioteca IA · OCEOM" };

export default function BibliotecaIaPage() {
  return (
    <ComingSoon
      title="Biblioteca IA"
      subtitle="El conocimiento que alimenta a OMI."
      icon={Sparkles}
      sprint="Sprint 9"
      description="Subirás transcripciones, notas, ejercicios y protocolos propios. OMI responderá solo con fuentes autorizadas que actives aquí."
    />
  );
}
