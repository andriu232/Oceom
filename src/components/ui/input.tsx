import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-card-border bg-ocean-surface/60 px-4 text-sm text-foreground placeholder:text-muted/70 outline-none transition-colors focus:border-ocean-cyan focus:ring-2 focus:ring-[var(--ring)]",
        className,
      )}
      {...props}
    />
  );
}
