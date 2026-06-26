import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatea un porcentaje 0-100 a string legible. */
export function formatPct(value: number) {
  return `${Math.round(value)}%`;
}
