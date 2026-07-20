"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { formatMoney, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OrderWithRelations } from "@/lib/db/queries";
import type { Client, ServiceType, Source, ProjectStatus, PaymentStatus } from "@/lib/db/schema";

interface MonthRow {
  key: string;
  label: string;
  revenue: number;
  expenses: number;
  profit: number;
  orderCount: number;
  averageCheck: number;
  newClients: number;
  changeVsPrev: number | null;
}

interface OverallStats {
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
  averageCheck: number;
  orderCount: number;
  clientCount: number;
  repeatClientPercent: number;
  outstanding: number;
  avgDurationDays: number;
  onTimeCount: number;
  overdueCount: number;
}

interface Props {
  monthlyTable: MonthRow[];
  overallStats: OverallStats;
  orders: OrderWithRelations[];
  clients: Client[];
  serviceTypes: ServiceType[];
  sources: Source[];
  statuses: ProjectStatus[];
  paymentStatuses: PaymentStatus[];
}

export function AnalyticsView({ monthlyTable, overallStats, orders, serviceTypes, sources, statuses, paymentStatuses }: Props) {
  const [serviceFilter, setServiceFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (serviceFilter !== "all" && o.serviceTypeId !== serviceFilter) return false;
      if (sourceFilter !== "all" && o.sourceId !== sourceFilter) return false;
      if (statusFilter !== "all" && o.statusId !== statusFilter) return false;
      if (paymentFilter !== "all" && o.paymentStatusId !== paymentFilter) return false;
      return true;
    });
  }, [orders, serviceFilter, sourceFilter, statusFilter, paymentFilter]);

  const ordersForExpandedMonth = useMemo(() => {
    if (!expandedMonth) return [];
    const [y, m] = expandedMonth.split("-").map(Number);
    return filteredOrders.filter((o) => {
      const d = new Date(o.createdAt);
      return d.getFullYear() === y && d.getMonth() === m - 1;
    });
  }, [filteredOrders, expandedMonth]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[22px] font-semibold text-[var(--color-ink)]">Аналитика</h1>
        <p className="text-[13px] text-[var(--color-ink-muted)]">Подробный разбор показателей студии</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={serviceFilter} onValueChange={setServiceFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Услуга" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все услуги</SelectItem>
            {serviceTypes.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Источник" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все источники</SelectItem>
            {sources.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Статус оплаты" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы оплаты</SelectItem>
            {paymentStatuses.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatBox label="Выручка (всего)" value={formatMoney(overallStats.revenue)} />
        <StatBox label="Расходы (всего)" value={formatMoney(overallStats.expenses)} />
        <StatBox label="Прибыль (всего)" value={formatMoney(overallStats.profit)} accent="positive" />
        <StatBox label="Маржинальность" value={`${overallStats.margin.toFixed(1)}%`} />
        <StatBox label="Средний чек" value={formatMoney(overallStats.averageCheck)} />
        <StatBox label="Заказов всего" value={String(overallStats.orderCount)} />
        <StatBox label="Клиентов" value={String(overallStats.clientCount)} />
        <StatBox label="Повторные клиенты" value={`${overallStats.repeatClientPercent}%`} />
        <StatBox label="Задолженность" value={formatMoney(overallStats.outstanding)} accent="warning" />
        <StatBox label="Средний срок проекта" value={`${overallStats.avgDurationDays} дн.`} />
        <StatBox label="Завершено в срок" value={String(overallStats.onTimeCount)} accent="positive" />
        <StatBox label="Просрочено" value={String(overallStats.overdueCount)} accent="negative" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Сравнение месяцев</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Месяц</TableHead>
                  <TableHead className="text-right">Выручка</TableHead>
                  <TableHead className="text-right">Расходы</TableHead>
                  <TableHead className="text-right">Прибыль</TableHead>
                  <TableHead className="text-right">Заказов</TableHead>
                  <TableHead className="text-right">Средний чек</TableHead>
                  <TableHead className="text-right">Новые клиенты</TableHead>
                  <TableHead className="text-right">К пред. месяцу</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyTable.map((m) => (
                  <TableRow
                    key={m.key}
                    className="cursor-pointer"
                    onClick={() => setExpandedMonth(expandedMonth === m.key ? null : m.key)}
                    data-state={expandedMonth === m.key ? "selected" : undefined}
                  >
                    <TableCell className="font-medium">{m.label}</TableCell>
                    <TableCell className="text-right font-numeric">{formatMoney(m.revenue)}</TableCell>
                    <TableCell className="text-right font-numeric text-[var(--color-ink-muted)]">{formatMoney(m.expenses)}</TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-numeric font-medium",
                        m.profit >= 0 ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]",
                      )}
                    >
                      {formatMoney(m.profit)}
                    </TableCell>
                    <TableCell className="text-right font-numeric">{m.orderCount}</TableCell>
                    <TableCell className="text-right font-numeric">{formatMoney(m.averageCheck)}</TableCell>
                    <TableCell className="text-right font-numeric">{m.newClients}</TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-numeric",
                        m.changeVsPrev === null
                          ? "text-[var(--color-ink-faint)]"
                          : m.changeVsPrev > 0
                            ? "text-[var(--color-positive)]"
                            : m.changeVsPrev < 0
                              ? "text-[var(--color-negative)]"
                              : "text-[var(--color-ink-faint)]",
                      )}
                    >
                      {formatPercent(m.changeVsPrev)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="mt-2 text-[11.5px] text-[var(--color-ink-faint)]">Нажмите на месяц, чтобы увидеть все заказы за этот период</p>
        </CardContent>
      </Card>

      {expandedMonth && (
        <Card>
          <CardHeader>
            <CardTitle>Заказы за {monthlyTable.find((m) => m.key === expandedMonth)?.label}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {ordersForExpandedMonth.length === 0 && (
              <p className="text-[13px] text-[var(--color-ink-faint)]">Нет заказов за этот период (с учётом фильтров)</p>
            )}
            {ordersForExpandedMonth.map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-[10px] border border-[var(--color-border)] p-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-[var(--color-ink)]">{o.title}</p>
                  <p className="text-[11.5px] text-[var(--color-ink-faint)]">{o.client?.name}</p>
                </div>
                <span className="font-numeric text-[13px] font-semibold">{formatMoney(o.price)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatBox({ label, value, accent }: { label: string; value: string; accent?: "positive" | "negative" | "warning" }) {
  const color =
    accent === "positive"
      ? "text-[var(--color-positive)]"
      : accent === "negative"
        ? "text-[var(--color-negative)]"
        : accent === "warning"
          ? "text-[var(--color-warning)]"
          : "text-[var(--color-ink)]";
  return (
    <Card className="p-3.5">
      <p className="text-[11.5px] text-[var(--color-ink-muted)]">{label}</p>
      <p className={cn("mt-1 font-numeric text-[16px] font-semibold", color)}>{value}</p>
    </Card>
  );
}
