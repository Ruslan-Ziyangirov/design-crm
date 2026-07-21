import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatPercent } from "@/lib/format";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrendDirection } from "@/lib/calculations";

interface TrendItem {
  label: string;
  changeMoM: number | null;
  directionMoM: TrendDirection;
  changeYoY: number | null;
  directionYoY: TrendDirection;
}

function Badge({ change, direction }: { change: number | null; direction: TrendDirection }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-numeric text-[13px] font-medium",
        direction === "up" && "text-[var(--color-positive)]",
        direction === "down" && "text-[var(--color-negative)]",
        direction === "flat" && "text-[var(--color-neutral)]",
      )}
    >
      {direction === "up" && <TrendingUp className="h-3.5 w-3.5" />}
      {direction === "down" && <TrendingDown className="h-3.5 w-3.5" />}
      {direction === "flat" && <Minus className="h-3.5 w-3.5" />}
      {formatPercent(change)}
    </span>
  );
}

export function TrendsCard({ items }: { items: TrendItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Тенденции</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span />
          <div className="flex items-center gap-5">
            <span className="w-[70px] text-right text-[11px] text-[var(--color-ink-faint)]">к пред. месяцу</span>
            <span className="w-[70px] text-right text-[11px] text-[var(--color-ink-faint)]">к пред. году</span>
          </div>
        </div>
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-[13px] text-[var(--color-ink-muted)]">{item.label}</span>
            <div className="flex items-center gap-5">
              <span className="w-[70px] flex justify-end">
                <Badge change={item.changeMoM} direction={item.directionMoM} />
              </span>
              <span className="w-[70px] flex justify-end">
                <Badge change={item.changeYoY} direction={item.directionYoY} />
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
