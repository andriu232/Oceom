import { createClient } from "@/lib/supabase/server";
import type { ProductKind } from "@/config/store";

export interface StoreProduct {
  id: string;
  kind: ProductKind;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  price_cop: number;
  program_id: string | null;
  membership_days: number | null;
  benefits: string[];
  status: "active" | "hidden";
  sort: number;
}

export interface StoreOrder {
  id: string;
  product_title: string;
  product_kind: string;
  amount_cop: number;
  status: "pending" | "paid" | "rejected" | "cancelled";
  reference: string;
  created_at: string;
  paid_at: string | null;
  buyer_name?: string | null;
}

function rowToProduct(r: Record<string, unknown>): StoreProduct {
  return {
    id: r.id as string,
    kind: r.kind as ProductKind,
    title: r.title as string,
    slug: r.slug as string,
    subtitle: (r.subtitle as string) ?? null,
    description: (r.description as string) ?? null,
    image_url: (r.image_url as string) ?? null,
    price_cop: r.price_cop as number,
    program_id: (r.program_id as string) ?? null,
    membership_days: (r.membership_days as number) ?? null,
    benefits: Array.isArray(r.benefits) ? (r.benefits as string[]) : [],
    status: (r.status as "active" | "hidden") ?? "active",
    sort: (r.sort as number) ?? 0,
  };
}

/** Productos activos del catálogo (para estudiantes). */
export async function listActiveProducts(): Promise<StoreProduct[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_products")
    .select("*")
    .eq("status", "active")
    .order("sort", { ascending: true })
    .order("created_at", { ascending: false });
  return (data ?? []).map(rowToProduct);
}

/** Todos los productos (admin). */
export async function listAllProducts(): Promise<StoreProduct[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_products")
    .select("*")
    .order("sort", { ascending: true })
    .order("created_at", { ascending: false });
  return (data ?? []).map(rowToProduct);
}

export async function getProductBySlug(slug: string): Promise<StoreProduct | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data ? rowToProduct(data) : null;
}

/** Órdenes del comprador. */
export async function listMyOrders(buyerId: string): Promise<StoreOrder[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_orders")
    .select("id, product_title, product_kind, amount_cop, status, reference, created_at, paid_at")
    .eq("buyer_id", buyerId)
    .order("created_at", { ascending: false });
  return (data ?? []) as StoreOrder[];
}

/** Todas las órdenes (admin), con nombre del comprador. */
export async function listAllOrders(): Promise<StoreOrder[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_orders")
    .select(
      "id, product_title, product_kind, amount_cop, status, reference, created_at, paid_at, profiles!store_orders_buyer_id_fkey(full_name)",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    product_title: r.product_title as string,
    product_kind: r.product_kind as string,
    amount_cop: r.amount_cop as number,
    status: r.status as StoreOrder["status"],
    reference: r.reference as string,
    created_at: r.created_at as string,
    paid_at: (r.paid_at as string) ?? null,
    buyer_name: (r.profiles as { full_name?: string } | null)?.full_name ?? null,
  }));
}

/** Estado de una orden por referencia (para la página de resultado). */
export async function getOrderByReference(
  buyerId: string,
  reference: string,
): Promise<StoreOrder | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_orders")
    .select("id, product_title, product_kind, amount_cop, status, reference, created_at, paid_at")
    .eq("buyer_id", buyerId)
    .eq("reference", reference)
    .maybeSingle();
  return (data as StoreOrder) ?? null;
}
