import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import type { MonthBucket } from "@/lib/calculations";
import { Trophy } from "lucide-react";

export function BestMonthsCard({
  best,
}: {
  best: {
    byRevenue: MonthBucket;
    byProfit: MonthBucket;
    byOrderCount: MonthBucket;
    byAvgCheck: MonthBucket;
  } | null;
}) {
  if (!best) return null;

  const items = [
    { label: "Лучшая выручка", month: best.byRevenue, value: formatMoney(best.byRevenue.financials.revenue) },
    { label: "Лучшая прибыль", month: best.byProfit, value: formatMoney(best.byProfit.financials.profit) },
    { label: "Больше всего заказов", month: best.byOrderCount, value: `${best.byOrderCount.financials.orderCount} заказов` },
    { label: "Самый высокий средний чек", month: best.byAvgCheck, value: formatMoney(best.byAvgCheck.financials.averageCheck) },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[var(--color-warning)]" />
          Лучшие месяцы
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-[10px] border border-[var(--color-border)] p-3">
            <p className="text-[12px] text-[var(--color-ink-muted)]">{item.label}</p>
            <p className="mt-1 font-numeric text-[15px] font-semibold text-[var(--color-ink)]">{item.value}</p>
            <p className="text-[11.5px] text-[var(--color-ink-faint)]">{item.month.label}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
