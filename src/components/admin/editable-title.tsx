"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

/** Título editable inline: guarda al perder foco (o Enter) vía server action. */
export function EditableTitle({
  initial,
  save,
  className,
}: {
  initial: string;
  save: (title: string) => Promise<void>;
  className?: string;
}) {
  const [value, setValue] = useState(initial);
  const [pending, start] = useTransition();

  function commit() {
    const v = value.trim();
    if (v && v !== initial) start(() => save(v));
  }

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        }
      }}
      disabled={pending}
      className={cn(
        "w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-foreground outline-none transition-colors hover:border-card-border focus:border-ocean-cyan focus:bg-ocean-surface/50",
        className,
      )}
    />
  );
}
