import Link from "next/link";
import { ShoppingBag, Search, User } from "lucide-react";
import { getCart } from "@/lib/shop/cart";
import { listCategories } from "@/lib/shop/queries";
import { createClient } from "@/lib/supabase/server";

/* Cabecera de la tienda pública.

   Centrada y sobria, como un frente de apotecario: la marca al medio, las
   colecciones debajo, y a los lados solo lo que sirve para comprar (buscar,
   entrar, carrito). El resto del santuario no se asoma aquí — quien llega de
   Instagram a comprar un frasco no necesita ver el menú de la academia. */

export async function ShopHeader() {
  const [cart, categories, supabase] = await Promise.all([
    getCart(),
    listCategories(),
    createClient(),
  ]);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ocean-abyss/80 backdrop-blur-xl">
      <div className="border-b border-white/5 bg-ocean-deep/40">
        <p className="mx-auto max-w-[1180px] px-6 py-2 text-center text-[0.68rem] uppercase tracking-[0.22em] text-ocean-glow/80">
          Envío gratis desde $250.000 · Todo Colombia
        </p>
      </div>

      <div className="mx-auto grid max-w-[1180px] grid-cols-3 items-center px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/tienda?buscar="
            className="text-muted transition-colors hover:text-ocean-cyan"
            aria-label="Buscar"
          >
            <Search className="size-[18px]" />
          </Link>
        </div>

        <Link href="/tienda" className="justify-self-center text-center">
          <span className="font-display text-xl font-semibold tracking-[0.3em] text-foreground">
            OCE<span className="text-ocean-glow">OM</span>
          </span>
          <span className="mt-0.5 block text-[0.55rem] uppercase tracking-[0.35em] text-muted">
            Tienda
          </span>
        </Link>

        <div className="flex items-center justify-end gap-5">
          <Link
            href={user ? "/santuario" : "/login"}
            className="text-muted transition-colors hover:text-ocean-cyan"
            aria-label={user ? "Mi santuario" : "Entrar"}
          >
            <User className="size-[18px]" />
          </Link>
          <Link
            href="/carrito"
            className="relative text-muted transition-colors hover:text-ocean-cyan"
            aria-label={`Carrito (${cart.count})`}
          >
            <ShoppingBag className="size-[18px]" />
            {cart.count > 0 && (
              <span className="absolute -right-2 -top-2 grid size-[17px] place-items-center rounded-full bg-ocean-cyan text-[0.6rem] font-bold text-[var(--ocean-abyss)]">
                {cart.count}
              </span>
            )}
          </Link>
        </div>
      </div>

      <nav className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-center gap-x-7 gap-y-2 px-6 pb-3">
        <Link
          href="/tienda"
          className="text-[0.7rem] uppercase tracking-[0.18em] text-muted transition-colors hover:text-foreground"
        >
          Todo
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/tienda?categoria=${c.slug}`}
            className="text-[0.7rem] uppercase tracking-[0.18em] text-muted transition-colors hover:text-foreground"
          >
            {c.name}
          </Link>
        ))}
      </nav>
    </header>
  );
}
