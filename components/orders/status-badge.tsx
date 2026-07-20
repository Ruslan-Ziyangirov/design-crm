export function StatusBadge({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] font-medium whitespace-nowrap"
      style={{ background: `${color}1a`, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {name}
    </span>
  );
}
