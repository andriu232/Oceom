/** Catálogo de emociones de la Bitácora Interior. Dato serializable (server-safe):
 *  se usa tanto en la página server como en el compositor cliente. La emoción se
 *  guarda por `key` en journal_entries.emotion; el resto es presentación. */

export type EmotionTone = "positive" | "neutral" | "hard";

export interface EmotionDef {
  key: string;
  label: string;
  emoji: string;
  tone: EmotionTone;
}

export const EMOTIONS: EmotionDef[] = [
  { key: "alegria", label: "Alegría", emoji: "😊", tone: "positive" },
  { key: "gratitud", label: "Gratitud", emoji: "🙏", tone: "positive" },
  { key: "calma", label: "Calma", emoji: "🌊", tone: "positive" },
  { key: "amor", label: "Amor", emoji: "💗", tone: "positive" },
  { key: "motivacion", label: "Motivación", emoji: "🔥", tone: "positive" },
  { key: "neutral", label: "Neutral", emoji: "😐", tone: "neutral" },
  { key: "ansiedad", label: "Ansiedad", emoji: "😰", tone: "hard" },
  { key: "tristeza", label: "Tristeza", emoji: "😔", tone: "hard" },
  { key: "miedo", label: "Miedo", emoji: "😨", tone: "hard" },
  { key: "enojo", label: "Enojo", emoji: "😤", tone: "hard" },
  { key: "cansancio", label: "Cansancio", emoji: "😴", tone: "hard" },
];

export const EMOTION_BY_KEY: Record<string, EmotionDef> = Object.fromEntries(
  EMOTIONS.map((e) => [e.key, e]),
);

/** Clases Tailwind por tono (texto + fondo suave + relleno de barra). */
export const TONE_STYLE: Record<EmotionTone, { text: string; chip: string; bar: string }> = {
  positive: { text: "text-oceom-turquoise", chip: "bg-oceom-turquoise/12 text-oceom-turquoise", bar: "bg-oceom-turquoise" },
  neutral: { text: "text-muted", chip: "bg-white/5 text-muted", bar: "bg-ocean-violet" },
  hard: { text: "text-oceom-magenta", chip: "bg-oceom-magenta/12 text-oceom-magenta", bar: "bg-oceom-magenta" },
};

/** Descripción legible de una emoción por su key (cae al key si es desconocida). */
export function emotionLabel(key: string | null | undefined): string {
  if (!key) return "";
  return EMOTION_BY_KEY[key]?.label ?? key;
}
