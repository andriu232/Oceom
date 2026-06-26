"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { signOutAction } from "@/lib/actions/auth";
import type { NavItem } from "@/config/navigation";

export function AppSidebar({
  items,
  userName,
  roleLabel,
}: {
  items: NavItem[];
  userName: string;
  roleLabel: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Barra superior móvil */}
      <div className="glass-strong sticky top-0 z-40 flex items-center justify-between px-4 py-3 lg:hidden">
        <Logo showBrand={false} />
        <button
          onClick={() => setOpen((v) => !v)}
          className="grid size-10 place-items-center rounded-xl text-foreground"
          aria-label="Menú"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <aside
        className={cn(
          "glass-strong fixed inset-y-0 left-0 z-30 flex w-72 flex-col px-4 py-6 transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="px-3">
          <Link href="/" onClick={() => setOpen(false)}>
            <Logo />
          </Link>
        </div>

        <nav className="mt-8 flex-1 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-ocean-cyan/12 text-ocean-cyan"
                    : "text-muted hover:bg-white/5 hover:text-foreground",
                )}
              >
                <Icon className="size-[18px] shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.hint && (
                  <span className="text-[0.6rem] uppercase tracking-wide text-muted/60">
                    {item.hint}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 border-t border-card-border pt-4">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-ocean-glow to-ocean-violet text-sm font-semibold text-[var(--ocean-abyss)]">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{userName}</p>
              <p className="text-xs text-muted">{roleLabel}</p>
            </div>
          </div>
          <form action={signOutAction}>
            <button className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-white/5 hover:text-danger">
              <LogOut className="size-[18px]" />
              Salir
            </button>
          </form>
        </div>
      </aside>

      {/* Overlay móvil */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
