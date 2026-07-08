import { EMOTION_BY_KEY, TONE_STYLE } from "@/config/bitacora";

/** Chip de emoción reutilizable (mismo lenguaje visual que la Bitácora del
 *  estudiante): punto de color + etiqueta por tono, sin emojis. RSC-safe. */
export function EmotionChip({
  emotion,
  intensity,
}: {
  emotion: string | null;
  intensity?: number | null;
}) {
  if (!emotion) {
    return (
      <span className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-1 text-xs text-muted">
        Sin emoción
      </span>
    );
  }
  const def = EMOTION_BY_KEY[emotion];
  const tone = def?.tone ?? "neutral";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${TONE_STYLE[tone].chip}`}
    >
      <span aria-hidden className={`size-1.5 rounded-full ${TONE_STYLE[tone].bar}`} />
      {def?.label ?? emotion}
      {typeof intensity === "number" ? (
        <span className="opacity-70">· {intensity}/10</span>
      ) : null}
    </span>
  );
}

/** "hace X" — tiempo relativo corto (server-side, con force-dynamic). */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const day = Math.floor(diff / 864e5);
  if (day >= 1) return `hace ${day} d`;
  const hr = Math.floor(diff / 36e5);
  if (hr >= 1) return `hace ${hr} h`;
  const min = Math.floor(diff / 6e4);
  if (min >= 1) return `hace ${min} min`;
  return "ahora";
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
