"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const PERIOD_OPTIONS = [
  { value: "current_month", label: "Текущий месяц" },
  { value: "last_month", label: "Прошлый месяц" },
  { value: "last_3", label: "Последние 3 месяца" },
  { value: "last_6", label: "Последние 6 месяцев" },
  { value: "current_year", label: "Текущий год" },
  { value: "last_year", label: "Прошлый год" },
];

const COMPARE_OPTIONS = [
  { value: "previous", label: "С предыдущим периодом" },
  { value: "last_year", label: "С тем же периодом год назад" },
];

export function PeriodSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const period = searchParams.get("period") || "current_month";
  const compare = searchParams.get("compare") || "previous";

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={period} onValueChange={(v) => update("period", v)}>
        <SelectTrigger className="w-[190px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERIOD_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={compare} onValueChange={(v) => update("compare", v)}>
        <SelectTrigger className="w-[220px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {COMPARE_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
