import { requireUserId } from "@/lib/auth/session-helpers";
import { getOrdersFull, getReferenceData, toCalcOrder } from "@/lib/db/queries";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  aggregateOrders,
  calcChangePercent,
  isOverdue,
  type OrderForCalc,
} from "@/lib/calculations";
import { AnalyticsView } from "@/components/analytics/analytics-view";

export default async function AnalyticsPage() {
  const userId = await requireUserId();
  const [ordersFull, refs, clientRows] = await Promise.all([
    getOrdersFull(userId),
    getReferenceData(userId),
    db.select().from(clients).where(eq(clients.userId, userId)),
  ]);

  const now = new Date();
  const calcOrders: OrderForCalc[] = ordersFull.map(toCalcOrder);

  // ---- Помесячная таблица сравнения (последние 12 месяцев) ----
  const monthlyTable = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const bucketOrders = calcOrders.filter(
      (o) => o.createdAt.getFullYear() === d.getFullYear() && o.createdAt.getMonth() === d.getMonth(),
    );
    const prevD = new Date(d.getFullYear(), d.getMonth() - 1, 1);
    const prevOrders = calcOrders.filter(
      (o) => o.createdAt.getFullYear() === prevD.getFullYear() && o.createdAt.getMonth() === prevD.getMonth(),
    );
    const agg = aggregateOrders(bucketOrders);
    const prevAgg = aggregateOrders(prevOrders);
    const newClients = clientRows.filter(
      (c) => new Date(c.createdAt).getFullYear() === d.getFullYear() && new Date(c.createdAt).getMonth() === d.getMonth(),
    ).length;

    monthlyTable.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: monthLabel(d),
      revenue: agg.revenue,
      expenses: agg.expenses,
      profit: agg.profit,
      orderCount: agg.orderCount,
      averageCheck: agg.averageCheck,
      newClients,
      changeVsPrev: calcChangePercent(agg.revenue, prevAgg.revenue),
    });
  }

  // ---- Общие показатели (за всё время) ----
  const overall = aggregateOrders(calcOrders);
  const ordersByClient = new Map<string, number>();
  for (const o of calcOrders) {
    if (o.statusCategory === "cancelled") continue;
    ordersByClient.set(o.clientId, (ordersByClient.get(o.clientId) ?? 0) + 1);
  }
  const repeatClients = Array.from(ordersByClient.values()).filter((n) => n > 1).length;
  const totalClientsWithOrders = ordersByClient.size;
  const repeatClientPercent = totalClientsWithOrders > 0 ? Math.round((repeatClients / totalClientsWithOrders) * 100) : 0;

  const doneOrders = calcOrders.filter((o) => o.statusCategory === "done" && o.startDate && o.completedDate);
  const avgDurationDays =
    doneOrders.length > 0
      ? Math.round(
          doneOrders.reduce((sum, o) => sum + (o.completedDate!.getTime() - o.startDate!.getTime()) / 86400000, 0) /
            doneOrders.length,
        )
      : 0;

  const onTimeCount = doneOrders.filter((o) => !o.deadline || o.completedDate!.getTime() <= o.deadline.getTime()).length;
  const overdueCount = calcOrders.filter((o) => isOverdue(o, now)).length;

  const overallStats = {
    revenue: overall.revenue,
    expenses: overall.expenses,
    profit: overall.profit,
    margin: overall.margin,
    averageCheck: overall.averageCheck,
    orderCount: overall.orderCount,
    clientCount: clientRows.length,
    repeatClientPercent,
    outstanding: overall.outstanding,
    avgDurationDays,
    onTimeCount,
    overdueCount,
  };

  return (
    <AnalyticsView
      monthlyTable={monthlyTable}
      overallStats={overallStats}
      orders={ordersFull}
      clients={clientRows}
      serviceTypes={refs.serviceTypes}
      sources={refs.sources}
      statuses={refs.projectStatuses}
      paymentStatuses={refs.paymentStatuses}
    />
  );
}

function monthLabel(d: Date): string {
  const months = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}
