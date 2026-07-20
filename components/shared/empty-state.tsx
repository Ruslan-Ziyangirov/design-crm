import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[16px] border border-dashed border-[var(--color-border-strong)] px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="font-display text-[15px] font-semibold text-[var(--color-ink)]">{title}</p>
        <p className="mt-1 max-w-sm text-[13px] text-[var(--color-ink-muted)]">{description}</p>
      </div>
      {action}
    </div>
  );
}
