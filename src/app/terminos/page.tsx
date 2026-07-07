import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { site } from "@/config/site";

export const metadata = { title: "Términos · OCEOM" };

export default function TerminosPage() {
  return (
    <main className="mx-auto flex min-h-[100svh] max-w-2xl flex-col justify-center px-6 py-20">
      <Logo />
      <h1 className="mt-8 font-display text-3xl font-bold text-foreground">
        Términos de servicio
      </h1>
      <p className="mt-5 text-foreground/70">
        Estamos finalizando la versión completa de nuestros términos de servicio.
        Mientras tanto, si tienes cualquier duda sobre el uso de OCEOM o el
        acompañamiento del método {site.brand}, escríbenos y con gusto te
        respondemos.
      </p>
      <p className="mt-4 text-foreground/70">
        Contacto:{" "}
        <a
          href="mailto:valeriaruedacaicedo@gmail.com"
          className="text-ocean-cyan hover:underline"
        >
          valeriaruedacaicedo@gmail.com
        </a>
      </p>
      <Link
        href="/"
        className="mt-10 inline-flex items-center gap-2 text-sm text-ocean-cyan hover:underline"
      >
        <ArrowLeft className="size-4" /> Volver al inicio
      </Link>
    </main>
  );
}
