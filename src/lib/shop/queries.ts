import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { ProductKind } from "@/config/shop";

/* ============================================================
   Lecturas del catálogo público.

   Todo pasa por el service client a propósito: la vitrina se sirve a gente
   sin sesión, y crear un cliente de sesión por producto para leer datos que
   son públicos de todos modos solo añade latencia. Las políticas RLS siguen
   siendo la frontera para todo lo que NO es catálogo (órdenes, descargas).
   ============================================================ */

export interface ShopVariant {
  id: string;
  title: string;
  price_cop: number | null;
  track_stock: boolean;
  stock: number;
  image_url: string | null;
  sort: number;
}

export interface ShopProduct {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  short_description: string | null;
  description: string | null;
  kind: ProductKind;
  price_cop: number;
  compare_at_price_cop: number | null;
  image_url: string | null;
  gallery: string[];
  benefits: string[];
  intentions: string[];
  category_id: string | null;
  category_slug?: string | null;
  category_name?: string | null;
  requires_shipping: boolean;
  track_stock: boolean;
  stock: number;
  featured: boolean;
  legal_note: string | null;
  digital_path: string | null;
  membership_days: number | null;
  program_id: string | null;
  sort: number;
  variants?: ShopVariant[];
}

export interface ShopCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  sort: number;
}

const PRODUCT_FIELDS =
  "id, slug, title, subtitle, short_description, description, kind, price_cop, compare_at_price_cop, image_url, gallery, benefits, intentions, category_id, requires_shipping, track_stock, stock, featured, legal_note, digital_path, membership_days, program_id, sort";

function toProduct(r: Record<string, unknown>): ShopProduct {
  const cat = r.store_categories as { slug?: string; name?: string } | null;
  return {
    ...(r as unknown as ShopProduct),
    gallery: Array.isArray(r.gallery) ? (r.gallery as string[]) : [],
    benefits: Array.isArray(r.benefits) ? (r.benefits as string[]) : [],
    intentions: Array.isArray(r.intentions) ? (r.intentions as string[]) : [],
    category_slug: cat?.slug ?? null,
    category_name: cat?.name ?? null,
  };
}

/** ¿Se puede comprar? Con variantes, basta que una tenga existencias. */
export function isAvailable(p: ShopProduct): boolean {
  if (p.variants && p.variants.length > 0) {
    return p.variants.some((v) => !v.track_stock || v.stock > 0);
  }
  return !p.track_stock || p.stock > 0;
}

/** Precio "desde": con variantes de distinto precio, la vitrina muestra el
 *  más bajo, que es lo que la persona espera al entrar. */
export function priceFrom(p: ShopProduct): number {
  const prices = (p.variants ?? [])
    .map((v) => v.price_cop)
    .filter((n): n is number => typeof n === "number");
  return prices.length ? Math.min(p.price_cop, ...prices) : p.price_cop;
}

export interface CatalogFilters {
  category?: string | null;
  intention?: string | null;
  kind?: ProductKind | null;
  search?: string | null;
  sort?: "destacados" | "recientes" | "precio-asc" | "precio-desc" | null;
}

/** La vitrina. */
export async function listShopProducts(f: CatalogFilters = {}): Promise<ShopProduct[]> {
  const svc = createServiceClient();
  let q = svc
    .from("store_products")
    .select(`${PRODUCT_FIELDS}, store_categories(slug, name)`)
    .eq("status", "active")
    .eq("is_public", true);

  if (f.category) {
    const { data: cat } = await svc
      .from("store_categories")
      .select("id")
      .eq("slug", f.category)
      .maybeSingle();
    // Categoría inexistente: mejor vitrina vacía que ignorar el filtro en
    // silencio y devolver el catálogo entero.
    if (!cat) return [];
    q = q.eq("category_id", cat.id);
  }
  if (f.intention) q = q.contains("intentions", [f.intention]);
  if (f.kind) q = q.eq("kind", f.kind);
  if (f.search) {
    const s = f.search.replace(/[%,()]/g, " ").trim();
    if (s) q = q.or(`title.ilike.%${s}%,subtitle.ilike.%${s}%,short_description.ilike.%${s}%`);
  }

  switch (f.sort) {
    case "precio-asc":
      q = q.order("price_cop", { ascending: true });
      break;
    case "precio-desc":
      q = q.order("price_cop", { ascending: false });
      break;
    case "recientes":
      q = q.order("created_at", { ascending: false });
      break;
    default:
      q = q
        .order("featured", { ascending: false })
        .order("sort", { ascending: true })
        .order("created_at", { ascending: false });
  }

  const { data } = await q.limit(200);
  const products = (data ?? []).map(toProduct);
  return attachVariants(products);
}

/** Las variantes se traen en una sola consulta para todo el listado: pedirlas
 *  producto por producto era el N+1 clásico. */
async function attachVariants(products: ShopProduct[]): Promise<ShopProduct[]> {
  if (products.length === 0) return products;
  const svc = createServiceClient();
  const { data } = await svc
    .from("store_variants")
    .select("id, product_id, title, price_cop, track_stock, stock, image_url, sort")
    .in(
      "product_id",
      products.map((p) => p.id),
    )
    .eq("status", "active")
    .order("sort", { ascending: true });

  const byProduct = new Map<string, ShopVariant[]>();
  for (const v of data ?? []) {
    const row = v as ShopVariant & { product_id: string };
    const list = byProduct.get(row.product_id) ?? [];
    list.push(row);
    byProduct.set(row.product_id, list);
  }
  return products.map((p) => ({ ...p, variants: byProduct.get(p.id) ?? [] }));
}

export async function getShopProduct(slug: string): Promise<ShopProduct | null> {
  const svc = createServiceClient();
  const { data } = await svc
    .from("store_products")
    .select(`${PRODUCT_FIELDS}, store_categories(slug, name)`)
    .eq("slug", slug)
    .eq("status", "active")
    .eq("is_public", true)
    .maybeSingle();
  if (!data) return null;
  const [withVariants] = await attachVariants([toProduct(data)]);
  return withVariants;
}

/** Otros productos de la misma categoría (o destacados si no hay). */
export async function listRelated(p: ShopProduct, limit = 4): Promise<ShopProduct[]> {
  const svc = createServiceClient();
  let q = svc
    .from("store_products")
    .select(PRODUCT_FIELDS)
    .eq("status", "active")
    .eq("is_public", true)
    .neq("id", p.id);
  if (p.category_id) q = q.eq("category_id", p.category_id);
  const { data } = await q.limit(limit);
  const rows = (data ?? []).map(toProduct);
  if (rows.length > 0) return attachVariants(rows);

  const { data: destacados } = await svc
    .from("store_products")
    .select(PRODUCT_FIELDS)
    .eq("status", "active")
    .eq("is_public", true)
    .neq("id", p.id)
    .order("featured", { ascending: false })
    .limit(limit);
  return attachVariants((destacados ?? []).map(toProduct));
}

export async function listCategories(): Promise<ShopCategory[]> {
  const svc = createServiceClient();
  const { data } = await svc
    .from("store_categories")
    .select("id, slug, name, description, image_url, sort")
    .eq("status", "active")
    .order("sort", { ascending: true });
  return (data ?? []) as ShopCategory[];
}

/* ── Envíos ─────────────────────────────────────────────────── */

export interface ShippingRate {
  id: string;
  name: string;
  states: string[];
  price_cop: number;
  free_over_cop: number | null;
  sort: number;
}

export async function listShippingRates(): Promise<ShippingRate[]> {
  const svc = createServiceClient();
  const { data } = await svc
    .from("store_shipping_rates")
    .select("id, name, states, price_cop, free_over_cop, sort")
    .eq("active", true)
    .order("sort", { ascending: true });
  return (data ?? []) as ShippingRate[];
}

export interface ShippingQuote {
  cost: number;
  rateName: string | null;
  /** Cuánto falta para que el envío salga gratis (null si no aplica). */
  missingForFree: number | null;
  free: boolean;
}

/** Cotiza el envío para un departamento y un subtotal.
 *
 *  La tarifa que gana es la que nombra explícitamente el departamento; si
 *  ninguna lo nombra, cae en la tarifa general (la de `states` vacío). Sin
 *  tarifa general configurada, el envío queda en 0 en vez de bloquear la
 *  compra: preferimos perder el flete de un pedido a perder el pedido. */
export function quoteShipping(
  rates: ShippingRate[],
  state: string | null,
  subtotal: number,
): ShippingQuote {
  if (rates.length === 0) {
    return { cost: 0, rateName: null, missingForFree: null, free: true };
  }

  const specific = state
    ? rates.find((r) => r.states.some((s) => s.toLowerCase() === state.toLowerCase()))
    : null;
  const fallback = rates.find((r) => r.states.length === 0) ?? null;
  const rate = specific ?? fallback;

  if (!rate) return { cost: 0, rateName: null, missingForFree: null, free: true };

  const freeOver = rate.free_over_cop;
  const free = typeof freeOver === "number" && subtotal >= freeOver;

  return {
    cost: free ? 0 : rate.price_cop,
    rateName: rate.name,
    missingForFree: typeof freeOver === "number" && !free ? freeOver - subtotal : null,
    free,
  };
}
