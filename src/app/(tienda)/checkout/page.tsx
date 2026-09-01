import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCart } from "@/lib/shop/cart";
import { createClient } from "@/lib/supabase/server";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { formatCop } from "@/config/shop";

export const dynamic = "force-dynamic";
export const metadata = { title: "Finalizar compra · OCEOM" };

export default async function CheckoutPage() {
  const cart = await getCart();
  if (cart.lines.length === 0) redirect("/carrito");

  // Con sesión abierta, el formulario llega lleno. Sin sesión, vacío: no se
  // obliga a nadie a registrarse para comprar.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let defaults = { name: "", email: "" };
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle();
    defaults = {
      name: profile?.full_name ?? "",
      email: profile?.email ?? user.email ?? "",
    };
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] px-6 py-12">
      <Link
        href="/carrito"
        className="mb-8 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Volver al carrito
      </Link>

      <h1 className="mb-8 font-display text-2xl font-semibold text-foreground">
        Finalizar compra
      </h1>

      <div className="grid gap-12 lg:grid-cols-[1fr_340px]">
        <CheckoutForm
          subtotal={cart.subtotal}
          requiresShipping={cart.requiresShipping}
          defaults={defaults}
        />

        <aside className="order-first lg:order-last lg:sticky lg:top-32 lg:h-fit">
          <div className="rounded-[3px] border border-white/10 bg-ocean-surface/35 p-5">
            <h2 className="mb-4 text-[0.68rem] uppercase tracking-[0.18em] text-muted">
              Tu pedido ({cart.count})
            </h2>
            <ul className="space-y-3">
              {cart.lines.map((l) => (
                <li key={l.key} className="flex gap-3">
                  <div className="size-12 shrink-0 overflow-hidden rounded-[3px] border border-white/10 bg-ocean-deep/50">
                    {l.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.imageUrl} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{l.title}</p>
                    <p className="text-xs text-muted">
                      {l.variantTitle ? `${l.variantTitle} · ` : ""}× {l.qty}
                    </p>
                  </div>
                  <span className="text-sm text-muted">{formatCop(l.total)}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
