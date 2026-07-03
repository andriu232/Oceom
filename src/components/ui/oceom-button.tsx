import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* ============================================================
   OceomButton — botones con identidad OCEOM.
   • primary: activar un portal (gradiente cyan/turquesa, borde
     luminoso, glow externo, highlight superior, sheen en hover).
   • glass: cristal de agua (glassmorphism + borde gradiente
     cyan/violeta + shimmer sutil).
   • ghost: mínimo.
   Polimórfico: con `href` renderiza Link; si no, <button>.
   ============================================================ */

type Variant = "primary" | "glass" | "ghost";
type Size = "sm" | "md" | "lg" | "icon";

const BASE =
  "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-[20px] font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:size-4 [&_svg]:shrink-0";

const VARIANT: Record<Variant, string> = {
  primary: cn(
    "text-[#04121a] font-semibold ring-1 ring-inset ring-white/35",
    "bg-[linear-gradient(135deg,#7df0e2_0%,#22d3ee_48%,#13b3c4_100%)]",
    "shadow-[0_0_30px_-8px_rgba(34,211,238,0.75),inset_0_1px_0_rgba(255,255,255,0.5)]",
    "hover:-translate-y-0.5 hover:shadow-[0_0_46px_-6px_rgba(34,211,238,0.9)]",
  ),
  glass: cn(
    "text-foreground backdrop-blur-md border border-transparent",
    "[background:linear-gradient(var(--btn-glass),var(--btn-glass))_padding-box,linear-gradient(135deg,rgba(34,211,238,0.6),rgba(129,140,248,0.5))_border-box]",
    "shadow-[var(--shadow-glass)] hover:-translate-y-0.5 hover:text-ocean-cyan",
  ),
  ghost: "text-muted hover:text-foreground hover:bg-white/5 rounded-2xl",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-7 text-base",
  icon: "size-11",
};

function Decor({ variant }: { variant: Variant }) {
  if (variant === "ghost") return null;
  return (
    <>
      {variant === "primary" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent opacity-70"
        />
      )}
      {/* Sheen diagonal que cruza en hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-white/25 blur-md opacity-0 group-hover:opacity-100 group-hover:[animation:sheen_0.9s_ease]"
      />
    </>
  );
}

interface OceomButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  href?: string;
}

export function OceomButton({
  variant = "primary",
  size = "md",
  href,
  className,
  children,
  ...rest
}: OceomButtonProps) {
  const classes = cn(BASE, VARIANT[variant], SIZE[size], className);
  const inner = (
    <>
      <Decor variant={variant} />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {inner}
      </Link>
    );
  }
  return (
    <button className={classes} {...rest}>
      {inner}
    </button>
  );
}

/** Botón-ícono cuadrado (glass por defecto). */
export function OceomIconButton({
  variant = "glass",
  className,
  ...rest
}: OceomButtonProps) {
  return (
    <OceomButton variant={variant} size="icon" className={cn("rounded-2xl", className)} {...rest} />
  );
}
