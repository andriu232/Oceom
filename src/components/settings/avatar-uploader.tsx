"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { updateAvatarAction, removeAvatarAction } from "@/lib/actions/avatar";

/** Subida de foto de perfil: muestra el avatar actual (o iniciales), permite
 *  cambiarlo o quitarlo. Avisa al formulario padre con `onChange` para que el
 *  campo oculto avatar_url no se borre al guardar el nombre. */
export function AvatarUploader({
  name,
  initialUrl,
  onChange,
}: {
  name: string;
  initialUrl: string;
  onChange?: (url: string) => void;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const initial = (name.trim().charAt(0) || "?").toUpperCase();

  function pick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (!file) return;
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    start(async () => {
      const res = await updateAvatarAction(undefined, fd);
      if (res?.error) {
        setError(res.error);
      } else if (res?.url !== undefined) {
        const next = res.url ?? "";
        setUrl(next);
        onChange?.(next);
      }
    });
  }

  function remove() {
    setError(null);
    start(async () => {
      const res = await removeAvatarAction();
      if (res?.error) setError(res.error);
      else {
        setUrl("");
        onChange?.("");
      }
    });
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <div className="size-16 overflow-hidden rounded-full ring-1 ring-inset ring-card-border">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={name} className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center bg-gradient-to-br from-ocean-glow to-ocean-violet text-xl font-semibold text-[var(--ocean-abyss)]">
              {initial}
            </div>
          )}
        </div>
        {pending && (
          <div className="absolute inset-0 grid place-items-center rounded-full bg-ocean-abyss/60">
            <Loader2 className="size-5 animate-spin text-ocean-cyan" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg border border-card-border bg-ocean-surface/40 px-3 py-2 text-sm text-foreground transition-colors hover:border-ocean-cyan/40 disabled:opacity-60"
          >
            <Camera className="size-4" /> Cambiar foto
          </button>
          {url && (
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg border border-card-border px-3 py-2 text-sm text-muted transition-colors hover:border-danger/40 hover:text-danger disabled:opacity-60"
            >
              <Trash2 className="size-4" /> Quitar
            </button>
          )}
        </div>
        <p className="text-xs text-muted">JPG, PNG, WebP o GIF · máx. 5 MB.</p>
        {error && <p className="text-xs text-danger">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={pick}
          className="hidden"
        />
      </div>
    </div>
  );
}
