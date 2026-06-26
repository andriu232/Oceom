import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-ocean-cyan text-[var(--primary-foreground)] font-semibold shadow-[0_0_24px_-6px_var(--ocean-cyan)] hover:shadow-[0_0_36px_-4px_var(--ocean-cyan)] hover:brightness-110",
        glass:
          "glass text-foreground hover:border-[var(--ocean-cyan)] hover:text-ocean-cyan",
        ghost: "text-muted hover:text-foreground hover:bg-white/5",
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
