import Link from "next/link";
import { notFound } from "next/navigation";
import { Truck, Download, ShieldCheck, Sparkles, ArrowLeft } from "lucide-react";
import { getShopProduct, listRelated } from "@/lib/shop/queries";
import { Gallery } from "@/components/shop/gallery";
import { AddToCart } from "@/components/shop/add-to-cart";
import { ProductCard } from "@/components/shop/product-card";
import { INTENTION_MAP } from "@/config/shop";

export const dynamic = "force-dynamic";

const SHELL = "mx-auto w-full max-w-[1180px] px-6";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getShopProduct(slug);
  if (!p) return { title: "Producto · OCEOM" };
  return {
    title: `${p.title} · OCEOM`,
    description: p.short_description ?? p.subtitle ?? undefined,
    openGraph: p.image_url ? { images: [p.image_url] } : undefined,
  };
}

export default async function ProductoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getShopProduct(slug);
  if (!product) notFound();

  const related = await listRelated(product);
  const images = [product.image_url, ...product.gallery].filter(
    (src): src is string => !!src,
  );
  const digital = !product.requires_shipping;

  return (
    <div className={`${SHELL} py-10`}>
      <Link
        href="/tienda"
        className="mb-8 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Seguir viendo
      </Link>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <Gallery images={images} alt={product.title} />

        <div className="lg:pt-4">
          {product.category_name && (
            <p className="mb-3 text-[0.68rem] uppercase tracking-[0.22em] text-ocean-glow/80">
              {product.category_name}
            </p>
          )}

          <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-foreground">
            {product.title}
          </h1>
          {product.subtitle && (
            <p className="mt-3 text-base leading-relaxed text-muted">{product.subtitle}</p>
          )}

          {product.intentions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {product.intentions.map((key) => {
                const i = INTENTION_MAP[key];
                if (!i) return null;
                return (
                  <Link
                    key={key}
                    href={`/tienda?intencion=${key}`}
                    className="rounded-full px-2.5 py-1 text-[0.66rem] tracking-wide transition-opacity hover:opacity-80"
                    style={{ color: i.color, backgroundColor: `${i.color}1a` }}
                  >
                    {i.label}
                  </Link>
                );
              })}
            </div>
          )}

          <div className="mt-7 border-t border-white/10 pt-7">
            <AddToCart
              productId={product.id}
              basePrice={product.price_cop}
              trackStock={product.track_stock}
              stock={product.stock}
              variants={product.variants ?? []}
            />
          </div>

          <ul className="mt-6 space-y-2.5 border-t border-white/10 pt-6 text-sm text-muted">
            <li className="flex items-start gap-2.5">
              {digital ? (
                <Download className="mt-0.5 size-4 shrink-0 text-ocean-glow" />
              ) : (
                <Truck className="mt-0.5 size-4 shrink-0 text-ocean-glow" />
              )}
              {digital
                ? "Acceso inmediato apenas confirmemos tu pago."
                : "Envíos a toda Colombia. Gratis desde $250.000."}
            </li>
            <li className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-oceom-turquoise" />
              Pago seguro con Bold · tarjetas, PSE, Nequi.
            </li>
          </ul>

          {product.benefits.length > 0 && (
            <div className="mt-8 rounded-[3px] border border-white/10 bg-ocean-surface/35 p-5">
              <p className="mb-3 flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.2em] text-ocean-glow">
                <Sparkles className="size-3.5" /> Lo que trae
              </p>
              <ul className="space-y-2">
                {product.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm text-muted">
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-ocean-cyan" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {product.description && (
        <section className="mt-16 max-w-2xl border-t border-white/10 pt-10">
          <h2 className="font-display text-xl font-semibold text-foreground">
            Sobre este producto
          </h2>
          <div className="mt-4 space-y-4 text-[0.95rem] leading-relaxed text-muted">
            {product.description.split(/\n{2,}/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {product.legal_note && (
            <p className="mt-8 border-l-2 border-white/10 pl-4 text-xs italic leading-relaxed text-muted/70">
              {product.legal_note}
            </p>
          )}
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-20 border-t border-white/10 pt-12">
          <h2 className="mb-8 text-center font-display text-xl font-semibold text-foreground">
            También podría acompañarte
          </h2>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
