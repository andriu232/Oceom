import { ShoppingBag } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata = { title: "Tienda · OCEOM" };

export default function TiendaPage() {
  return (
    <ComingSoon
      title="Tienda"
      subtitle="Programas, sesiones y experiencias adicionales."
      icon={ShoppingBag}
      sprint="Sprint 14"
      description="Adquiere programas, sesiones 1:1, packs de Deep Waves y experiencias especiales. Pagos con Stripe/Wompi."
    />
  );
}
