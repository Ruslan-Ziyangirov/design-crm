import { cn } from "@/lib/utils";

export function SectionHeading({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <p className="font-display text-[length:var(--text-heading-sm)] font-semibold text-[var(--color-ink)]">{title}</p>
      {description && <p className="text-[length:var(--text-body-sm)] text-[var(--color-ink-muted)]">{description}</p>}
    </div>
  );
}
