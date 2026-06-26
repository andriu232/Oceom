import { Sparkles } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata = { title: "AURA · OCEOM" };

export default function AuraPage() {
  return (
    <ComingSoon
      title="AURA"
      subtitle="Tu guía neuroemocional y energética dentro de OCEOM."
      icon={Sparkles}
      sprint="Sprint 8 / 9"
      description="AURA te acompañará con preguntas, prácticas y reflexiones del método E-MOTION®, usando solo fuentes autorizadas. No reemplaza apoyo terapéutico profesional."
    />
  );
}
