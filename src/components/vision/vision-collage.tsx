"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  Brain,
  Heart,
  Gem,
  Activity,
  Compass,
  Plus,
  Loader2,
  X,
  Trash2,
  ImagePlus,
} from "lucide-react";
import { VISION_AREAS, type VisionColor } from "@/config/vision";
import type { VisionImage } from "@/lib/queries/vision";
import {
  uploadVisionImagesAction,
  deleteVisionImageAction,
} from "@/lib/actions/vision-images";
import { cn } from "@/lib/utils";

/* ============================================================
   Vision Board de OCEOM — collage (masonry) de las imágenes que el estudiante
   sube para representar sus metas, por área. Sube una o varias por apartado;
   se despliegan como un tablero de visión digital.
   ============================================================ */

interface CatDef {
  key: string;
  label: string;
  icon: LucideIcon;
  color: VisionColor | "cyan";
}

const AREA_ICON: Record<string, LucideIcon> = {
  espiritual: Sparkles,
  mental: Brain,
  emocional: Heart,
  financiera: Gem,
  fisica: Activity,
};

const CATS: CatDef[] = [
  { key: "general", label: "Mi Visión", icon: Compass, color: "cyan" },
  ...VISION_AREAS.map((a) => ({
    key: a.key,
    label: a.label.replace("Meta ", ""),
    icon: AREA_ICON[a.iconKey] ?? Sparkles,
    color: a.color,
  })),
];

const COLOR: Record<string, { text: string; ring: string; bg: string; chip: string }> = {
  cyan: { text: "text-ocean-cyan", ring: "ring-ocean-cyan/40", bg: "bg-ocean-cyan/10", chip: "bg-ocean-cyan/15 text-ocean-cyan" },
  violet: { text: "text-ocean-violet", ring: "ring-ocean-violet/40", bg: "bg-ocean-violet/10", chip: "bg-ocean-violet/15 text-ocean-violet" },
  blue: { text: "text-oceom-blue", ring: "ring-oceom-blue/40", bg: "bg-oceom-blue/10", chip: "bg-oceom-blue/15 text-oceom-blue" },
  magenta: { text: "text-oceom-magenta", ring: "ring-oceom-magenta/40", bg: "bg-oceom-magenta/10", chip: "bg-oceom-magenta/15 text-oceom-magenta" },
  gold: { text: "text-oceom-gold", ring: "ring-oceom-gold/40", bg: "bg-oceom-gold/10", chip: "bg-oceom-gold/15 text-oceom-gold" },
  turquoise: { text: "text-oceom-turquoise", ring: "ring-oceom-turquoise/40", bg: "bg-oceom-turquoise/10", chip: "bg-oceom-turquoise/15 text-oceom-turquoise" },
};

const catByKey = (k: string) => CATS.find((c) => c.key === k) ?? CATS[0];

export function VisionCollage({ images }: { images: VisionImage[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const areaRef = useRef<string>("general");
  const [pendingArea, setPendingArea] = useState<string | null>(null);
  const [, startUpload] = useTransition();
  const [filter, setFilter] = useState<string>("todas");
  const [open, setOpen] = useState<VisionImage | null>(null);

  function pick(area: string) {
    areaRef.current = area;
    fileRef.current?.click();
  }

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const area = areaRef.current;
    const fd = new FormData();
    fd.set("area", area);
    Array.from(files).forEach((f) => fd.append("files", f));
    e.target.value = "";
    setPendingArea(area);
    startUpload(async () => {
      await uploadVisionImagesAction(undefined, fd);
      setPendingArea(null);
      router.refresh();
    });
  }

  const shown =
    filter === "todas" ? images : images.filter((i) => i.area === filter);
  const countByArea = (k: string) => images.filter((i) => i.area === k).length;
  const hasImages = images.length > 0;

  return (
    <div className="space-y-6">
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={onFiles}
      />

      {/* Subir por apartado */}
      <div className="glass rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <ImagePlus className="size-5 text-ocean-cyan" />
          <h2 className="font-display text-lg font-semibold text-foreground">
            {hasImages ? "Suma más imágenes a tu visión" : "Construye tu tablero de visión"}
          </h2>
        </div>
        <p className="mt-1 text-sm text-muted">
          Sube una o varias imágenes que representen cada meta. Se armarán en un
          collage vivo de tu mejor versión.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {CATS.map((c) => {
            const col = COLOR[c.color];
            const busy = pendingArea === c.key;
            const n = countByArea(c.key);
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => pick(c.key)}
                disabled={busy}
                className={cn(
                  "group relative flex flex-col items-center gap-2 rounded-xl border border-card-border bg-ocean-surface/40 px-3 py-4 text-center transition-all hover:-translate-y-0.5",
                  col.ring,
                  "hover:ring-1",
                )}
              >
                <span className={cn("grid size-9 place-items-center rounded-lg", col.bg, col.text)}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <c.icon className="size-4" />}
                </span>
                <span className="text-xs font-medium text-foreground/85">{c.label}</span>
                <span className="flex items-center gap-1 text-[0.65rem] text-muted">
                  {n > 0 ? `${n} img` : <><Plus className="size-3" /> Subir</>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Collage */}
      {!hasImages ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-ocean-cyan/10 text-ocean-cyan">
            <ImagePlus className="size-7" />
          </div>
          <p className="mt-4 font-display text-lg font-semibold text-foreground">
            Tu tablero de visión está en blanco
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Elige un apartado arriba y sube las imágenes que representan la vida
            que estás creando. Verlas a diario reprograma tu mente.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filtro por área */}
          <div className="flex flex-wrap gap-2">
            <FilterChip active={filter === "todas"} onClick={() => setFilter("todas")}>
              Todas · {images.length}
            </FilterChip>
            {CATS.filter((c) => countByArea(c.key) > 0).map((c) => (
              <FilterChip
                key={c.key}
                active={filter === c.key}
                colorClass={COLOR[c.color].chip}
                onClick={() => setFilter(c.key)}
              >
                {c.label} · {countByArea(c.key)}
              </FilterChip>
            ))}
          </div>

          {/* Masonry collage */}
          <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
            {shown.map((img, i) => {
              const c = catByKey(img.area);
              const col = COLOR[c.color];
              return (
                <figure
                  key={img.id}
                  className={cn(
                    "group relative break-inside-avoid overflow-hidden rounded-2xl ring-1 ring-inset transition-all hover:z-10 hover:-translate-y-0.5",
                    col.ring,
                  )}
                  style={{ animation: `galeria-zoom 0.4s ease ${Math.min(i * 40, 400)}ms both` }}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(img)}
                    className="block w-full"
                    aria-label={`Ver imagen de ${c.label}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt=""
                      loading="lazy"
                      className="w-full transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </button>
                  {/* Overlay */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-ocean-abyss/80 to-transparent p-2.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className={cn("rounded-full px-2 py-0.5 text-[0.6rem] font-medium", col.chip)}>
                      {c.label}
                    </span>
                  </div>
                  <DeleteButton
                    id={img.id}
                    onDeleted={() => router.refresh()}
                  />
                </figure>
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-abyss/92 p-3 backdrop-blur-md sm:p-6"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(null)}
        >
          <button
            onClick={() => setOpen(null)}
            aria-label="Cerrar"
            className="fixed right-4 top-4 z-10 grid size-11 place-items-center rounded-full bg-white/8 text-foreground/90 backdrop-blur transition-colors hover:bg-white/16"
          >
            <X className="size-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={open.url}
            alt=""
            style={{ animation: "galeria-zoom 0.3s ease both" }}
            className="max-h-[90vh] max-w-[95vw] rounded-lg object-contain shadow-[0_30px_90px_-30px_rgba(0,0,0,0.85)]"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  colorClass,
  onClick,
  children,
}: {
  active: boolean;
  colorClass?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? colorClass ?? "bg-ocean-cyan/15 text-ocean-cyan"
          : "border border-card-border text-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function DeleteButton({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);

  if (confirm) {
    return (
      <div className="absolute right-2 top-2 flex gap-1">
        <button
          type="button"
          onClick={() => start(async () => { await deleteVisionImageAction(id); onDeleted(); })}
          disabled={pending}
          className="grid size-8 place-items-center rounded-lg bg-danger text-white"
          aria-label="Confirmar borrado"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        </button>
        <button
          type="button"
          onClick={() => setConfirm(false)}
          className="grid size-8 place-items-center rounded-lg bg-white/10 text-foreground"
          aria-label="Cancelar"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirm(true)}
      className="absolute right-2 top-2 grid size-8 place-items-center rounded-lg bg-ocean-abyss/60 text-foreground/80 opacity-0 backdrop-blur transition-opacity hover:text-danger group-hover:opacity-100"
      aria-label="Eliminar imagen"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
