import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export const metadata = { title: "Privacidad · OCEOM" };

export default function PrivacidadPage() {
  return (
    <main className="mx-auto flex min-h-[100svh] max-w-2xl flex-col justify-center px-6 py-20">
      <Logo />
      <h1 className="mt-8 font-display text-3xl font-bold text-foreground">
        Política de privacidad
      </h1>
      <p className="mt-5 text-foreground/70">
        Tu proceso es íntimo y así lo tratamos. Tus datos y lo que compartes
        dentro de OCEOM se cuidan con confidencialidad y solo se usan para
        acompañar tu experiencia. Estamos finalizando la versión completa de esta
        política.
      </p>
      <p className="mt-4 text-foreground/70">
        Si quieres saber qué guardamos o pedir la eliminación de tus datos,
        escríbenos a{" "}
        <a
          href="mailto:valeriaruedacaicedo@gmail.com"
          className="text-ocean-cyan hover:underline"
        >
          valeriaruedacaicedo@gmail.com
        </a>
        .
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
