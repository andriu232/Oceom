"use client";

import { useTransition } from "react";
import { Shield, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { setViewMode } from "@/lib/actions/mode";
import type { ViewMode } from "@/lib/auth/mode";

/** Selector premium para que mentora/super admin alterne entre administrar y
 *  previsualizar como estudiante. Indicador deslizante con glow oceánico. */
export function ModeSwitcher({ mode }: { mode: ViewMode }) {
  const [pending, start] = useTransition();
  const studentActive = mode === "student";

  const seg = (target: ViewMode, label: string, Icon: typeof Shield) => {
    const active = mode === target;
    return (
      <button
        onClick={() => !active && start(() => setViewMode(target))}
        disabled={pending}
        className={cn(
          "relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-colors duration-300",
          active ? "text-[#04121a]" : "text-muted hover:text-foreground",
        )}
      >
        <Icon className="size-3.5" />
        {label}
      </button>
    );
  };

  return (
    <div>
      <p className="mb-2 px-1 text-[0.55rem] font-semibold uppercase tracking-[0.22em] text-muted/50">
        Modo de vista
      </p>
      <div className="relative flex rounded-2xl border border-card-border bg-ocean-surface/50 p-1 backdrop-blur-md">
        {/* Indicador deslizante */}
        <span
          aria-hidden
          className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            transform: studentActive ? "translateX(100%)" : "translateX(0)",
            background: "linear-gradient(135deg, #7df0e2, #22d3ee 55%, #13b3c4)",
            boxShadow: "0 0 18px -4px rgba(34,211,238,0.8), inset 0 1px 0 rgba(255,255,255,0.4)",
          }}
        />
        {seg("admin", "Mentora", Shield)}
        {seg("student", "Estudiante", Compass)}
      </div>
    </div>
  );
}
