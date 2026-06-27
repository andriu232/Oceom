import Image from "next/image";
import { cn } from "@/lib/utils";

/** Logo OCEOM: emblema (océano interior) + wordmark con marca madre E-MOTION®. */
export function Logo({
  className,
  showBrand = true,
}: {
  className?: string;
  showBrand?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5 leading-none", className)}>
      <span className="relative inline-grid place-items-center">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full opacity-70 blur-md"
          style={{ background: "radial-gradient(circle, rgba(34,211,238,0.55), transparent 70%)" }}
        />
        <Image
          src="/brand/oceom-mark.png"
          alt="OCEOM"
          width={40}
          height={40}
          priority
          className="relative size-10 rounded-full object-cover ring-1 ring-inset ring-white/15"
        />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-2xl font-bold tracking-[0.18em] text-foreground">
          OCE
          <span className="bg-gradient-to-r from-ocean-glow to-ocean-cyan bg-clip-text text-transparent">
            OM
          </span>
        </span>
        {showBrand && (
          <span className="mt-1 text-[0.6rem] font-medium uppercase tracking-[0.3em] text-muted">
            by E-MOTION®
          </span>
        )}
      </span>
    </div>
  );
}
