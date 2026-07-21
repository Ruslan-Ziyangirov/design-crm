import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { calcProfitForecast } from "@/lib/calculations";
import { cn } from "@/lib/utils";

export function ProfitPlanCard({ plan, actual, now }: { plan: number | null; actual: number; now: Date }) {
  const monthLabel = now.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });

  if (plan === null || plan <= 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>План по прибыли — {monthLabel}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="text-[13px] text-[var(--color-ink-muted)]">
            План на этот месяц не задан. Факт пока: <span className="font-numeric font-semibold text-[var(--color-ink)]">{formatMoney(actual)}</span>
          </p>
          <Link href="/settings" className="w-fit text-[12.5px] text-[var(--color-accent)] hover:underline">
            Задать план в Настройках →
          </Link>
        </CardContent>
      </Card>
    );
  }

  const forecast = calcProfitForecast(actual, now);
  const percent = Math.round((actual / plan) * 100);
  const remaining = Math.max(plan - actual, 0);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(daysInMonth - now.getDate(), 0);
  const onTrack = forecast >= plan;
  const neededPerDay = daysRemaining > 0 ? Math.max(plan - actual, 0) / daysRemaining : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>План по прибыли — {monthLabel}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-neutral-soft)]">
            <div
              className={cn("h-full rounded-full", percent >= 100 ? "bg-[var(--color-positive)]" : "bg-[var(--color-accent)]")}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
          <p className="mt-1.5 text-[12px] text-[var(--color-ink-muted)]">{percent}% от плана выполнено</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <p className="text-[11.5px] text-[var(--color-ink-faint)]">План</p>
            <p className="font-numeric text-[15px] font-semibold text-[var(--color-ink)]">{formatMoney(plan)}</p>
          </div>
          <div>
            <p className="text-[11.5px] text-[var(--color-ink-faint)]">Факт</p>
            <p className="font-numeric text-[15px] font-semibold text-[var(--color-ink)]">{formatMoney(actual)}</p>
          </div>
          <div>
            <p className="text-[11.5px] text-[var(--color-ink-faint)]">Осталось</p>
            <p className="font-numeric text-[15px] font-semibold text-[var(--color-ink)]">{formatMoney(remaining)}</p>
          </div>
          <div>
            <p className="text-[11.5px] text-[var(--color-ink-faint)]">Прогноз</p>
            <p
              className={cn(
                "font-numeric text-[15px] font-semibold",
                onTrack ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]",
              )}
            >
              {formatMoney(forecast)}
            </p>
          </div>
        </div>

        <p
          className={cn(
            "rounded-[10px] px-3 py-2 text-[12.5px]",
            onTrack
              ? "bg-[var(--color-positive-soft)] text-[var(--color-positive)]"
              : "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
          )}
        >
          {onTrack
            ? `При текущем темпе план будет выполнен с опережением на ${formatMoney(forecast - plan)}.`
            : daysRemaining > 0
              ? `При текущем темпе не хватит ${formatMoney(plan - forecast)}. Нужно зарабатывать ещё ${formatMoney(neededPerDay)}/день, чтобы дойти до плана.`
              : `Месяц закончился, план не достигнут (не хватило ${formatMoney(remaining)}).`}
        </p>
      </CardContent>
    </Card>
  );
}
