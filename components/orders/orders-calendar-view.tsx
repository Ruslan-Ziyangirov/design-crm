"use client";

import { useMemo, useState } from "react";
import { MonthCalendar, type CalendarEvent } from "@/components/calendar/month-calendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { OrderWithRelations } from "@/lib/db/queries";

export function OrdersCalendarView({
  orders,
  onEdit,
}: {
  orders: OrderWithRelations[];
  onEdit: (id: string) => void;
}) {
  const [dateType, setDateType] = useState<"deadline" | "startDate" | "completedDate" | "firstContactDate">("deadline");

  const events: CalendarEvent[] = useMemo(
    () =>
      orders
        .filter((o) => o[dateType])
        .map((o) => ({
          id: o.id,
          date: new Date(o[dateType] as Date | string),
          label: `${o.title} · ${o.client?.name ?? ""}`,
          color: o.status?.color ?? "#64748b",
          kind: dateType,
          onClick: () => onEdit(o.id),
        })),
    [orders, dateType, onEdit],
  );

  return (
    <div className="flex flex-col gap-3">
      <Tabs value={dateType} onValueChange={(v) => setDateType(v as typeof dateType)}>
        <TabsList>
          <TabsTrigger value="deadline">Дедлайны</TabsTrigger>
          <TabsTrigger value="startDate">Даты начала</TabsTrigger>
          <TabsTrigger value="completedDate">Завершение</TabsTrigger>
          <TabsTrigger value="firstContactDate">Первый контакт</TabsTrigger>
        </TabsList>
      </Tabs>
      <MonthCalendar events={events} />
    </div>
  );
}
