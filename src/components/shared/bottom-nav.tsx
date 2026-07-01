"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { ICONS } from "@/components/shared/nav-icons";
import type { NavGroup } from "@/config/navigation";

/* ============================================================
   BottomNav — barra inferior estilo app para móvil. Muestra los
   destinos marcados como `primary` en la navegación. Solo visible
   en pantallas < lg (en desktop manda el sidebar). Complementa al
   drawer con hamburguesa (que sigue dando acceso a TODO el menú).
   ============================================================ */

export function BottomNav({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  const items = groups
    .flatMap((g) => g.items)
    .filter((i) => i.primary)
    .slice(0, 5);

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Navegación principal"
      className="glass-strong fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around gap-1 border-t border-card-border px-1 pt-1 lg:hidden"
      style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
    >
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = ICONS[item.icon];
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[0.62rem] font-medium transition-colors",
              active ? "text-ocean-cyan" : "text-muted hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="bottomnav-active"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="absolute inset-x-1.5 inset-y-0.5 rounded-xl border border-ocean-cyan/25 bg-ocean-cyan/10"
              />
            )}
            <Icon
              className={cn(
                "relative size-5 shrink-0 transition-transform group-active:scale-90",
                active && "drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]",
              )}
            />
            <span className="relative max-w-full truncate">
              {item.short ?? item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
