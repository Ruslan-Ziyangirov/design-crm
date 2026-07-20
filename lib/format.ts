import { format as formatDateFns } from "date-fns";
import { ru } from "date-fns/locale";

export function formatMoney(value: number, currency: string = "RUB"): string {
  const symbol = currency === "RUB" ? "₽" : currency;
  const formatted = new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(Math.round(value));
  return `${formatted} ${symbol}`;
}

export function formatMoneyCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(".0", "")} млн ₽`;
  if (abs >= 1_000) return `${Math.round(value / 1000)} тыс ₽`;
  return formatMoney(value);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return formatDateFns(d, "dd.MM.yyyy", { locale: ru });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return formatDateFns(d, "dd.MM.yyyy HH:mm", { locale: ru });
}

export function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  const d = new Date(year, month - 1, 1);
  const label = formatDateFns(d, "LLLL yyyy", { locale: ru });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatPercent(value: number | null, withSign = true): string {
  if (value === null) return "—";
  const sign = withSign && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1).replace(/\.0$/, "")}%`;
}
