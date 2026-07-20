import {
  aggregateOrders,
  calcChangePercent,
  distributionBy,
  findBestMonths,
  isOverdue,
  trendDirection,
  type OrderForCalc,
  type MonthBucket,
} from "@/lib/calculations";
import type { ProjectStatus, Source, ServiceType, Client } from "@/lib/db/schema";

export type PeriodKey =
  | "current_month"
  | "last_month"
  | "last_3"
  | "last_6"
  | "current_year"
  | "last_year"
  | "custom";

export interface PeriodRange {
  from: Date;
  to: Date;
}

export function resolvePeriod(period: PeriodKey, now: Date, customFrom?: string, customTo?: string): PeriodRange {
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (period) {
    case "current_month":
      return { from: new Date(y, m, 1), to: new Date(y, m + 1, 0, 23, 59, 59) };
    case "last_month":
      return { from: new Date(y, m - 1, 1), to: new Date(y, m, 0, 23, 59, 59) };
    case "last_3":
      return { from: new Date(y, m - 2, 1), to: new Date(y, m + 1, 0, 23, 59, 59) };
    case "last_6":
      return { from: new Date(y, m - 5, 1), to: new Date(y, m + 1, 0, 23, 59, 59) };
    case "current_year":
      return { from: new Date(y, 0, 1), to: new Date(y, 11, 31, 23, 59, 59) };
    case "last_year":
      return { from: new Date(y - 1, 0, 1), to: new Date(y - 1, 11, 31, 23, 59, 59) };
    case "custom":
      return {
        from: customFrom ? new Date(customFrom) : new Date(y, m, 1),
        to: customTo ? new Date(customTo) : now,
      };
    default:
      return { from: new Date(y, m, 1), to: new Date(y, m + 1, 0, 23, 59, 59) };
  }
}

/** Возвращает предыдущий период такой же длины, непосредственно перед текущим. */
export function previousPeriod(range: PeriodRange): PeriodRange {
  const durationMs = range.to.getTime() - range.from.getTime();
  const to = new Date(range.from.getTime() - 1);
  const from = new Date(to.getTime() - durationMs);
  return { from, to };
}

/** Тот же период, но годом ранее. */
export function sameRangeLastYear(range: PeriodRange): PeriodRange {
  return {
    from: new Date(range.from.getFullYear() - 1, range.from.getMonth(), range.from.getDate()),
    to: new Date(range.to.getFullYear() - 1, range.to.getMonth(), range.to.getDate(), 23, 59, 59),
  };
}

function inRange(date: Date | null, range: PeriodRange): boolean {
  if (!date) return false;
  return date.getTime() >= range.from.getTime() && date.getTime() <= range.to.getTime();
}

function filterByRange(orders: OrderForCalc[], range: PeriodRange): OrderForCalc[] {
  return orders.filter((o) => inRange(o.createdAt, range));
}

export function buildDashboard({
  orders,
  clients,
  statuses,
  sources,
  serviceTypes,
  range,
  compareMode,
  now,
}: {
  orders: OrderForCalc[];
  clients: Pick<Client, "id" | "createdAt">[];
  statuses: ProjectStatus[];
  sources: Source[];
  serviceTypes: ServiceType[];
  range: PeriodRange;
  compareMode: "previous" | "last_year";
  now: Date;
}) {
  const currentOrders = filterByRange(orders, range);
  const compareRange = compareMode === "previous" ? previousPeriod(range) : sameRangeLastYear(range);
  const compareOrders = filterByRange(orders, compareRange);

  const current = aggregateOrders(currentOrders);
  const previous = aggregateOrders(compareOrders);

  const newClientsCurrent = clients.filter((c) => inRange(c.createdAt, range)).length;
  const newClientsPrevious = clients.filter((c) => inRange(c.createdAt, compareRange)).length;

  const completedCurrent = currentOrders.filter((o) => o.statusCategory === "done").length;
  const completedPrevious = compareOrders.filter((o) => o.statusCategory === "done").length;

  const activeProjects = orders.filter((o) => o.statusCategory === "active").length;
  const overdueProjects = orders.filter((o) => isOverdue(o, now)).length;
  const outstanding = aggregateOrders(orders.filter((o) => o.statusCategory !== "cancelled")).outstanding;

  const kpis = {
    revenue: { value: current.revenue, change: calcChangePercent(current.revenue, previous.revenue) },
    expenses: { value: current.expenses, change: calcChangePercent(current.expenses, previous.expenses) },
    profit: { value: current.profit, change: calcChangePercent(current.profit, previous.profit) },
    orderCount: { value: current.orderCount, change: calcChangePercent(current.orderCount, previous.orderCount) },
    averageCheck: { value: current.averageCheck, change: calcChangePercent(current.averageCheck, previous.averageCheck) },
    margin: { value: current.margin, change: calcChangePercent(current.margin, previous.margin) },
    activeProjects: { value: activeProjects, change: null as number | null },
    outstanding: { value: outstanding, change: null as number | null },
    newClients: { value: newClientsCurrent, change: calcChangePercent(newClientsCurrent, newClientsPrevious) },
    completedProjects: { value: completedCurrent, change: calcChangePercent(completedCurrent, completedPrevious) },
    overdueProjects: { value: overdueProjects, change: null as number | null },
  };

  // ---- Помесячные ряды (последние 12 месяцев, независимо от выбранного периода) ----
  const monthBuckets: MonthBucket[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bucketRange: PeriodRange = { from: d, to: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59) };
    const bucketOrders = filterByRange(orders, bucketRange);
    monthBuckets.push({
      key,
      label: monthLabel(d),
      financials: aggregateOrders(bucketOrders),
      newClients: clients.filter((c) => inRange(c.createdAt, bucketRange)).length,
    });
  }

  const bestMonths = findBestMonths(monthBuckets);

  // ---- Тренды: последний полный месяц против предыдущего ----
  const lastMonth = monthBuckets[monthBuckets.length - 1];
  const prevMonth = monthBuckets[monthBuckets.length - 2];
  const trends = {
    revenue: calcChangePercent(lastMonth.financials.revenue, prevMonth?.financials.revenue ?? 0),
    profit: calcChangePercent(lastMonth.financials.profit, prevMonth?.financials.profit ?? 0),
    averageCheck: calcChangePercent(lastMonth.financials.averageCheck, prevMonth?.financials.averageCheck ?? 0),
    newClients: calcChangePercent(lastMonth.newClients, prevMonth?.newClients ?? 0),
    expenses: calcChangePercent(lastMonth.financials.expenses, prevMonth?.financials.expenses ?? 0),
  };
  const trendDirections = {
    revenue: trendDirection(trends.revenue),
    profit: trendDirection(trends.profit),
    averageCheck: trendDirection(trends.averageCheck),
    newClients: trendDirection(trends.newClients),
    expenses: trendDirection(trends.expenses),
  };

  // ---- Распределения ----
  const sourceMap = Object.fromEntries(sources.map((s) => [s.id, s.name]));
  const serviceMap = Object.fromEntries(serviceTypes.map((s) => [s.id, s.name]));
  const bySource = distributionBy(orders, (o) => (o.sourceId ? sourceMap[o.sourceId] ?? "Другое" : "Не указан"));
  const byService = distributionBy(orders, (o) => (o.serviceTypeId ? serviceMap[o.serviceTypeId] ?? "Другое" : "Другое"));

  // ---- Воронка: активные + завершённые статусы в порядке пайплайна ----
  const pipelineStatuses = [...statuses]
    .filter((s) => s.category === "active" || s.category === "done")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const activeOrdersOnly = orders.filter((o) => o.statusCategory !== "cancelled" && o.statusCategory !== "archived");
  const funnel = pipelineStatuses.map((s) => ({
    name: s.name,
    color: s.color,
    count: activeOrdersOnly.filter((o) => o.statusId === s.id).length,
  }));

  return {
    kpis,
    monthBuckets,
    bestMonths,
    trends,
    trendDirections,
    bySource,
    byService,
    funnel,
  };
}

function monthLabel(d: Date): string {
  const months = [
    "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
    "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
  ];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}
