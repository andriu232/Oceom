import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { site } from "@/config/site";

export const metadata = { title: "Bienvenida · OCEOM" };

export default function OnboardingPage() {
  return (
    <div className="text-center">
      <h1 className="font-display text-3xl font-bold text-foreground">
        Tu océano interior despierta
      </h1>
      <p className="mt-4 text-muted">
        Has abierto tu portal en {site.name}. Si creaste tu cuenta con confirmación
        por correo, revisa tu bandeja para activarla. Luego entra y comienza tu ruta.
      </p>
      <Link href="/santuario" className={buttonVariants({ size: "lg", className: "mt-8" })}>
        Entrar al Santuario
      </Link>
    </div>
  );
}
