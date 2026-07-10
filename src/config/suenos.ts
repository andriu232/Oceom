/** Catálogo del Diario de sueños. Serializable (server-safe): se usa en la
 *  página server y en el compositor cliente. El tipo se guarda por `key` en
 *  dream_entries.dream_type; el resto es presentación. */

export interface DreamTypeDef {
  key: string;
  label: string;
  emoji: string;
  desc: string;
}

export const DREAM_TYPES: DreamTypeDef[] = [
  { key: "normal", label: "Sueño", emoji: "🌙", desc: "Un sueño común" },
  { key: "lucido", label: "Lúcido", emoji: "✨", desc: "Sabías que estabas soñando" },
  { key: "recurrente", label: "Recurrente", emoji: "🔁", desc: "Se repite en el tiempo" },
  { key: "pesadilla", label: "Pesadilla", emoji: "🌊", desc: "Angustiante o perturbador" },
  { key: "revelador", label: "Revelador", emoji: "🔮", desc: "Sentiste que traía un mensaje" },
];

export const DREAM_TYPE_BY_KEY: Record<string, DreamTypeDef> = Object.fromEntries(
  DREAM_TYPES.map((t) => [t.key, t]),
);

/** Etiqueta legible de un tipo de sueño (cae al key si es desconocido). */
export function dreamTypeLabel(key: string | null | undefined): string {
  if (!key) return "";
  return DREAM_TYPE_BY_KEY[key]?.label ?? key;
}
