"use client";

import { useTransition } from "react";
import { Shield, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { setViewMode } from "@/lib/actions/mode";
import type { ViewMode } from "@/lib/auth/mode";

/** Toggle para que mentora/super admin alterne entre ver la plataforma como
 *  administradora o previsualizarla como estudiante. */
export function ModeSwitcher({ mode }: { mode: ViewMode }) {
  const [pending, start] = useTransition();

  const seg = (target: ViewMode, label: string, Icon: typeof Shield) => {
    const active = mode === target;
    return (
      <button
        onClick={() => !active && start(() => setViewMode(target))}
        disabled={pending}
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
          active
            ? "bg-ocean-cyan/15 text-ocean-cyan shadow-[0_0_14px_-4px_var(--ocean-cyan)]"
            : "text-muted hover:text-foreground",
        )}
      >
        <Icon className="size-3.5" />
        {label}
      </button>
    );
  };

  return (
    <div>
      <p className="mb-1.5 px-1 text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-muted/50">
        Modo de vista
      </p>
      <div className="flex gap-1 rounded-xl border border-card-border bg-ocean-surface/40 p-1">
        {seg("admin", "Mentora", Shield)}
        {seg("student", "Estudiante", Compass)}
      </div>
    </div>
  );
}
