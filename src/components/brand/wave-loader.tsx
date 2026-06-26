/** Loading tipo ondas — estado de carga premium OCEOM. */
export function WaveLoader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="flex items-end gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="w-1.5 rounded-full bg-ocean-cyan [animation:var(--animate-float)]"
            style={{ height: `${12 + (i % 3) * 8}px`, animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      {label && <p className="text-sm text-muted">{label}</p>}
    </div>
  );
}
