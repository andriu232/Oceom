import type { LucideIcon } from "lucide-react";
import { GlowOrb } from "@/components/brand/glow-orb";

/** Empty state con copy emocional OCEOM. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="glass relative flex flex-col items-center justify-center overflow-hidden rounded-2xl px-6 py-20 text-center">
      <GlowOrb className="absolute -top-10 size-40" />
      <div className="relative flex flex-col items-center">
        {Icon && (
          <div className="mb-5 grid size-14 place-items-center rounded-2xl border border-card-border bg-ocean-surface/60 text-ocean-cyan">
            <Icon className="size-6" />
          </div>
        )}
        <h3 className="font-display text-xl font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mt-2 max-w-md text-sm text-muted">{description}</p>
        )}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </div>
  );
}
