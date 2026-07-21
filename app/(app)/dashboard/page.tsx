import { requireUserId } from "@/lib/auth/session-helpers";
import { getOrdersFull, getReferenceData, toCalcOrder, getProfitPlan } from "@/lib/db/queries";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { aggregateOrders } from "@/lib/calculations";
import { buildDashboard, buildCurrentYearMonths, resolvePeriod, type PeriodKey } from "@/lib/dashboard/build";
import { PeriodSelector } from "@/components/dashboard/period-selector";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { OrdersCountChart } from "@/components/dashboard/orders-count-chart";
import { DistributionPieChart } from "@/components/dashboard/distribution-pie-chart";
import { AverageCheckChart } from "@/components/dashboard/average-check-chart";
import { CurrentYearProfitChart } from "@/components/dashboard/current-year-profit-chart";
import { FunnelCard } from "@/components/dashboard/funnel-card";
import { BestMonthsCard } from "@/components/dashboard/best-months-card";
import { TrendsCard } from "@/components/dashboard/trends-card";
import { ProfitPlanCard } from "@/components/dashboard/profit-plan-card";

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

  const { kpis, monthBuckets, bestMonths, trends, trendDirections, trendsYoY, trendDirectionsYoY, bySource, byService, funnel } =
    dashboard;

  const chartData = monthBuckets.map((b) => ({
    label: b.label,
    revenue: b.financials.revenue,
    expenses: b.financials.expenses,
    profit: b.financials.profit,
    count: b.financials.orderCount,
    averageCheck: b.financials.averageCheck,
  }));

  // ---- План по прибыли: всегда про календарный текущий месяц, независимо от периода на странице ----
  const currentMonthRange = resolvePeriod("current_month", now);
  const currentMonthProfit = aggregateOrders(
    calcOrders.filter((o) => o.createdAt >= currentMonthRange.from && o.createdAt <= currentMonthRange.to),
  ).profit;
  const profitPlan = await getProfitPlan(userId, now.getFullYear(), now.getMonth() + 1);

  // ---- Прибыль по месяцам строго текущего года (Январь -> текущий месяц) ----
  const currentYearMonths = buildCurrentYearMonths(calcOrders, clientRows, now).map((b) => ({
    label: b.label,
    profit: b.financials.profit,
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

      <ProfitPlanCard plan={profitPlan?.targetProfit ?? null} actual={currentMonthProfit} now={now} />

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
        <CurrentYearProfitChart data={currentYearMonths} />
        <DistributionPieChart title="Клиенты по источникам" data={bySource} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DistributionPieChart title="Заказы по типам услуг" data={byService} />
        <BestMonthsCard best={bestMonths} />
      </div>

      <TrendsCard
        items={[
          { label: "Выручка", changeMoM: trends.revenue, directionMoM: trendDirections.revenue, changeYoY: trendsYoY.revenue, directionYoY: trendDirectionsYoY.revenue },
          { label: "Прибыль", changeMoM: trends.profit, directionMoM: trendDirections.profit, changeYoY: trendsYoY.profit, directionYoY: trendDirectionsYoY.profit },
          { label: "Средний чек", changeMoM: trends.averageCheck, directionMoM: trendDirections.averageCheck, changeYoY: trendsYoY.averageCheck, directionYoY: trendDirectionsYoY.averageCheck },
          { label: "Новые клиенты", changeMoM: trends.newClients, directionMoM: trendDirections.newClients, changeYoY: trendsYoY.newClients, directionYoY: trendDirectionsYoY.newClients },
          { label: "Расходы", changeMoM: trends.expenses, directionMoM: trendDirections.expenses, changeYoY: trendsYoY.expenses, directionYoY: trendDirectionsYoY.expenses },
        ]}
      />
    </div>
  );
}
