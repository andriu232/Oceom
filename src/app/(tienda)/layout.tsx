import { ShopHeader } from "@/components/shop/shop-header";
import { ShopFooter } from "@/components/shop/shop-footer";

/* La tienda es pública: se sirve igual con sesión y sin ella. */
export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <ShopHeader />
      <main className="flex-1">{children}</main>
      <ShopFooter />
    </div>
  );
}
