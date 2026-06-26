import { Radio } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata = { title: "Deep Waves · OCEOM" };

export default function DeepWavesPage() {
  return (
    <ComingSoon
      title="Deep Waves"
      subtitle="Biblioteca sonora de meditaciones, hipnosis y respiraciones."
      icon={Radio}
      sprint="Sprint 5 / 10"
      description="Un reproductor premium con viajes sonoros, mantrams y regulación emocional recomendados según tu estado."
    />
  );
}
