import Link from "next/link";
import { OceanBackground } from "@/components/brand/ocean-background";
import { GlowOrb } from "@/components/brand/glow-orb";
import { Logo } from "@/components/brand/logo";
import { site } from "@/config/site";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative grid min-h-dvh lg:grid-cols-2">
      <OceanBackground />

      {/* Panel emocional (izquierda en desktop) */}
      <div className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
        <GlowOrb className="absolute -right-20 top-1/3 size-96" />
        <Link href="/">
          <Logo />
        </Link>
        <div className="relative max-w-md">
          <h2 className="font-display text-4xl font-bold leading-tight text-foreground">
            {site.claim}
          </h2>
          <p className="mt-4 text-lg text-muted">{site.tagline}</p>
        </div>
        <p className="relative text-xs text-muted/70">
          Método E-MOTION® · {site.creator}
        </p>
      </div>

      {/* Formulario */}
      <div className="relative flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
