import Link from "next/link";
import type { CommunitySpace } from "@/lib/community/types";

export function SpacesSidebar({
  spaces,
  currentSlug,
}: {
  spaces: CommunitySpace[];
  currentSlug?: string;
}) {
  return (
    <aside className="glass rounded-2xl p-3">
      <p className="px-2 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted/60">
        Espacios
      </p>
      <nav className="space-y-0.5">
        {spaces.map((s) => {
          const active = currentSlug === s.slug;
          return (
            <Link
              key={s.id}
              href={`/comunidad/${s.slug}`}
              title={s.description ?? undefined}
              className={`flex items-center gap-2.5 rounded-[6px] px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-ocean-cyan/10 text-ocean-cyan"
                  : "text-muted hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{
                  background: s.color_hex ? `#${s.color_hex}` : "var(--muted)",
                }}
              />
              <span className="truncate">{s.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
