/**
 * Модуль финансовых расчётов.
 *
 * Все функции чистые (без обращений к БД/сети), что делает их легко
 * тестируемыми и переиспользуемыми и на сервере, и в клиентских компонентах
 * (например, для мгновенного пересчёта в форме заказа перед сохранением).
 */

export type OrderStatusCategory = "active" | "done" | "cancelled" | "archived";

export interface OrderFinancials {
  paymentReceived: number;
  expenses: number;
  profitOverride?: number | null;
}

export interface OrderForCalc extends OrderFinancials {
  id: string;
  statusId: string;
  statusCategory: OrderStatusCategory;
  deadline: Date | null;
  createdAt: Date;
  completedDate: Date | null;
  startDate: Date | null;
  clientId: string;
  serviceTypeId: string | null;
  sourceId: string | null;
}

/** Прибыль = ручной override, если указан, иначе полученная оплата − расходы. */
export function calcProfit({ paymentReceived, expenses, profitOverride }: OrderFinancials): number {
  if (profitOverride !== undefined && profitOverride !== null) return round2(profitOverride);
  return round2(paymentReceived - expenses);
}

/** Рентабельность (маржинальность) = прибыль / выручка * 100. */
export function calcMargin(revenue: number, profit: number): number {
  if (revenue <= 0) return 0;
  return round2((profit / revenue) * 100);
}

/** Средний чек = суммарная выручка / количество заказов. */
export function calcAverageCheck(totalRevenue: number, orderCount: number): number {
  if (orderCount <= 0) return 0;
  return round2(totalRevenue / orderCount);
}

/**
 * Процент изменения текущего значения относительно предыдущего периода.
 * Возвращает null, если сравнение невозможно (прошлый период = 0 и текущий = 0).
 */
export function calcChangePercent(current: number, previous: number): number | null {
  if (previous === 0) {
    if (current === 0) return null;
    return 100; // рост "с нуля" считаем как +100%, чтобы не делить на 0
  }
  return round2(((current - previous) / Math.abs(previous)) * 100);
}

/**
 * Активный заказ считается просроченным, если дедлайн уже наступил,
 * а статус — не "готово", не "отменён" и не "архив".
 */
export function isOverdue(order: Pick<OrderForCalc, "deadline" | "statusCategory">, now: Date = new Date()): boolean {
  if (!order.deadline) return false;
  if (order.statusCategory !== "active") return false;
  return order.deadline.getTime() < now.getTime();
}

/** Заказы, которые нужно исключать из выручки/прибыли (отменённые). */
export function isExcludedFromRevenue(order: Pick<OrderForCalc, "statusCategory">): boolean {
  return order.statusCategory === "cancelled";
}

export interface AggregatedFinancials {
  revenue: number;
  expenses: number;
  profit: number;
  orderCount: number;
  averageCheck: number;
  margin: number;
}

/** Агрегирует финансовые показатели по набору заказов (исключая отменённые из выручки/прибыли). */
export function aggregateOrders(orders: OrderForCalc[]): AggregatedFinancials {
  let revenue = 0;
  let expenses = 0;
  let profit = 0;
  let counted = 0;

  for (const o of orders) {
    if (isExcludedFromRevenue(o)) continue;
    revenue += o.paymentReceived;
    expenses += o.expenses;
    profit += calcProfit(o);
    counted += 1;
  }

  profit = round2(profit);

  return {
    revenue: round2(revenue),
    expenses: round2(expenses),
    profit,
    orderCount: counted,
    averageCheck: calcAverageCheck(revenue, counted),
    margin: calcMargin(revenue, profit),
  };
}

export interface MonthBucket {
  key: string; // "2026-01"
  label: string; // "Январь 2026"
  financials: AggregatedFinancials;
  newClients: number;
}

/** Группирует заказы по месяцу (по дате первого контакта/создания) и считает показатели. */
export function groupOrdersByMonth(
  orders: OrderForCalc[],
  dateSelector: (o: OrderForCalc) => Date | null = (o) => o.createdAt,
): Map<string, OrderForCalc[]> {
  const map = new Map<string, OrderForCalc[]>();
  for (const o of orders) {
    const date = dateSelector(o);
    if (!date) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(o);
  }
  return map;
}

export function distributionBy<T extends { count: number; revenue: number }>(
  orders: OrderForCalc[],
  keySelector: (o: OrderForCalc) => string | null,
): Record<string, { count: number; revenue: number }> {
  const result: Record<string, { count: number; revenue: number }> = {};
  for (const o of orders) {
    if (isExcludedFromRevenue(o)) continue;
    const key = keySelector(o) ?? "Другое";
    if (!result[key]) result[key] = { count: 0, revenue: 0 };
    result[key].count += 1;
    result[key].revenue += o.paymentReceived;
  }
  for (const k of Object.keys(result)) {
    result[k].revenue = round2(result[k].revenue);
  }
  return result as Record<string, T>;
}

/** Находит лучшие показатели среди помесячных данных. */
export function findBestMonths(buckets: MonthBucket[]) {
  if (buckets.length === 0) return null;
  const byRevenue = [...buckets].sort((a, b) => b.financials.revenue - a.financials.revenue)[0];
  const byProfit = [...buckets].sort((a, b) => b.financials.profit - a.financials.profit)[0];
  const byOrderCount = [...buckets].sort((a, b) => b.financials.orderCount - a.financials.orderCount)[0];
  const byAvgCheck = [...buckets].sort((a, b) => b.financials.averageCheck - a.financials.averageCheck)[0];
  return { byRevenue, byProfit, byOrderCount, byAvgCheck };
}

export type TrendDirection = "up" | "down" | "flat";

export function trendDirection(changePercent: number | null): TrendDirection {
  if (changePercent === null) return "flat";
  if (changePercent > 0.01) return "up";
  if (changePercent < -0.01) return "down";
  return "flat";
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export { round2 };
