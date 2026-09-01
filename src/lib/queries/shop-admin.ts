import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { ProductKind } from "@/config/shop";

/* ============================================================
   Lecturas del panel de la tienda.

   Van con el service client: la mentora necesita ver TODO — productos
   ocultos, pedidos de otras personas, direcciones de envío — y eso es
   justamente lo que RLS le niega a un cliente de sesión.
   ============================================================ */

export interface AdminVariant {
  id: string;
  product_id: string;
  title: string;
  sku: string | null;
  price_cop: number | null;
  track_stock: boolean;
  stock: number;
  sort: number;
  status: string;
}

export interface AdminProduct {
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
  requires_shipping: boolean;
  track_stock: boolean;
  stock: number;
  weight_g: number | null;
  featured: boolean;
  is_public: boolean;
  legal_note: string | null;
  digital_path: string | null;
  digital_name: string | null;
  program_id: string | null;
  membership_days: number | null;
  status: "active" | "hidden";
  sort: number;
  variants: AdminVariant[];
}

export async function listAdminProducts(): Promise<AdminProduct[]> {
  const svc = createServiceClient();
  const [{ data: products }, { data: variants }] = await Promise.all([
    svc
      .from("store_products")
      .select("*")
      .order("sort", { ascending: true })
      .order("created_at", { ascending: false }),
    svc.from("store_variants").select("*").order("sort", { ascending: true }),
  ]);

  const byProduct = new Map<string, AdminVariant[]>();
  for (const v of variants ?? []) {
    const row = v as AdminVariant;
    const list = byProduct.get(row.product_id) ?? [];
    list.push(row);
    byProduct.set(row.product_id, list);
  }

  return (products ?? []).map((p) => {
    const row = p as Record<string, unknown>;
    return {
      ...(row as unknown as AdminProduct),
      gallery: Array.isArray(row.gallery) ? (row.gallery as string[]) : [],
      benefits: Array.isArray(row.benefits) ? (row.benefits as string[]) : [],
      intentions: Array.isArray(row.intentions) ? (row.intentions as string[]) : [],
      variants: byProduct.get(row.id as string) ?? [],
    };
  });
}

export interface AdminOrderItem {
  id: string;
  title: string;
  variant_title: string | null;
  qty: number;
  total_cop: number;
  requires_shipping: boolean;
}

export interface AdminOrder {
  id: string;
  reference: string;
  status: string;
  fulfillment_status: string;
  requires_shipping: boolean;
  buyer_name: string | null;
  email: string | null;
  phone: string | null;
  amount_cop: number;
  subtotal_cop: number;
  shipping_cop: number;
  shipping_doc: string | null;
  shipping_address: string | null;
  shipping_address2: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_notes: string | null;
  carrier: string | null;
  tracking_number: string | null;
  claim_token: string;
  created_at: string;
  paid_at: string | null;
  items: AdminOrderItem[];
}

export async function listAdminOrders(limit = 100): Promise<AdminOrder[]> {
  const svc = createServiceClient();
  const { data: orders } = await svc
    .from("store_orders")
    .select(
      "id, reference, status, fulfillment_status, requires_shipping, buyer_name, email, phone, amount_cop, subtotal_cop, shipping_cop, shipping_doc, shipping_address, shipping_address2, shipping_city, shipping_state, shipping_notes, carrier, tracking_number, claim_token, created_at, paid_at, product_title",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  const rows = orders ?? [];
  if (rows.length === 0) return [];

  const { data: items } = await svc
    .from("store_order_items")
    .select("id, order_id, title, variant_title, qty, total_cop, requires_shipping")
    .in(
      "order_id",
      rows.map((o) => o.id as string),
    );

  const byOrder = new Map<string, AdminOrderItem[]>();
  for (const i of items ?? []) {
    const row = i as AdminOrderItem & { order_id: string };
    const list = byOrder.get(row.order_id) ?? [];
    list.push(row);
    byOrder.set(row.order_id, list);
  }

  return rows.map((o) => {
    const row = o as Record<string, unknown>;
    const lines = byOrder.get(row.id as string) ?? [];
    return {
      ...(row as unknown as AdminOrder),
      // Los pedidos anteriores al carrito no tienen líneas: se muestra el
      // snapshot para que no aparezcan vacíos en el panel.
      items:
        lines.length > 0
          ? lines
          : [
              {
                id: row.id as string,
                title: (row.product_title as string) ?? "Pedido",
                variant_title: null,
                qty: 1,
                total_cop: row.amount_cop as number,
                requires_shipping: (row.requires_shipping as boolean) ?? false,
              },
            ],
    };
  });
}

export interface AdminShippingRate {
  id: string;
  name: string;
  states: string[];
  price_cop: number;
  free_over_cop: number | null;
  sort: number;
  active: boolean;
}

export async function listAdminShippingRates(): Promise<AdminShippingRate[]> {
  const svc = createServiceClient();
  const { data } = await svc
    .from("store_shipping_rates")
    .select("*")
    .order("sort", { ascending: true });
  return (data ?? []) as AdminShippingRate[];
}

/** Lo que Valeria mira primero al abrir el panel. */
export interface ShopStats {
  ventasTotales: number;
  ventasMes: number;
  pedidosPagados: number;
  porDespachar: number;
  sinStock: number;
}

export async function getShopStats(): Promise<ShopStats> {
  const svc = createServiceClient();
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [{ data: pagadas }, { count: agotados }] = await Promise.all([
    svc.from("store_orders").select("amount_cop, created_at, fulfillment_status").eq("status", "paid"),
    svc
      .from("store_products")
      .select("id", { count: "exact", head: true })
      .eq("track_stock", true)
      .lte("stock", 0),
  ]);

  const rows = pagadas ?? [];
  return {
    ventasTotales: rows.reduce((s, o) => s + (o.amount_cop as number), 0),
    ventasMes: rows
      .filter((o) => new Date(o.created_at as string) >= inicioMes)
      .reduce((s, o) => s + (o.amount_cop as number), 0),
    pedidosPagados: rows.length,
    porDespachar: rows.filter((o) =>
      ["pending", "preparing"].includes(o.fulfillment_status as string),
    ).length,
    sinStock: agotados ?? 0,
  };
}
