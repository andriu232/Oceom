import {
  Waves,
  Shell,
  Orbit,
  Fish,
  Moon,
  Heart,
  Eye,
  Infinity as InfinityIcon,
  type LucideIcon,
} from "lucide-react";
import type { JourneyColor, BadgeKey } from "@/config/journey";

/** Clases Tailwind por color de viaje (literales para que el scanner las vea). */
export const JOURNEY_COLOR: Record<
  JourneyColor,
  { text: string; bg: string; ring: string; bar: string; hex: string }
> = {
  turquoise: { text: "text-oceom-turquoise", bg: "bg-oceom-turquoise/12", ring: "ring-oceom-turquoise/30", bar: "from-oceom-turquoise", hex: "#2dd4bf" },
  green: { text: "text-oceom-green", bg: "bg-oceom-green/12", ring: "ring-oceom-green/30", bar: "from-oceom-green", hex: "#34d399" },
  cyan: { text: "text-ocean-cyan", bg: "bg-ocean-cyan/12", ring: "ring-ocean-cyan/30", bar: "from-ocean-cyan", hex: "#22d3ee" },
  blue: { text: "text-oceom-blue", bg: "bg-oceom-blue/12", ring: "ring-oceom-blue/30", bar: "from-oceom-blue", hex: "#38bdf8" },
  violet: { text: "text-ocean-violet", bg: "bg-ocean-violet/12", ring: "ring-ocean-violet/30", bar: "from-ocean-violet", hex: "#818cf8" },
  magenta: { text: "text-oceom-magenta", bg: "bg-oceom-magenta/12", ring: "ring-oceom-magenta/30", bar: "from-oceom-magenta", hex: "#e879f9" },
  gold: { text: "text-oceom-gold", bg: "bg-oceom-gold/12", ring: "ring-oceom-gold/30", bar: "from-oceom-gold", hex: "#f5c451" },
};

/** Ícono Lucide por símbolo de evolución. */
export const BADGE_ICON: Record<BadgeKey, LucideIcon> = {
  ola: Waves,
  concha: Shell,
  espiral: Orbit,
  ballena: Fish,
  luna: Moon,
  corazon: Heart,
  ojo: Eye,
  infinito: InfinityIcon,
};
