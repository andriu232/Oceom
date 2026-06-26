/** Utilidades de tiempo para la agenda. Todo se muestra en hora de Colombia
 *  (America/Bogota, UTC-5 sin horario de verano). */

export const BOGOTA = "America/Bogota";

/** Convierte un valor de <input type="datetime-local"> (hora local Colombia)
 *  a un ISO UTC para guardar en timestamptz. */
export function localToIso(datetimeLocal: string): string {
  // "2026-06-28T15:00" → interpretado como -05:00 (Colombia)
  return new Date(`${datetimeLocal}:00-05:00`).toISOString();
}

/** Clave de día (YYYY-MM-DD en hora Colombia) para agrupar. */
export function dayKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BOGOTA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

/** Etiqueta legible del día: "lunes, 28 de junio". */
export function formatDayLabel(iso: string): string {
  const s = new Intl.DateTimeFormat("es-CO", {
    timeZone: BOGOTA,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Hora legible: "3:00 p. m." */
export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: BOGOTA,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

export interface DayGroup<T> {
  key: string;
  label: string;
  items: T[];
}

/** Agrupa items por día (Colombia), ordenados. */
export function groupByDay<T>(items: T[], getIso: (x: T) => string): DayGroup<T>[] {
  const map = new Map<string, DayGroup<T>>();
  for (const it of items) {
    const iso = getIso(it);
    const key = dayKey(iso);
    if (!map.has(key)) {
      map.set(key, { key, label: formatDayLabel(iso), items: [] });
    }
    map.get(key)!.items.push(it);
  }
  return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
}
