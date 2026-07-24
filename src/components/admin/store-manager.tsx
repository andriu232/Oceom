"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Check,
  AlertTriangle,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  X,
  Plus,
} from "lucide-react";
import {
  saveProductAction,
  toggleProductAction,
  deleteProductAction,
  type StoreState,
} from "@/lib/actions/store";
import { PRODUCT_KINDS, PRODUCT_KIND_LABEL, formatCop } from "@/config/store";
import type { StoreProduct } from "@/lib/queries/store";
import { cn } from "@/lib/utils";

interface ProgramOpt {
  id: string;
  title: string;
}

const inputCls =
  "w-full rounded-xl border border-card-border bg-ocean-surface/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-ocean-cyan/40 focus:outline-none";

export function StoreManager({
  products,
  programs,
}: {
  products: StoreProduct[];
  programs: ProgramOpt[];
}) {
  const [editing, setEditing] = useState<StoreProduct | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6">
      {(creating || editing) && (
        <ProductForm
          key={editing?.id ?? "new"}
          product={editing}
          programs={programs}
          onDone={() => {
            setEditing(null);
            setCreating(false);
          }}
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
            <ProductRow key={p.id} product={p} onEdit={() => setEditing(p)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ProductForm({
  product,
  programs,
  onDone,
}: {
  product: StoreProduct | null;
  programs: ProgramOpt[];
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState<StoreState, FormData>(
    saveProductAction,
    undefined,
  );
  const [kind, setKind] = useState(product?.kind ?? "program");
  const router = useRouter();
  const doneRef = useRef(false);

  useEffect(() => {
    if (state?.ok && !doneRef.current) {
      doneRef.current = true;
      router.refresh();
      onDone();
    }
  }, [state?.ok, router, onDone]);

  return (
    <form action={action} className="glass space-y-4 rounded-2xl p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-foreground">
          {product ? "Editar producto" : "Nuevo producto"}
        </h3>
        <button type="button" onClick={onDone} className="text-muted hover:text-foreground">
          <X className="size-5" />
        </button>
      </div>
      {product && <input type="hidden" name="id" value={product.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-muted">Título</label>
          <input name="title" required defaultValue={product?.title} className={cn(inputCls, "mt-1")} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Tipo</label>
          <select
            name="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
            className={cn(inputCls, "mt-1")}
          >
            {PRODUCT_KINDS.map((k) => (
              <option key={k.key} value={k.key}>
                {k.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Precio (COP)</label>
          <input
            name="price_cop"
            type="number"
            min={1000}
            step={1000}
            required
            defaultValue={product?.price_cop}
            className={cn(inputCls, "mt-1")}
          />
        </div>

        {kind === "program" && (
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted">
              Programa al que inscribe (al pagar)
            </label>
            <select name="program_id" defaultValue={product?.program_id ?? ""} className={cn(inputCls, "mt-1")}>
              <option value="">— Elige un programa —</option>
              {programs.map((pr) => (
                <option key={pr.id} value={pr.id}>
                  {pr.title}
                </option>
              ))}
            </select>
          </div>
        )}
        {kind === "membership" && (
          <div>
            <label className="text-xs font-medium text-muted">Días de acceso</label>
            <input
              name="membership_days"
              type="number"
              min={1}
              defaultValue={product?.membership_days ?? 30}
              className={cn(inputCls, "mt-1")}
            />
          </div>
        )}

        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-muted">Subtítulo (opcional)</label>
          <input name="subtitle" defaultValue={product?.subtitle ?? ""} className={cn(inputCls, "mt-1")} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-muted">Descripción (opcional)</label>
          <textarea
            name="description"
            rows={4}
            defaultValue={product?.description ?? ""}
            className={cn(inputCls, "mt-1 resize-y")}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-muted">Incluye — un beneficio por línea (opcional)</label>
          <textarea
            name="benefits"
            rows={3}
            defaultValue={product?.benefits.join("\n") ?? ""}
            className={cn(inputCls, "mt-1 resize-y")}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-muted">
            Imagen {product?.image_url ? "(dejar vacío para conservar la actual)" : "(opcional)"}
          </label>
          <input
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="mt-1 block w-full rounded-xl border border-card-border bg-ocean-surface/50 px-3 py-2.5 text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-ocean-cyan/15 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ocean-cyan"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-ocean-cyan px-4 text-sm font-medium text-[var(--ocean-abyss)] transition hover:brightness-110 disabled:opacity-60"
        >
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
  );
}

function ProductRow({ product, onEdit }: { product: StoreProduct; onEdit: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const hidden = product.status === "hidden";

  const toggle = () =>
    start(async () => {
      await toggleProductAction(product.id, hidden);
      router.refresh();
    });
  const remove = () =>
    start(async () => {
      await deleteProductAction(product.id);
      router.refresh();
    });

  return (
    <li className={cn("glass flex items-center gap-3 rounded-xl px-4 py-3", hidden && "opacity-55")}>
      <div className="size-11 shrink-0 overflow-hidden rounded-lg bg-ocean-surface/60">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{product.title}</p>
        <p className="truncate text-xs text-muted">
          {PRODUCT_KIND_LABEL[product.kind]} · {formatCop(product.price_cop)}
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
