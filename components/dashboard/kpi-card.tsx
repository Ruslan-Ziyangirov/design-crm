import { cn } from "@/lib/utils";
import { formatMoney, formatPercent } from "@/lib/format";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Props {
  label: string;
  value: number;
  change?: number | null;
  format?: "money" | "number" | "percent";
  hint?: string;
}

export function KpiCard({ label, value, change, format = "money", hint }: Props) {
  const displayValue =
    format === "money" ? formatMoney(value) : format === "percent" ? `${value.toFixed(1)}%` : value.toLocaleString("ru-RU");

  const direction = change === null || change === undefined ? "flat" : change > 0.01 ? "up" : change < -0.01 ? "down" : "flat";

  return (
    <Card className="p-4">
      <p className="text-[12.5px] text-[var(--color-ink-muted)]">{label}</p>
      <p className="mt-1.5 font-numeric text-[22px] font-semibold leading-none text-[var(--color-ink)]">
        {displayValue}
      </p>
      <div className="mt-2 flex items-center gap-1.5">
        {change !== null && change !== undefined ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11.5px] font-medium font-numeric",
              direction === "up" && "bg-[var(--color-positive-soft)] text-[var(--color-positive)]",
              direction === "down" && "bg-[var(--color-negative-soft)] text-[var(--color-negative)]",
              direction === "flat" && "bg-[var(--color-neutral-soft)] text-[var(--color-neutral)]",
            )}
          >
            {direction === "up" && <ArrowUpRight className="h-3 w-3" />}
            {direction === "down" && <ArrowDownRight className="h-3 w-3" />}
            {direction === "flat" && <Minus className="h-3 w-3" />}
            {formatPercent(change)}
          </span>
        ) : (
          <span className="text-[11.5px] text-[var(--color-ink-faint)]">{hint || "текущее значение"}</span>
        )}
        {change !== null && change !== undefined && hint && (
          <span className="text-[11.5px] text-[var(--color-ink-faint)]">{hint}</span>
        )}
      </div>
    </Card>
  );
}
