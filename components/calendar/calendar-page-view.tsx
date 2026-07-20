"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MonthCalendar, type CalendarEvent } from "@/components/calendar/month-calendar";
import { OrderFormDialog } from "@/components/orders/order-form-dialog";
import type { OrderWithRelations } from "@/lib/db/queries";

type EventType = "firstContactDate" | "startDate" | "deadline" | "completedDate";

const EVENT_META: Record<EventType, { label: string; color: string }> = {
  firstContactDate: { label: "Первый контакт", color: "#2563eb" },
  startDate: { label: "Начало работы", color: "#7c5cbf" },
  deadline: { label: "Дедлайн", color: "#d33a2c" },
  completedDate: { label: "Завершение", color: "#1c8a5a" },
};

export function CalendarPageView({ orders }: { orders: OrderWithRelations[] }) {
  const router = useRouter();
  const [visibleTypes, setVisibleTypes] = useState<EventType[]>(["deadline", "startDate", "completedDate", "firstContactDate"]);
  const [editOrderId, setEditOrderId] = useState<string | null>(null);

  const events: CalendarEvent[] = useMemo(() => {
    const list: CalendarEvent[] = [];
    for (const o of orders) {
      for (const type of visibleTypes) {
        const raw = o[type];
        if (!raw) continue;
        list.push({
          id: `${o.id}-${type}`,
          date: new Date(raw as Date | string),
          label: `${EVENT_META[type].label}: ${o.title}`,
          color: EVENT_META[type].color,
          kind: type,
          onClick: () => setEditOrderId(o.id),
        });
      }
    }
    return list;
  }, [orders, visibleTypes]);

  function toggleType(type: EventType) {
    setVisibleTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-[22px] font-semibold text-[var(--color-ink)]">Календарь</h1>
        <p className="text-[13px] text-[var(--color-ink-muted)]">Все важные даты по клиентам и заказам</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(Object.entries(EVENT_META) as [EventType, typeof EVENT_META[EventType]][]).map(([type, meta]) => (
          <button
            key={type}
            onClick={() => toggleType(type)}
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-opacity"
            style={{
              borderColor: visibleTypes.includes(type) ? meta.color : "var(--color-border)",
              background: visibleTypes.includes(type) ? `${meta.color}1a` : "transparent",
              color: visibleTypes.includes(type) ? meta.color : "var(--color-ink-faint)",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
            {meta.label}
          </button>
        ))}
      </div>

      <MonthCalendar events={events} />

      <OrderFormDialog
        open={!!editOrderId}
        orderId={editOrderId}
        onOpenChange={(open) => !open && setEditOrderId(null)}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
