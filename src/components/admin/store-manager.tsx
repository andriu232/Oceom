"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, Check, AlertTriangle, Pencil, Trash2, Eye, EyeOff, X, Plus,
  Truck, Download, Star, Package,
} from "lucide-react";
import {
  saveProductAction, toggleProductAction, deleteProductAction, type StoreState,
} from "@/lib/actions/store";
import { PRODUCT_KINDS, PRODUCT_KIND_LABEL } from "@/config/store";
import { INTENTIONS, formatCop } from "@/config/shop";
import type { AdminProduct } from "@/lib/queries/shop-admin";
import { VariantsEditor } from "@/components/admin/shop/variants-editor";
import { cn } from "@/lib/utils";

interface Opt { id: string; title?: string; name?: string }

const input =
  "w-full rounded-xl border border-card-border bg-ocean-surface/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-ocean-cyan/40 focus:outline-none";
const label = "text-xs font-medium text-muted";

export function StoreManager({
  products, programs, categories,
}: {
  products: AdminProduct[];
  programs: Opt[];
  categories: Opt[];
}) {
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6">
      {(creating || editing) && (
        <ProductForm
          key={editing?.id ?? "new"}
          product={editing}
          programs={programs}
          categories={categories}
          onDone={() => { setEditing(null); setCreating(false); }}
        />
      )}

      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Productos ({products.length})
        </h2>
        {!creating && !editing && (
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-ocean-cyan px-4 py-2 text-sm font-medium text-[var(--ocean-abyss)] transition hover:brightness-110"
          >
            <Plus className="size-4" /> Nuevo producto
          </button>
        )}
      </div>

      {products.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
          Aún no hay productos. Crea el primero.
        </div>
      ) : (
        <ul className="space-y-2">
          {products.map((p) => (
            <ProductRow key={p.id} product={p} onEdit={() => { setCreating(false); setEditing(p); }} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ProductForm({
  product, programs, categories, onDone,
}: {
  product: AdminProduct | null;
  programs: Opt[];
  categories: Opt[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<StoreState, FormData>(
    async (prev, fd) => {
      const res = await saveProductAction(prev, fd);
      if (res?.ok) { router.refresh(); onDone(); }
      return res;
    },
    undefined,
  );

  const [kind, setKind] = useState(product?.kind ?? "product");
  const [shipping, setShipping] = useState(product?.requires_shipping ?? true);
  const [track, setTrack] = useState(product?.track_stock ?? false);

  // Solo lo tangible se envía; un programa o una membresía viven dentro.
  const puedeEnviarse = kind === "product" || kind === "pack";

  return (
    <div className="space-y-6">
      <form action={action} className="glass space-y-5 rounded-2xl p-5">
        <input type="hidden" name="id" value={product?.id ?? ""} />

        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-foreground">
            {product ? "Editar producto" : "Nuevo producto"}
          </h3>
          <button type="button" onClick={onDone} className="grid size-8 place-items-center rounded-lg text-muted hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label}>Título</label>
            <input name="title" required defaultValue={product?.title} className={cn(input, "mt-1")} />
          </div>

          <div>
            <label className={label}>Tipo</label>
            <select
              name="kind"
              value={kind}
              onChange={(e) => {
                const k = e.target.value as typeof kind;
                setKind(k);
                if (k !== "product" && k !== "pack") setShipping(false);
                else setShipping(true);
              }}
              className={cn(input, "mt-1")}
            >
              {PRODUCT_KINDS.map((k) => (
                <option key={k.key} value={k.key}>{k.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={label}>Categoría</label>
            <select name="category_id" defaultValue={product?.category_id ?? ""} className={cn(input, "mt-1")}>
              <option value="">— Sin categoría —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={label}>Precio (COP)</label>
            <input name="price_cop" type="number" min={1000} step={1000} required defaultValue={product?.price_cop} className={cn(input, "mt-1")} />
          </div>
          <div>
            <label className={label}>Precio tachado (opcional)</label>
            <input name="compare_at_price_cop" type="number" min={0} step={1000} defaultValue={product?.compare_at_price_cop ?? ""} className={cn(input, "mt-1")} placeholder="Para mostrar oferta" />
          </div>

          {kind === "program" && (
            <div className="sm:col-span-2">
              <label className={label}>Programa al que inscribe (al pagar)</label>
              <select name="program_id" defaultValue={product?.program_id ?? ""} className={cn(input, "mt-1")}>
                <option value="">— Elige un programa —</option>
                {programs.map((pr) => <option key={pr.id} value={pr.id}>{pr.title}</option>)}
              </select>
            </div>
          )}
          {kind === "membership" && (
            <div>
              <label className={label}>Días de acceso</label>
              <input name="membership_days" type="number" min={1} defaultValue={product?.membership_days ?? 30} className={cn(input, "mt-1")} />
            </div>
          )}

          <div className="sm:col-span-2">
            <label className={label}>Subtítulo — la frase que se lee bajo el nombre</label>
            <input name="subtitle" defaultValue={product?.subtitle ?? ""} className={cn(input, "mt-1")} />
          </div>

          <div className="sm:col-span-2">
            <label className={label}>Descripción</label>
            <textarea name="description" rows={5} defaultValue={product?.description ?? ""} className={cn(input, "mt-1 resize-y")} />
          </div>

          <div className="sm:col-span-2">
            <label className={label}>Incluye — uno por línea</label>
            <textarea name="benefits" rows={3} defaultValue={product?.benefits.join("\n") ?? ""} className={cn(input, "mt-1 resize-y")} />
          </div>

          {/* Intenciones: lo que la clienta busca, no lo que el producto es. */}
          <div className="sm:col-span-2">
            <label className={label}>Para qué sirve (filtros de la tienda)</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {INTENTIONS.map((i) => (
                <label
                  key={i.key}
                  className="cursor-pointer select-none rounded-full border px-3 py-1.5 text-xs transition-colors has-[:checked]:border-transparent"
                  style={{ color: i.color, borderColor: `${i.color}40`, backgroundColor: `${i.color}12` }}
                >
                  <input
                    type="checkbox"
                    name="intentions"
                    value={i.key}
                    defaultChecked={product?.intentions.includes(i.key)}
                    className="mr-1.5 align-middle accent-current"
                  />
                  {i.label}
                </label>
              ))}
            </div>
          </div>

          {/* Envío e inventario */}
          {puedeEnviarse && (
            <div className="sm:col-span-2 space-y-3 rounded-xl border border-card-border/60 bg-ocean-surface/30 p-4">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-ocean-glow">
                <Truck className="size-3.5" /> Envío e inventario
              </p>

              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" name="requires_shipping" checked={shipping} onChange={(e) => setShipping(e.target.checked)} className="accent-ocean-cyan" />
                Este producto se envía por transportadora
              </label>

              {shipping && (
                <>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input type="checkbox" name="track_stock" checked={track} onChange={(e) => setTrack(e.target.checked)} className="accent-ocean-cyan" />
                    Llevar control de existencias
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {track && (
                      <div>
                        <label className={label}>Unidades disponibles</label>
                        <input name="stock" type="number" min={0} defaultValue={product?.stock ?? 0} className={cn(input, "mt-1")} />
                      </div>
                    )}
                    <div>
                      <label className={label}>Peso (gramos, opcional)</label>
                      <input name="weight_g" type="number" min={0} defaultValue={product?.weight_g ?? ""} className={cn(input, "mt-1")} />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Archivo descargable */}
          <div className="sm:col-span-2 space-y-2 rounded-xl border border-card-border/60 bg-ocean-surface/30 p-4">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-ocean-glow">
              <Download className="size-3.5" /> Archivo descargable (opcional)
            </p>
            <p className="text-xs text-muted">
              PDF, audio o video que la clienta recibe apenas paga. Se guarda privado:
              el enlace caduca a los dos minutos, así no circula por WhatsApp.
            </p>
            {product?.digital_name && (
              <p className="text-xs text-success">Actual: {product.digital_name}</p>
            )}
            <input name="digital" type="file" className="block w-full rounded-xl border border-card-border bg-ocean-surface/50 px-3 py-2.5 text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-ocean-cyan/15 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ocean-cyan" />
          </div>

          <div>
            <label className={label}>Foto principal {product?.image_url && "(vacío = conservar)"}</label>
            <input name="image" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full rounded-xl border border-card-border bg-ocean-surface/50 px-3 py-2.5 text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-ocean-cyan/15 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ocean-cyan" />
          </div>
          <div>
            <label className={label}>Más fotos (se suman)</label>
            <input name="gallery" type="file" multiple accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full rounded-xl border border-card-border bg-ocean-surface/50 px-3 py-2.5 text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-ocean-cyan/15 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ocean-cyan" />
          </div>

          <div className="sm:col-span-2">
            <label className={label}>Aviso legal del producto (suplementos)</label>
            <textarea name="legal_note" rows={2} defaultValue={product?.legal_note ?? ""} className={cn(input, "mt-1 resize-y")} placeholder="Este producto no es un medicamento y no sustituye tratamiento médico…" />
          </div>

          <div className="sm:col-span-2 flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" name="featured" defaultChecked={product?.featured} className="accent-ocean-cyan" />
              <Star className="size-3.5 text-oceom-gold" /> Destacado
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" name="hide_from_shop" defaultChecked={product ? !product.is_public : false} className="accent-ocean-cyan" />
              Ocultar de la tienda pública
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pending} className="inline-flex h-10 items-center gap-2 rounded-xl bg-ocean-cyan px-4 text-sm font-medium text-[var(--ocean-abyss)] transition hover:brightness-110 disabled:opacity-60">
            {pending ? <><Loader2 className="size-4 animate-spin" /> Guardando…</> : "Guardar producto"}
          </button>
          {state?.error && (
            <span className="inline-flex items-center gap-1 text-sm text-danger">
              <AlertTriangle className="size-4" /> {state.error}
            </span>
          )}
          {state?.ok && (
            <span className="inline-flex items-center gap-1 text-sm text-success">
              <Check className="size-4" /> Guardado
            </span>
          )}
        </div>
      </form>

      {/* Las variantes necesitan un producto ya creado al que colgarse. */}
      {product && <VariantsEditor productId={product.id} variants={product.variants} basePrice={product.price_cop} />}
    </div>
  );
}

function ProductRow({ product, onEdit }: { product: AdminProduct; onEdit: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const hidden = product.status === "hidden";
  const agotado = product.track_stock && product.stock <= 0;

  const toggle = () => start(async () => { await toggleProductAction(product.id, hidden); router.refresh(); });
  const remove = () => start(async () => { await deleteProductAction(product.id); router.refresh(); });

  return (
    <li className={cn("glass flex items-center gap-3 rounded-xl px-4 py-3", hidden && "opacity-55")}>
      <div className="size-11 shrink-0 overflow-hidden rounded-lg bg-ocean-surface/60">
        {product.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-sm font-medium text-foreground">
          {product.title}
          {product.featured && <Star className="size-3 shrink-0 text-oceom-gold" />}
        </p>
        <p className="flex flex-wrap items-center gap-x-2 truncate text-xs text-muted">
          <span>{PRODUCT_KIND_LABEL[product.kind]}</span>
          <span>·</span>
          <span>{formatCop(product.price_cop)}</span>
          {product.variants.length > 0 && <span>· {product.variants.length} presentaciones</span>}
          {product.requires_shipping && (
            <span className="inline-flex items-center gap-1">
              · <Truck className="size-3" />
              {product.track_stock ? `${product.stock} u.` : "envío"}
            </span>
          )}
          {product.digital_path && (
            <span className="inline-flex items-center gap-1">· <Download className="size-3" /> archivo</span>
          )}
          {agotado && <span className="text-danger">· agotado</span>}
        </p>
      </div>
      <button onClick={onEdit} title="Editar" className="grid size-8 place-items-center rounded-lg text-muted hover:text-foreground">
        <Pencil className="size-4" />
      </button>
      <button onClick={toggle} disabled={pending} title={hidden ? "Publicar" : "Ocultar"} className="grid size-8 place-items-center rounded-lg text-muted hover:text-foreground disabled:opacity-50">
        {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
      {confirm ? (
        <div className="flex items-center gap-1">
          <button onClick={remove} disabled={pending} className="inline-flex items-center gap-1 rounded-lg bg-danger px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-60">
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : "Borrar"}
          </button>
          <button onClick={() => setConfirm(false)} className="grid size-8 place-items-center rounded-lg text-muted"><X className="size-4" /></button>
        </div>
      ) : (
        <button onClick={() => setConfirm(true)} title="Eliminar" className="grid size-8 place-items-center rounded-lg text-muted hover:text-danger">
          <Trash2 className="size-4" />
        </button>
      )}
    </li>
  );
}
