import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]",
        positive: "bg-[var(--color-positive-soft)] text-[var(--color-positive)]",
        negative: "bg-[var(--color-negative-soft)] text-[var(--color-negative)]",
        warning: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
        info: "bg-[var(--color-info-soft)] text-[var(--color-info)]",
        neutral: "bg-[var(--color-neutral-soft)] text-[var(--color-neutral)]",
        outline: "border border-[var(--color-border)] text-[var(--color-ink-muted)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
