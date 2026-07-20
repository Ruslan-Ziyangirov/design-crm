"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, SlidersHorizontal, Download, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { OrderFormDialog } from "@/components/orders/order-form-dialog";
import { OrdersTable } from "@/components/orders/orders-table";
import { OrdersKanban } from "@/components/orders/orders-kanban";
import { OrdersCalendarView } from "@/components/orders/orders-calendar-view";
import type { OrderWithRelations } from "@/lib/db/queries";
import type { ProjectStatus, PaymentStatus, ServiceType, Source } from "@/lib/db/schema";
import { EmptyState } from "@/components/shared/empty-state";
import { ListChecks } from "lucide-react";

interface Props {
  orders: OrderWithRelations[];
  projectStatuses: ProjectStatus[];
  paymentStatuses: PaymentStatus[];
  serviceTypes: ServiceType[];
  sources: Source[];
}

export interface OrdersFilters {
  search: string;
  statusIds: string[];
  paymentStatusIds: string[];
  serviceTypeIds: string[];
  groupBy: "none" | "month" | "status" | "client";
}

const DEFAULT_FILTERS: OrdersFilters = {
  search: "",
  statusIds: [],
  paymentStatusIds: [],
  serviceTypeIds: [],
  groupBy: "none",
};

export function OrdersView({ orders, projectStatuses, paymentStatuses, serviceTypes, sources }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openOrderId = searchParams.get("open");

  const [view, setView] = useLocalStorage<"table" | "kanban" | "calendar">("orders:view", "table");
  const [filters, setFilters] = useLocalStorage<OrdersFilters>("orders:filters", DEFAULT_FILTERS);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOrderId, setEditOrderId] = useState<string | null>(openOrderId);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (filters.search.trim()) {
        const q = filters.search.trim().toLowerCase();
        const match = o.title.toLowerCase().includes(q) || o.client?.name.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filters.statusIds.length && !filters.statusIds.includes(o.statusId)) return false;
      if (filters.paymentStatusIds.length && !filters.paymentStatusIds.includes(o.paymentStatusId)) return false;
      if (filters.serviceTypeIds.length && o.serviceTypeId && !filters.serviceTypeIds.includes(o.serviceTypeId))
        return false;
      if (filters.serviceTypeIds.length && !o.serviceTypeId) return false;
      return true;
    });
  }, [orders, filters]);

  const activeFilterCount =
    filters.statusIds.length + filters.paymentStatusIds.length + filters.serviceTypeIds.length;

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  function toggleId(list: string[], id: string) {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-semibold text-[var(--color-ink)]">Заказы</h1>
          <p className="text-[13px] text-[var(--color-ink-muted)]">Все проекты студии в одном месте</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Новый заказ
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
          <TabsList>
            <TabsTrigger value="table">Таблица</TabsTrigger>
            <TabsTrigger value="kanban">Канбан</TabsTrigger>
            <TabsTrigger value="calendar">Календарь</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-1 items-center justify-end gap-2">
          <div className="relative w-full max-w-[260px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-faint)]" />
            <Input
              className="pl-8"
              placeholder="Поиск по заказам..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <Select value={filters.groupBy} onValueChange={(v) => setFilters({ ...filters, groupBy: v as OrdersFilters["groupBy"] })}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Группировка" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Без группировки</SelectItem>
              <SelectItem value="month">По месяцам</SelectItem>
              <SelectItem value="status">По статусу</SelectItem>
              <SelectItem value="client">По клиенту</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="secondary" size="sm" className="gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Фильтры
                {activeFilterCount > 0 && <Badge className="ml-0.5">{activeFilterCount}</Badge>}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="mb-2 text-[12px] font-medium text-[var(--color-ink-muted)]">Статус проекта</p>
                  <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
                    {projectStatuses.map((s) => (
                      <label key={s.id} className="flex items-center gap-2 text-[13px]">
                        <Checkbox
                          checked={filters.statusIds.includes(s.id)}
                          onCheckedChange={() => setFilters({ ...filters, statusIds: toggleId(filters.statusIds, s.id) })}
                        />
                        {s.name}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[12px] font-medium text-[var(--color-ink-muted)]">Статус оплаты</p>
                  <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
                    {paymentStatuses.map((s) => (
                      <label key={s.id} className="flex items-center gap-2 text-[13px]">
                        <Checkbox
                          checked={filters.paymentStatusIds.includes(s.id)}
                          onCheckedChange={() =>
                            setFilters({ ...filters, paymentStatusIds: toggleId(filters.paymentStatusIds, s.id) })
                          }
                        />
                        {s.name}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[12px] font-medium text-[var(--color-ink-muted)]">Тип услуги</p>
                  <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
                    {serviceTypes.map((s) => (
                      <label key={s.id} className="flex items-center gap-2 text-[13px]">
                        <Checkbox
                          checked={filters.serviceTypeIds.includes(s.id)}
                          onCheckedChange={() =>
                            setFilters({ ...filters, serviceTypeIds: toggleId(filters.serviceTypeIds, s.id) })
                          }
                        />
                        {s.name}
                      </label>
                    ))}
                  </div>
                </div>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 self-start">
                    <X className="h-3.5 w-3.5" />
                    Сбросить фильтры
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="secondary" size="sm" asChild className="gap-1.5">
            <a href="/api/export?entity=orders&format=xlsx">
              <Download className="h-3.5 w-3.5" />
              Экспорт
            </a>
          </Button>
        </div>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Пока нет заказов"
          description="Добавьте первый заказ вручную или импортируйте существующие данные в настройках."
          action={
            <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Новый заказ
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Ничего не найдено"
          description="Попробуйте изменить поисковый запрос или сбросить фильтры."
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Сбросить фильтры
            </Button>
          }
        />
      ) : view === "table" ? (
        <OrdersTable
          orders={filtered}
          groupBy={filters.groupBy}
          onEdit={(id) => setEditOrderId(id)}
          onChanged={() => router.refresh()}
        />
      ) : view === "kanban" ? (
        <OrdersKanban orders={filtered} statuses={projectStatuses} onEdit={(id) => setEditOrderId(id)} onChanged={() => router.refresh()} />
      ) : (
        <OrdersCalendarView orders={filtered} onEdit={(id) => setEditOrderId(id)} />
      )}

      <OrderFormDialog open={createOpen} onOpenChange={setCreateOpen} onSaved={() => router.refresh()} />
      <OrderFormDialog
        open={!!editOrderId}
        orderId={editOrderId}
        onOpenChange={(open) => !open && setEditOrderId(null)}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
