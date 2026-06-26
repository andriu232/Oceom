"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import {
  LogOut,
  Menu,
  X,
  Waves,
  Compass,
  Route,
  Sparkles,
  BookOpenText,
  Map,
  Radio,
  Users,
  TrendingUp,
  CircleUser,
  LayoutDashboard,
  GraduationCap,
  Library,
  ClipboardCheck,
  BarChart3,
  Settings,
  Milestone,
  Wrench,
  ShoppingBag,
  CreditCard,
  Gift,
  AudioLines,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { signOutAction } from "@/lib/actions/auth";
import type { IconName, NavGroup } from "@/config/navigation";

/** Resuelve la clave de ícono (string serializable) al componente Lucide. */
const ICONS: Record<IconName, LucideIcon> = {
  waves: Waves,
  compass: Compass,
  route: Route,
  sparkles: Sparkles,
  book: BookOpenText,
  map: Map,
  radio: Radio,
  audio: AudioLines,
  users: Users,
  trending: TrendingUp,
  user: CircleUser,
  dashboard: LayoutDashboard,
  students: GraduationCap,
  academia: GraduationCap,
  roadmap: Milestone,
  tools: Wrench,
  store: ShoppingBag,
  membership: CreditCard,
  gift: Gift,
  library: Library,
  clipboard: ClipboardCheck,
  chart: BarChart3,
  settings: Settings,
};

export function AppSidebar({
  groups,
  userName,
  roleLabel,
}: {
  groups: NavGroup[];
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
          className="grid size-10 place-items-center rounded-xl text-foreground transition-colors hover:bg-white/5"
          aria-label="Menú"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <aside
        className={cn(
          "glass-strong fixed inset-y-0 left-0 z-30 flex w-72 flex-col px-4 py-6 transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Borde derecho iluminado */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-px [animation:breathe_6s_ease-in-out_infinite]"
          style={{
            background:
              "linear-gradient(180deg, transparent, rgba(94,234,212,0.5), transparent)",
          }}
        />

        {/* Logo con presencia */}
        <div className="relative px-3 pb-2">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-6 -top-6 size-24 rounded-full opacity-40 blur-2xl"
            style={{ background: "radial-gradient(circle, rgba(34,211,238,0.5), transparent 70%)" }}
          />
          <Link href="/" onClick={() => setOpen(false)} className="relative">
            <Logo />
          </Link>
        </div>

        {/* Navegación agrupada */}
        <nav className="mt-6 flex-1 space-y-5 overflow-y-auto pr-1">
          {groups.map((group) => (
            <div key={group.label}>
              {group.label && (
                <p className="mb-1.5 px-3 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-muted/50">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  const Icon = ICONS[item.icon];
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                        active
                          ? "text-ocean-cyan"
                          : "text-muted hover:bg-white/5 hover:text-foreground",
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="nav-active"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                          className="absolute inset-0 rounded-xl border border-ocean-cyan/25 bg-ocean-cyan/10"
                        />
                      )}
                      {active && (
                        <span
                          aria-hidden
                          className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-ocean-cyan shadow-[0_0_12px_2px_rgba(34,211,238,0.7)]"
                        />
                      )}
                      <Icon
                        className={cn(
                          "relative size-[18px] shrink-0 transition-transform group-hover:scale-110",
                          active && "drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]",
                        )}
                      />
                      <span className="relative flex-1">{item.label}</span>
                      {item.hint && (
                        <span className="relative text-[0.6rem] uppercase tracking-wide text-muted/60">
                          {item.hint}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Tarjeta de usuario premium */}
        <div className="mt-4">
          <div className="rounded-2xl border border-card-border bg-ocean-surface/40 p-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-ocean-glow to-ocean-violet opacity-70 blur-[3px]" />
                <div className="relative grid size-10 place-items-center rounded-full bg-gradient-to-br from-ocean-glow to-ocean-violet text-sm font-semibold text-[var(--ocean-abyss)]">
                  {userName.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {userName}
                </p>
                <span className="mt-0.5 inline-block rounded-full bg-ocean-cyan/12 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-ocean-cyan">
                  {roleLabel}
                </span>
              </div>
            </div>
            <form action={signOutAction}>
              <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-card-border py-2 text-sm text-muted transition-colors hover:border-danger/40 hover:bg-danger/10 hover:text-danger">
                <LogOut className="size-4" />
                Salir
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Overlay móvil */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
