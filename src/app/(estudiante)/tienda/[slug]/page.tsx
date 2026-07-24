import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Library, Calendar, Package, Crown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { requireStudentArea } from "@/lib/auth";
import { getProductBySlug } from "@/lib/queries/store";
import { formatCop, PRODUCT_KIND_LABEL, type ProductKind } from "@/config/store";
import { BuyPanel } from "@/components/store/buy-panel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Producto · OCEOM" };

const KIND_ICON: Record<ProductKind, LucideIcon> = {
  program: Library,
  session: Calendar,
  pack: Package,
  membership: Crown,
};

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireStudentArea();
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || product.status !== "active") notFound();

  const Icon = KIND_ICON[product.kind];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/tienda"
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ocean-cyan"
      >
        <ArrowLeft className="size-4" /> Tienda
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Imagen + descripción */}
        <div className="space-y-5">
          <div className="glass relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-ocean-surface/50">
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-ocean-cyan/40">
                <Icon className="size-14" />
              </div>
            )}
          </div>
          {product.description && (
            <div className="glass rounded-2xl p-5">
              <h2 className="font-display text-base font-semibold text-foreground">Sobre esto</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                {product.description}
              </p>
            </div>
          )}
        </div>

        {/* Compra */}
        <div className="space-y-5">
          <div className="glass rounded-2xl p-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ocean-cyan/12 px-2.5 py-1 text-xs font-medium text-ocean-cyan">
              <Icon className="size-3.5" /> {PRODUCT_KIND_LABEL[product.kind]}
            </span>
            <h1 className="mt-3 font-display text-2xl font-bold leading-tight text-foreground">
              {product.title}
            </h1>
            {product.subtitle && (
              <p className="mt-1.5 text-sm text-muted">{product.subtitle}</p>
            )}
            <p className="mt-4 font-display text-3xl font-bold text-ocean-cyan">
              {formatCop(product.price_cop)}
            </p>
            {product.kind === "membership" && product.membership_days && (
              <p className="mt-1 text-xs text-muted">
                Acceso por {product.membership_days} días.
              </p>
            )}

            <div className="mt-5">
              <BuyPanel productId={product.id} price={product.price_cop} />
            </div>
          </div>

          {product.benefits.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <h2 className="font-display text-base font-semibold text-foreground">Incluye</h2>
              <ul className="mt-3 space-y-2">
                {product.benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/85">
                    <Check className="mt-0.5 size-4 shrink-0 text-oceom-turquoise" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
