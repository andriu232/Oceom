import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[20px] text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "text-[var(--primary-foreground)] font-semibold ring-1 ring-inset ring-white/35 bg-[linear-gradient(135deg,#7df0e2_0%,#22d3ee_48%,#13b3c4_100%)] shadow-[0_0_28px_-8px_rgba(34,211,238,0.75),inset_0_1px_0_rgba(255,255,255,0.5)] hover:-translate-y-0.5 hover:shadow-[0_0_44px_-6px_rgba(34,211,238,0.9)]",
        glass:
          "text-foreground backdrop-blur-md border border-transparent [background:linear-gradient(rgba(10,17,36,0.72),rgba(10,17,36,0.72))_padding-box,linear-gradient(135deg,rgba(34,211,238,0.6),rgba(129,140,248,0.5))_border-box] hover:-translate-y-0.5 hover:text-ocean-cyan",
        ghost: "text-muted hover:text-foreground hover:bg-white/5 rounded-2xl",
        danger: "bg-danger/90 text-white hover:bg-danger",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-11 px-5",
        lg: "h-12 px-7 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}

export { buttonVariants };
