import "server-only";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";
import { MAX_QTY, type ProductKind } from "@/config/shop";

/* ============================================================
   El carrito.

   La cookie guarda ÚNICAMENTE referencias y cantidades — nunca precios.
   Todo importe se vuelve a leer de la base al resolver el carrito, así que
   editar la cookie a mano no cambia lo que se cobra; a lo sumo mete un id
   que no existe, y esa línea se cae sola.

   Vive en cookie (no en base) para que una visitante sin cuenta pueda armar
   su pedido: la tienda es pública y la mayoría llega desde Instagram sin
   sesión.
   ============================================================ */

const COOKIE = "oceom_cart";
const MAX_LINES = 30;
/** 30 días: un carrito abandonado sigue siendo una venta posible. */
const MAX_AGE = 60 * 60 * 24 * 30;

/** Línea tal como viaja en la cookie. Nombres de una letra a propósito: la
 *  cookie tiene 4 KB de tope y esto se serializa en cada petición. */
export interface CartLine {
  /** producto */ p: string;
  /** variante */ v: string | null;
  /** cantidad */ q: number;
}

export interface ResolvedLine {
  key: string;
  productId: string;
  variantId: string | null;
  slug: string;
  title: string;
  variantTitle: string | null;
  kind: ProductKind;
  imageUrl: string | null;
  unitPrice: number;
  qty: number;
  total: number;
  requiresShipping: boolean;
  /** Tope real de esta línea (inventario). null = sin límite de stock. */
  maxQty: number | null;
  /** Se pidió más de lo que hay: la línea se ajustó al stock disponible. */
  adjusted: boolean;
  programId: string | null;
  membershipDays: number | null;
  digitalPath: string | null;
  digitalName: string | null;
  weightG: number | null;
}

export interface ResolvedCart {
  lines: ResolvedLine[];
  subtotal: number;
  count: number;
  requiresShipping: boolean;
  /** Alguna línea se ajustó o se cayó (producto agotado o retirado). */
  changed: boolean;
}

const EMPTY: ResolvedCart = {
  lines: [],
  subtotal: 0,
  count: 0,
  requiresShipping: false,
  changed: false,
};

export function lineKey(productId: string, variantId: string | null): string {
  return variantId ? `${productId}:${variantId}` : productId;
}

/* ── Lectura / escritura de la cookie ── */

function parse(raw: string | undefined): CartLine[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data
      .filter((l): l is CartLine => {
        const o = l as CartLine;
        return !!o && typeof o.p === "string" && typeof o.q === "number";
      })
      .map((l) => ({
        p: l.p,
        v: typeof l.v === "string" ? l.v : null,
        q: Math.min(MAX_QTY, Math.max(1, Math.floor(l.q))),
      }))
      .slice(0, MAX_LINES);
  } catch {
    return [];
  }
}

export async function readCartCookie(): Promise<CartLine[]> {
  return parse((await cookies()).get(COOKIE)?.value);
}

/** Solo desde una Server Action o un Route Handler (Next no deja escribir
 *  cookies mientras se renderiza una página). */
export async function writeCartCookie(lines: CartLine[]): Promise<void> {
  const jar = await cookies();
  if (lines.length === 0) {
    jar.delete(COOKIE);
    return;
  }
  jar.set(COOKIE, JSON.stringify(lines.slice(0, MAX_LINES)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

/* ── Resolución contra la base ── */

interface ProductRow {
  id: string;
  slug: string;
  title: string;
  kind: ProductKind;
  price_cop: number;
  image_url: string | null;
  status: string;
  is_public: boolean;
  requires_shipping: boolean;
  track_stock: boolean;
  stock: number;
  program_id: string | null;
  membership_days: number | null;
  digital_path: string | null;
  digital_name: string | null;
  weight_g: number | null;
}

interface VariantRow {
  id: string;
  product_id: string;
  title: string;
  price_cop: number | null;
  track_stock: boolean;
  stock: number;
  status: string;
  digital_path: string | null;
  digital_name: string | null;
  image_url: string | null;
}

/** Convierte las referencias de la cookie en líneas con precio y stock reales.
 *  Usa el service client porque la vitrina es pública y esto corre igual sin
 *  sesión; solo lee catálogo, que de todos modos es público. */
export async function resolveCart(lines: CartLine[]): Promise<ResolvedCart> {
  if (lines.length === 0) return EMPTY;

  const svc = createServiceClient();
  const productIds = [...new Set(lines.map((l) => l.p))];
  const variantIds = [...new Set(lines.map((l) => l.v).filter((v): v is string => !!v))];

  const [{ data: products }, { data: variants }] = await Promise.all([
    svc
      .from("store_products")
      .select(
        "id, slug, title, kind, price_cop, image_url, status, is_public, requires_shipping, track_stock, stock, program_id, membership_days, digital_path, digital_name, weight_g",
      )
      .in("id", productIds),
    variantIds.length
      ? svc
          .from("store_variants")
          .select(
            "id, product_id, title, price_cop, track_stock, stock, status, digital_path, digital_name, image_url",
          )
          .in("id", variantIds)
      : Promise.resolve({ data: [] as VariantRow[] }),
  ]);

  const byProduct = new Map((products ?? []).map((p) => [p.id, p as ProductRow]));
  const byVariant = new Map((variants ?? []).map((v) => [v.id, v as VariantRow]));

  const resolved: ResolvedLine[] = [];
  let changed = false;

  for (const l of lines) {
    const p = byProduct.get(l.p);
    // El producto se ocultó o se borró mientras el carrito dormía.
    if (!p || p.status !== "active" || !p.is_public) {
      changed = true;
      continue;
    }

    const v = l.v ? byVariant.get(l.v) : null;
    if (l.v && (!v || v.status !== "active" || v.product_id !== p.id)) {
      changed = true;
      continue;
    }

    const tracks = v ? v.track_stock : p.track_stock;
    const stock = v ? v.stock : p.stock;
    if (tracks && stock <= 0) {
      changed = true;
      continue;
    }

    const maxQty = tracks ? Math.min(stock, MAX_QTY) : null;
    const qty = maxQty ? Math.min(l.q, maxQty) : Math.min(l.q, MAX_QTY);
    const adjusted = qty !== l.q;
    if (adjusted) changed = true;

    const unitPrice = v?.price_cop ?? p.price_cop;

    resolved.push({
      key: lineKey(p.id, v?.id ?? null),
      productId: p.id,
      variantId: v?.id ?? null,
      slug: p.slug,
      title: p.title,
      variantTitle: v?.title ?? null,
      kind: p.kind,
      imageUrl: v?.image_url ?? p.image_url,
      unitPrice,
      qty,
      total: unitPrice * qty,
      requiresShipping: p.requires_shipping,
      maxQty,
      adjusted,
      programId: p.program_id,
      membershipDays: p.membership_days,
      digitalPath: v?.digital_path ?? p.digital_path,
      digitalName: v?.digital_name ?? p.digital_name,
      weightG: p.weight_g,
    });
  }

  const subtotal = resolved.reduce((s, l) => s + l.total, 0);

  return {
    lines: resolved,
    subtotal,
    count: resolved.reduce((s, l) => s + l.qty, 0),
    requiresShipping: resolved.some((l) => l.requiresShipping),
    changed,
  };
}

/** El carrito de esta visitante, ya resuelto. */
export async function getCart(): Promise<ResolvedCart> {
  return resolveCart(await readCartCookie());
}
