import { cn } from "@/lib/utils";

/** Esfera de luz decorativa (portal). */
export function GlowOrb({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "rounded-full opacity-70 blur-2xl [animation:var(--animate-pulse-glow)]",
        className,
      )}
      style={{
        background:
          "radial-gradient(circle at 35% 30%, var(--ocean-glow) 0%, var(--ocean-cyan) 40%, transparent 72%)",
      }}
    />
  );
}
