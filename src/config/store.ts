/** Tipos de producto de la Tienda (serializable, server-safe). Los íconos se
 *  resuelven en el cliente por `iconKey`. */

export type ProductKind = "program" | "session" | "pack" | "membership" | "product";

export interface ProductKindDef {
  key: ProductKind;
  label: string;
  iconKey: string;
  hint: string;
}

export const PRODUCT_KINDS: ProductKindDef[] = [
  { key: "program", label: "Programa", iconKey: "library", hint: "Al pagar, inscribe automáticamente al programa." },
  { key: "session", label: "Sesión 1:1", iconKey: "calendar", hint: "Sesión individual con Valeria." },
  { key: "pack", label: "Pack / Experiencia", iconKey: "package", hint: "Deep Waves, retiros, experiencias." },
  { key: "membership", label: "Membresía", iconKey: "crown", hint: "Otorga acceso por una cantidad de días." },
  { key: "product", label: "Producto", iconKey: "shopping-bag", hint: "Producto suelto (libro, kit, ebook…). La entrega la coordinas tú." },
];

export const PRODUCT_KIND_LABEL: Record<ProductKind, string> = Object.fromEntries(
  PRODUCT_KINDS.map((k) => [k.key, k.label]),
) as Record<ProductKind, string>;

/** Formatea un monto en pesos colombianos (sin decimales). */
export function formatCop(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}
