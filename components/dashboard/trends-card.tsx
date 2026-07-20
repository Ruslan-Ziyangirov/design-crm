import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatPercent } from "@/lib/format";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrendDirection } from "@/lib/calculations";

interface TrendItem {
  label: string;
  change: number | null;
  direction: TrendDirection;
}

export function TrendsCard({ items }: { items: TrendItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Тенденции (последний месяц к предыдущему)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-[13px] text-[var(--color-ink-muted)]">{item.label}</span>
            <span
              className={cn(
                "inline-flex items-center gap-1 font-numeric text-[13px] font-medium",
                item.direction === "up" && "text-[var(--color-positive)]",
                item.direction === "down" && "text-[var(--color-negative)]",
                item.direction === "flat" && "text-[var(--color-neutral)]",
              )}
            >
              {item.direction === "up" && <TrendingUp className="h-3.5 w-3.5" />}
              {item.direction === "down" && <TrendingDown className="h-3.5 w-3.5" />}
              {item.direction === "flat" && <Minus className="h-3.5 w-3.5" />}
              {formatPercent(item.change)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
