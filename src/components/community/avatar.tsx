/** Avatar de autor: foto si hay, si no la inicial en un disco con gradiente. */
export function Avatar({
  name,
  url,
  className = "size-9 text-xs",
}: {
  name: string | null;
  url?: string | null;
  className?: string;
}) {
  const initial = (name?.[0] ?? "?").toUpperCase();
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt=""
        className={`${className} shrink-0 rounded-full object-cover`}
      />
    );
  }
  return (
    <span
      className={`${className} grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-ocean-glow to-ocean-violet font-semibold text-[var(--ocean-abyss)]`}
    >
      {initial}
    </span>
  );
}
