import Link from "next/link";
import { BookOpenText, MoonStar } from "lucide-react";
import { cn } from "@/lib/utils";

/** Selector de cuaderno dentro de la Bitácora: el diario interior (raíz) y el
 *  Diario de sueños (/bitacora/suenos). Server-safe (solo links). */
export function NotebookTabs({ active }: { active: "bitacora" | "suenos" }) {
  const base =
    "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors";
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/bitacora"
        className={cn(
          base,
          active === "bitacora"
            ? "border-ocean-cyan/40 bg-ocean-cyan/10 text-ocean-cyan"
            : "border-card-border text-muted hover:text-foreground",
        )}
      >
        <BookOpenText className="size-4" /> Bitácora Interior
      </Link>
      <Link
        href="/bitacora/suenos"
        className={cn(
          base,
          active === "suenos"
            ? "border-ocean-violet/40 bg-ocean-violet/10 text-ocean-violet"
            : "border-card-border text-muted hover:text-foreground",
        )}
      >
        <MoonStar className="size-4" /> Diario de sueños
      </Link>
    </div>
  );
}
