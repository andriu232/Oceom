/* ============================================================
   OCEOM SHOP — configuración compartida (serializable, server-safe).

   La tienda vende dos mundos a la vez: producto físico que se empaca y se
   envía (suplementos, objetos de ritual) e infoproducto que se entrega solo
   (una descarga, un programa del santuario, una membresía). Casi todo lo que
   sigue existe para que esos dos mundos convivan en un mismo carrito.
   ============================================================ */

import type { ProductKind } from "@/config/store";

export type { ProductKind };

/* ── Intenciones ──────────────────────────────────────────────
   La taxonomía transversal de la tienda: no clasifica por lo que ES el
   producto sino por lo que la persona viene a buscar. Un aceite, un audio y
   una sesión pueden compartir "Calmar", y así se encuentran entre ellos.
   El orden es el que se muestra en los filtros. */
export interface Intention {
  key: string;
  label: string;
  /** Color del chip. HEX literal: oklch se distorsiona (bug de Lightning CSS). */
  color: string;
}

export const INTENTIONS: Intention[] = [
  { key: "calmar", label: "Calmar", color: "#5eead4" },
  { key: "enraizar", label: "Enraizar", color: "#f5c451" },
  { key: "claridad", label: "Claridad mental", color: "#38bdf8" },
  { key: "energia", label: "Energía", color: "#fb923c" },
  { key: "dormir", label: "Descanso", color: "#818cf8" },
  { key: "inmunidad", label: "Defensas", color: "#34d399" },
  { key: "hormonal", label: "Ciclo femenino", color: "#e879f9" },
  { key: "duelo", label: "Duelo", color: "#94a3b8" },
  { key: "abrir-corazon", label: "Abrir el corazón", color: "#fb7185" },
  { key: "practica", label: "Práctica sagrada", color: "#c4b5fd" },
];

export const INTENTION_MAP: Record<string, Intention> = Object.fromEntries(
  INTENTIONS.map((i) => [i.key, i]),
);

/* ── Estado logístico del pedido ──────────────────────────────
   Va aparte del estado del PAGO. Un pedido puede estar pagado y sin
   despachar; esa diferencia es justo la que Valeria necesita ver. */
export type FulfillmentStatus =
  | "none"
  | "pending"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface FulfillmentDef {
  key: FulfillmentStatus;
  label: string;
  /** Lo que ve la compradora (más humano que la etiqueta del panel). */
  publicLabel: string;
  chip: string;
}

export const FULFILLMENT: FulfillmentDef[] = [
  { key: "none", label: "Sin envío", publicLabel: "Entrega digital", chip: "bg-white/5 text-muted" },
  { key: "pending", label: "Por preparar", publicLabel: "Recibido", chip: "bg-oceom-gold/15 text-oceom-gold" },
  { key: "preparing", label: "Preparando", publicLabel: "Preparando tu pedido", chip: "bg-oceom-blue/15 text-oceom-blue" },
  { key: "shipped", label: "Enviado", publicLabel: "En camino", chip: "bg-ocean-cyan/15 text-ocean-cyan" },
  { key: "delivered", label: "Entregado", publicLabel: "Entregado", chip: "bg-success/15 text-success" },
  { key: "cancelled", label: "Cancelado", publicLabel: "Cancelado", chip: "bg-danger/15 text-danger" },
];

export const FULFILLMENT_MAP: Record<string, FulfillmentDef> = Object.fromEntries(
  FULFILLMENT.map((f) => [f.key, f]),
);

/* ── Departamentos de Colombia ────────────────────────────────
   Se usan en el checkout y para casar la tarifa de envío. */
export const DEPARTAMENTOS = [
  "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bogotá D.C.", "Bolívar",
  "Boyacá", "Caldas", "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó",
  "Córdoba", "Cundinamarca", "Guainía", "Guaviare", "Huila", "La Guajira",
  "Magdalena", "Meta", "Nariño", "Norte de Santander", "Putumayo", "Quindío",
  "Risaralda", "San Andrés y Providencia", "Santander", "Sucre", "Tolima",
  "Valle del Cauca", "Vaupés", "Vichada",
] as const;

/* ── Reglas del carrito ─────────────────────────────────────── */

/** Tope por línea. Nadie compra 400 frascos: un número alto en el input casi
 *  siempre es un dedo pegado a la tecla, y el pedido se vuelve incobrable. */
export const MAX_QTY = 20;

/** Bold rechaza montos por debajo de esto. */
export const MIN_ORDER_COP = 1000;

/** Tipos que se entregan solos, sin que Valeria tenga que hacer nada. */
export const AUTO_KINDS: ProductKind[] = ["program", "membership"];

/** Tipos que nunca se envían por transportadora. */
export const DIGITAL_KINDS: ProductKind[] = ["program", "membership", "session"];

/** Formatea pesos colombianos sin decimales. */
export function formatCop(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}
