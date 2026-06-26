"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  Users,
  Library,
  ClipboardCheck,
  Activity,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  users: Users,
  library: Library,
  clipboard: ClipboardCheck,
  activity: Activity,
};

export interface Metric {
  label: string;
  value: string;
  icon: keyof typeof ICONS | string;
  href: string;
  caption?: string;
}

/** Card de métrica premium: hover-lift, glow interactivo, ícono circular. */
export function MetricCard({ metric, index }: { metric: Metric; index: number }) {
  const Icon = ICONS[metric.icon] ?? Activity;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
    >
      <Link href={metric.href} className="group block">
        <div className="relative overflow-hidden rounded-2xl">
          {/* Glow de borde al hover */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(120% 120% at 50% 0%, rgba(34,211,238,0.18) 0%, transparent 60%)",
            }}
          />
          <div className="glass relative rounded-2xl p-6 transition-shadow duration-500 group-hover:shadow-[0_20px_60px_-20px_rgba(34,211,238,0.45)]">
            <div className="flex items-start justify-between">
              {/* Ícono circular premium */}
              <div className="relative grid size-12 place-items-center rounded-2xl">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-ocean-glow/25 to-ocean-cyan/10 ring-1 ring-inset ring-ocean-cyan/30" />
                <div className="absolute -inset-1 rounded-2xl bg-ocean-cyan/20 opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100" />
                <Icon className="relative size-5 text-ocean-cyan" />
              </div>
              <ArrowUpRight className="size-4 text-muted transition-all duration-300 group-hover:text-ocean-cyan group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </div>

            <p className="mt-5 bg-gradient-to-br from-white to-ocean-foam bg-clip-text font-display text-4xl font-bold tracking-tight text-transparent">
              {metric.value}
            </p>
            <p className="mt-1 text-sm text-muted">{metric.label}</p>
            {metric.caption && (
              <p className="mt-3 text-xs text-ocean-glow/80">{metric.caption}</p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
