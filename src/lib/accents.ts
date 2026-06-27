/* Acentos de color por módulo OCEOM. HEX literal (sin oklch) para usarse en
   gradientes y glows inline. Cada acento es un par de luz océanica. */

export type Accent =
  | "cyan"
  | "turquoise"
  | "magenta"
  | "violet"
  | "blue"
  | "gold"
  | "rose"
  | "green";

export interface AccentTone {
  /** Tono principal. */
  hex: string;
  /** Segundo tono para el gradiente. */
  hex2: string;
  /** Clase de texto Tailwind (literal, para el scanner). */
  text: string;
}

export const ACCENT: Record<Accent, AccentTone> = {
  cyan: { hex: "#22d3ee", hex2: "#5eead4", text: "text-ocean-cyan" },
  turquoise: { hex: "#2dd4bf", hex2: "#5eead4", text: "text-oceom-turquoise" },
  magenta: { hex: "#e879f9", hex2: "#818cf8", text: "text-oceom-magenta" },
  violet: { hex: "#818cf8", hex2: "#a78bfa", text: "text-ocean-violet" },
  blue: { hex: "#38bdf8", hex2: "#6366f1", text: "text-oceom-blue" },
  gold: { hex: "#f5c451", hex2: "#fb7185", text: "text-oceom-gold" },
  rose: { hex: "#fb7185", hex2: "#f5c451", text: "text-[#fb7185]" },
  green: { hex: "#34d399", hex2: "#5eead4", text: "text-oceom-green" },
};
