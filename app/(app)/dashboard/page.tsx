import { requireUserId } from "@/lib/auth/session-helpers";
import { getOrdersFull, getReferenceData, toCalcOrder } from "@/lib/db/queries";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { buildDashboard, resolvePeriod, type PeriodKey } from "@/lib/dashboard/build";
import { PeriodSelector } from "@/components/dashboard/period-selector";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { OrdersCountChart } from "@/components/dashboard/orders-count-chart";
import { DistributionPieChart } from "@/components/dashboard/distribution-pie-chart";
import { AverageCheckChart } from "@/components/dashboard/average-check-chart";
import { FunnelCard } from "@/components/dashboard/funnel-card";
import { BestMonthsCard } from "@/components/dashboard/best-months-card";
import { TrendsCard } from "@/components/dashboard/trends-card";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; compare?: string }>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;
  const period = (params.period as PeriodKey) || "current_month";
  const compareMode = params.compare === "last_year" ? "last_year" : "previous";

  const [ordersFull, refs, clientRows] = await Promise.all([
    getOrdersFull(userId),
    getReferenceData(userId),
    db.select().from(clients).where(eq(clients.userId, userId)),
  ]);

  const now = new Date();
  const calcOrders = ordersFull.map(toCalcOrder);
  const range = resolvePeriod(period, now);

  const dashboard = buildDashboard({
    orders: calcOrders,
    clients: clientRows,
    statuses: refs.projectStatuses,
    sources: refs.sources,
    serviceTypes: refs.serviceTypes,
    range,
    compareMode,
    now,
  });

  const { kpis, monthBuckets, bestMonths, trends, trendDirections, bySource, byService, funnel } = dashboard;

  const chartData = monthBuckets.map((b) => ({
    label: b.label,
    revenue: b.financials.revenue,
    expenses: b.financials.expenses,
    profit: b.financials.profit,
    count: b.financials.orderCount,
    averageCheck: b.financials.averageCheck,
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-semibold text-[var(--color-ink)]">Дашборд</h1>
          <p className="text-[13px] text-[var(--color-ink-muted)]">Ключевые показатели вашей студии</p>
        </div>
        <PeriodSelector />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Выручка" value={kpis.revenue.value} change={kpis.revenue.change} />
        <KpiCard label="Расходы" value={kpis.expenses.value} change={kpis.expenses.change} />
        <KpiCard label="Чистая прибыль" value={kpis.profit.value} change={kpis.profit.change} />
        <KpiCard label="Количество заказов" value={kpis.orderCount.value} change={kpis.orderCount.change} format="number" />
        <KpiCard label="Средний чек" value={kpis.averageCheck.value} change={kpis.averageCheck.change} />
        <KpiCard label="Рентабельность" value={kpis.margin.value} change={kpis.margin.change} format="percent" />
        <KpiCard label="Активные проекты" value={kpis.activeProjects.value} format="number" hint="сейчас" />
        <KpiCard label="Новые клиенты" value={kpis.newClients.value} change={kpis.newClients.change} format="number" />
        <KpiCard
          label="Завершено проектов"
          value={kpis.completedProjects.value}
          change={kpis.completedProjects.change}
          format="number"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueChart data={chartData} />
        </div>
        <FunnelCard stages={funnel} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <OrdersCountChart data={chartData} />
        <AverageCheckChart data={chartData} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DistributionPieChart title="Клиенты по источникам" data={bySource} />
        <DistributionPieChart title="Заказы по типам услуг" data={byService} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BestMonthsCard best={bestMonths} />
        <TrendsCard
          items={[
            { label: "Выручка", change: trends.revenue, direction: trendDirections.revenue },
            { label: "Прибыль", change: trends.profit, direction: trendDirections.profit },
            { label: "Средний чек", change: trends.averageCheck, direction: trendDirections.averageCheck },
            { label: "Новые клиенты", change: trends.newClients, direction: trendDirections.newClients },
            { label: "Расходы", change: trends.expenses, direction: trendDirections.expenses },
          ]}
        />
      </div>
    </div>
  );
}
