"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { updateProgramAction, type FormState } from "@/lib/actions/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProgramEditorData } from "@/lib/queries/admin-content";

const selectCls =
  "h-11 w-full rounded-xl border border-card-border bg-ocean-surface/60 px-4 text-sm text-foreground outline-none focus:border-ocean-cyan focus:ring-2 focus:ring-[var(--ring)]";

export function ProgramForm({ program }: { program: ProgramEditorData["program"] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateProgramAction,
    undefined,
  );

  return (
    <form action={action} className="glass space-y-5 rounded-2xl p-6">
      <input type="hidden" name="id" value={program.id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="title">Título</Label>
          <Input id="title" name="title" defaultValue={program.title} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug (URL)</Label>
          <Input id="slug" name="slug" defaultValue={program.slug} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="type">Tipo</Label>
          <select id="type" name="type" defaultValue={program.type} className={selectCls}>
            <option value="emotion">E-MOTION</option>
            <option value="neuropsychic">Neuropsíquica</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="subtitle">Subtítulo</Label>
          <Input id="subtitle" name="subtitle" defaultValue={program.subtitle ?? ""} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="description">Descripción</Label>
          <textarea
            id="description"
            name="description"
            defaultValue={program.description ?? ""}
            rows={4}
            className="w-full rounded-xl border border-card-border bg-ocean-surface/60 px-4 py-3 text-sm text-foreground outline-none focus:border-ocean-cyan focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="level">Nivel</Label>
          <Input id="level" name="level" defaultValue={program.level ?? ""} placeholder="Integral · 1 a 1" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="duration_label">Duración</Label>
          <Input id="duration_label" name="duration_label" defaultValue={program.duration_label ?? ""} placeholder="9 sesiones · 2h" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price_cop">Precio (COP)</Label>
          <Input id="price_cop" name="price_cop" type="number" defaultValue={program.price_cop ?? ""} placeholder="2200000" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Estado</Label>
          <select id="status" name="status" defaultValue={program.status} className={selectCls}>
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
            <option value="archived">Archivado</option>
          </select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="cover_image">Imagen de portada</Label>
          {program.cover_image_url && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={program.cover_image_url}
              alt="Portada actual"
              className="h-28 w-auto rounded-xl border border-card-border object-cover"
            />
          )}
          <input
            id="cover_image"
            name="cover_image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="block w-full rounded-xl border border-card-border bg-ocean-surface/60 px-4 py-2.5 text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-ocean-cyan/15 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ocean-cyan"
          />
          <p className="text-xs text-muted">
            JPG, PNG o WEBP (máx. 4 MB).{" "}
            {program.cover_image_url ? "Deja vacío para conservar la actual." : ""}
          </p>
          {/* Se conserva la URL actual si no se sube archivo nuevo. */}
          <input type="hidden" name="cover_image_url" value={program.cover_image_url ?? ""} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar cambios"}
        </Button>
        {state?.ok && (
          <span className="inline-flex items-center gap-1 text-sm text-success">
            <Check className="size-4" /> Guardado
          </span>
        )}
        {state?.error && <span className="text-sm text-danger">{state.error}</span>}
      </div>
    </form>
  );
}
