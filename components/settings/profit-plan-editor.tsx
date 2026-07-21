"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { ProfitPlan } from "@/lib/db/schema";

const MONTH_LABELS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

function yearOptions() {
  const current = new Date().getFullYear();
  return [current - 1, current, current + 1];
}

export function ProfitPlanEditor({ initialPlans, initialYear }: { initialPlans: ProfitPlan[]; initialYear: number }) {
  const [year, setYear] = useState(initialYear);
  const [values, setValues] = useState<Record<number, string>>(() => toValueMap(initialPlans));
  const [savingMonth, setSavingMonth] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  function toValueMap(plans: ProfitPlan[]): Record<number, string> {
    const map: Record<number, string> = {};
    for (const p of plans) map[p.month] = String(p.targetProfit);
    return map;
  }

  useEffect(() => {
    if (year === initialYear) {
      setValues(toValueMap(initialPlans));
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/settings/profit-plan?year=${year}`)
      .then((r) => r.json())
      .then((plans: ProfitPlan[]) => {
        if (!cancelled) setValues(toValueMap(plans));
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  async function saveMonth(month: number) {
    const raw = values[month];
    const targetProfit = Number(raw);
    if (raw === undefined || raw === "" || isNaN(targetProfit) || targetProfit < 0) return;

    setSavingMonth(month);
    try {
      const res = await fetch("/api/settings/profit-plan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month, targetProfit }),
      });
      if (!res.ok) throw new Error();
      toast.success(`План на ${MONTH_LABELS[month - 1].toLowerCase()} ${year} сохранён`);
    } catch {
      toast.error("Не удалось сохранить план");
    } finally {
      setSavingMonth(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="font-display text-[14px] font-semibold text-[var(--color-ink)]">План по прибыли</p>
        <p className="text-[12.5px] text-[var(--color-ink-muted)]">
          Задайте цель по прибыли на каждый месяц — на дашборде появится прогресс план/факт и прогноз.
        </p>
      </div>

      <div className="flex flex-col gap-1.5 max-w-[180px]">
        <Label>Год</Label>
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearOptions().map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 ${loading ? "opacity-50" : ""}`}>
        {MONTH_LABELS.map((label, i) => {
          const month = i + 1;
          return (
            <div key={month} className="flex flex-col gap-1.5">
              <Label>{label}</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Не задан"
                value={values[month] ?? ""}
                onChange={(e) => setValues((prev) => ({ ...prev, [month]: e.target.value }))}
                onBlur={() => saveMonth(month)}
                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                disabled={savingMonth === month}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
