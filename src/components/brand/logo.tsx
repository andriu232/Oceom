import { cn } from "@/lib/utils";

/** Wordmark OCEOM con marca madre E-MOTION®. */
export function Logo({
  className,
  showBrand = true,
}: {
  className?: string;
  showBrand?: boolean;
}) {
  return (
    <div className={cn("flex flex-col leading-none", className)}>
      <span className="font-display text-2xl font-bold tracking-[0.2em] text-foreground">
        OCE
        <span className="bg-gradient-to-r from-ocean-glow to-ocean-cyan bg-clip-text text-transparent">
          OM
        </span>
      </span>
      {showBrand && (
        <span className="mt-1 text-[0.6rem] font-medium uppercase tracking-[0.35em] text-muted">
          by E-MOTION®
        </span>
      )}
    </div>
  );
}
