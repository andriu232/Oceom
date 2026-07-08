/** "hace X" en español, calculado en el servidor (páginas force-dynamic). */
export function TimeAgo({ iso }: { iso: string }) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 6e4);
  const hr = Math.floor(diff / 36e5);
  const day = Math.floor(diff / 864e5);

  let label: string;
  if (diff < 6e4) label = "ahora";
  else if (min < 60) label = `hace ${min} min`;
  else if (hr < 24) label = `hace ${hr} h`;
  else if (day < 7) label = `hace ${day} d`;
  else
    label = new Date(iso).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return <span className="text-xs text-muted">{label}</span>;
}
