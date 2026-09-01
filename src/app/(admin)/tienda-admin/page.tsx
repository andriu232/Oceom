import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { StoreManager } from "@/components/admin/store-manager";
import { OrdersManager } from "@/components/admin/shop/orders-manager";
import { ShippingRates } from "@/components/admin/shop/shipping-rates";
import { ShopTabs } from "@/components/admin/shop/shop-tabs";
import {
  listAdminProducts,
  listAdminOrders,
  listAdminShippingRates,
  getShopStats,
} from "@/lib/queries/shop-admin";
import { formatCop } from "@/config/shop";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tienda · OCEOM" };

export default async function TiendaAdminPage() {
  await requireRole("mentor", "super_admin");
  const supabase = await createClient();

  const [products, orders, rates, stats, programsRes, categoriesRes] = await Promise.all([
    listAdminProducts(),
    listAdminOrders(),
    listAdminShippingRates(),
    getShopStats(),
    supabase.from("programs").select("id, title").order("title"),
    supabase.from("store_categories").select("id, name").order("sort"),
  ]);

  const programs = (programsRes.data ?? []) as { id: string; title: string }[];
  const categories = (categoriesRes.data ?? []) as { id: string; name: string }[];

  const cifras = [
    { label: "Ventas del mes", valor: formatCop(stats.ventasMes) },
    { label: "Ventas totales", valor: formatCop(stats.ventasTotales) },
    { label: "Por despachar", valor: String(stats.porDespachar), alerta: stats.porDespachar > 0 },
    { label: "Agotados", valor: String(stats.sinStock), alerta: stats.sinStock > 0 },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tienda"
        subtitle="Tu tienda pública: productos, pedidos y envíos. Los pagos con Bold se confirman solos."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cifras.map((c) => (
          <div key={c.label} className="glass rounded-xl px-4 py-3.5">
            <p className="text-xs text-muted">{c.label}</p>
            <p
              className={`mt-1 font-display text-lg font-semibold ${
                c.alerta ? "text-oceom-gold" : "text-foreground"
              }`}
            >
              {c.valor}
            </p>
          </div>
        ))}
      </div>

      <ShopTabs
        productos={
          <StoreManager products={products} programs={programs} categories={categories} />
        }
        pedidos={<OrdersManager orders={orders} />}
        envios={<ShippingRates rates={rates} />}
        porDespachar={stats.porDespachar}
      />
    </div>
  );
}
