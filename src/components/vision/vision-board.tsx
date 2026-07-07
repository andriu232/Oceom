"use client";

import { useRef, useState, useTransition } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  Brain,
  Heart,
  Gem,
  Activity,
  Check,
  Plus,
  X,
  Pencil,
  Target,
} from "lucide-react";
import { VISION_AREAS, type VisionAreaDef, type VisionColor } from "@/config/vision";
import type { VisionBoard as VisionBoardData, VisionItem } from "@/lib/queries/vision";
import {
  saveVisionAreaAction,
  saveVisionTitleAction,
  addGoalAction,
  toggleGoalAction,
  removeGoalAction,
} from "@/lib/actions/vision";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  brain: Brain,
  heart: Heart,
  gem: Gem,
  activity: Activity,
};

const COLOR: Record<VisionColor, { text: string; bg: string; ring: string; bar: string; border: string }> = {
  violet: { text: "text-ocean-violet", bg: "bg-ocean-violet/12", ring: "ring-ocean-violet/30", bar: "bg-ocean-violet", border: "border-ocean-violet/30" },
  blue: { text: "text-oceom-blue", bg: "bg-oceom-blue/12", ring: "ring-oceom-blue/30", bar: "bg-oceom-blue", border: "border-oceom-blue/30" },
  magenta: { text: "text-oceom-magenta", bg: "bg-oceom-magenta/12", ring: "ring-oceom-magenta/30", bar: "bg-oceom-magenta", border: "border-oceom-magenta/30" },
  gold: { text: "text-oceom-gold", bg: "bg-oceom-gold/12", ring: "ring-oceom-gold/30", bar: "bg-oceom-gold", border: "border-oceom-gold/30" },
  turquoise: { text: "text-oceom-turquoise", bg: "bg-oceom-turquoise/12", ring: "ring-oceom-turquoise/30", bar: "bg-oceom-turquoise", border: "border-oceom-turquoise/30" },
};

export function VisionBoard({ board }: { board: VisionBoardData }) {
  return (
    <div className="space-y-8">
      <VisionTitle title={board.title} totalGoals={board.totalGoals} doneGoals={board.doneGoals} />

      <section className="grid gap-5 md:grid-cols-2">
        {VISION_AREAS.map((area) => (
          <VisionAreaCard key={area.key} area={area} item={board.itemsByArea[area.key]} />
        ))}
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Título / visión general del tablero                                         */
/* -------------------------------------------------------------------------- */
function VisionTitle({
  title,
  totalGoals,
  doneGoals,
}: {
  title: string | null;
  totalGoals: number;
  doneGoals: number;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await saveVisionTitleAction(undefined, formData);
      if (res?.ok) setEditing(false);
    });
  }

  const pct = totalGoals > 0 ? Math.round((doneGoals / totalGoals) * 100) : 0;

  return (
    <div className="glass-strong rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ocean-cyan">
            Mi visión
          </p>
          {editing ? (
            <form action={onSubmit} className="mt-2 flex flex-wrap items-center gap-2">
              <Input
                name="title"
                defaultValue={title ?? ""}
                placeholder="En una frase, ¿quién te estás convirtiendo?"
                className="w-full sm:w-96"
                autoFocus
              />
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Guardando…" : "Guardar"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="group mt-1.5 flex items-start gap-2 text-left"
            >
              <span className="font-display text-2xl font-bold text-foreground">
                {title || "Escribe tu visión de vida"}
              </span>
              <Pencil className="mt-2 size-4 shrink-0 text-muted/60 transition-colors group-hover:text-ocean-cyan" />
            </button>
          )}
        </div>

        {totalGoals > 0 && (
          <div className="text-right">
            <p className="font-display text-3xl font-bold tabular-nums text-foreground">{pct}%</p>
            <p className="text-xs text-muted">
              {doneGoals}/{totalGoals} metas cumplidas
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tarjeta de un área (visión + afirmación + metas)                            */
/* -------------------------------------------------------------------------- */
function VisionAreaCard({ area, item }: { area: VisionAreaDef; item: VisionItem | undefined }) {
  const c = COLOR[area.color];
  const Icon = ICONS[area.iconKey] ?? Target;
  const [editing, setEditing] = useState(false);
  const goals = item?.goals ?? [];
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>(undefined);

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await saveVisionAreaAction(undefined, formData);
      if (res?.ok) {
        setError(undefined);
        setEditing(false);
      } else {
        setError(res?.error);
      }
    });
  }

  const hasContent = !!item?.vision_text || !!item?.affirmation;

  return (
    <div className={cn("glass flex flex-col rounded-2xl p-6")}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("grid size-11 place-items-center rounded-2xl ring-1 ring-inset", c.bg, c.ring, c.text)}>
            <Icon className="size-5" />
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground">{area.label}</h3>
        </div>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="grid size-8 place-items-center rounded-lg text-muted/60 transition-colors hover:bg-white/5 hover:text-foreground"
          aria-label="Editar"
        >
          <Pencil className="size-4" />
        </button>
      </div>

      {editing ? (
        <form action={onSubmit} className="mt-4 space-y-3">
          <input type="hidden" name="area" value={area.key} />
          <textarea
            name="vision_text"
            defaultValue={item?.vision_text ?? ""}
            rows={3}
            placeholder={area.visionPlaceholder}
            className="w-full resize-y rounded-xl border border-card-border bg-ocean-surface/60 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/60 outline-none focus:border-ocean-cyan focus:ring-2 focus:ring-[var(--ring)]"
          />
          <Input
            name="affirmation"
            defaultValue={item?.affirmation ?? ""}
            placeholder={area.affirmationPlaceholder}
          />
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Guardando…" : "Guardar"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
            {error && <span className="text-xs text-danger">{error}</span>}
          </div>
        </form>
      ) : (
        <div className="mt-4">
          {hasContent ? (
            <>
              {item?.vision_text && (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
                  {item.vision_text}
                </p>
              )}
              {item?.affirmation && (
                <p className={cn("mt-3 border-l-2 pl-3 text-sm italic", c.border, c.text)}>
                  “{item.affirmation}”
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted">{area.desc}</p>
          )}
        </div>
      )}

      {/* Metas */}
      <div className="mt-5 flex-1 border-t border-card-border pt-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">Mis metas</p>
        <GoalList areaKey={area.key} goals={goals} barColor={c.bar} textColor={c.text} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Lista de metas de un área                                                   */
/* -------------------------------------------------------------------------- */
function GoalList({
  areaKey,
  goals,
  barColor,
  textColor,
}: {
  areaKey: string;
  goals: { text: string; done: boolean }[];
  barColor: string;
  textColor: string;
}) {
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const add = () => {
    const clean = text.trim();
    if (!clean) return;
    startTransition(async () => {
      await addGoalAction(areaKey, clean);
      setText("");
      inputRef.current?.focus();
    });
  };

  return (
    <div className="mt-3 space-y-2">
      {goals.length > 0 && (
        <ul className="space-y-1.5">
          {goals.map((g, i) => (
            <li key={i} className="group flex items-start gap-2.5">
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(async () => void (await toggleGoalAction(areaKey, i)))}
                className={cn(
                  "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
                  g.done ? cn(barColor, "border-transparent") : "border-card-border hover:border-ocean-cyan",
                )}
                aria-label={g.done ? "Marcar como pendiente" : "Marcar como cumplida"}
              >
                {g.done && <Check className="size-3.5 text-[var(--ocean-abyss)]" strokeWidth={3} />}
              </button>
              <span
                className={cn(
                  "flex-1 text-sm",
                  g.done ? "text-muted line-through" : "text-foreground/90",
                )}
              >
                {g.text}
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(async () => void (await removeGoalAction(areaKey, i)))}
                className="mt-0.5 shrink-0 text-muted/40 opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                aria-label="Eliminar meta"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2 pt-1">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Agregar una meta…"
          className="h-9 flex-1 rounded-lg border border-card-border bg-ocean-surface/60 px-3 text-sm text-foreground placeholder:text-muted/60 outline-none focus:border-ocean-cyan"
        />
        <button
          type="button"
          onClick={add}
          disabled={pending || !text.trim()}
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-lg border border-card-border transition-colors hover:bg-white/5 disabled:opacity-40",
            textColor,
          )}
          aria-label="Agregar meta"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}
