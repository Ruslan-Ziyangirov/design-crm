"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleDollarSign } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { OrderFormDialog } from "@/components/orders/order-form-dialog";

export interface UnpaidStartedOrder {
  id: string;
  title: string;
  clientName: string;
  daysAgo: number;
}

function daysAgoLabel(days: number): string {
  const abs = Math.abs(days);
  const lastDigit = abs % 10;
  const lastTwo = abs % 100;
  const word = lastTwo >= 11 && lastTwo <= 14 ? "дней" : lastDigit === 1 ? "день" : lastDigit >= 2 && lastDigit <= 4 ? "дня" : "дней";
  if (days === 0) return "начали сегодня";
  return `начали ${abs} ${word} назад`;
}

export function UnpaidStartedCard({ orders }: { orders: UnpaidStartedOrder[] }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CircleDollarSign className="h-4 w-4 text-[var(--color-warning)]" />
          Начали работу, но не оплачено полностью
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5">
        {orders.length === 0 && (
          <p className="text-[13px] text-[var(--color-ink-faint)]">Таких заказов нет — всё, что в работе, оплачено полностью.</p>
        )}
        {orders.map((o) => (
          <button
            key={o.id}
            onClick={() => setOpenId(o.id)}
            className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] px-2 py-1.5 text-left transition-colors hover:bg-[var(--color-warning-soft)]"
          >
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium text-[var(--color-ink)]">{o.title}</span>
              <span className="block truncate text-[11.5px] text-[var(--color-ink-faint)]">{o.clientName}</span>
            </span>
            <span className="shrink-0 text-[11.5px] font-medium text-[var(--color-warning)]">{daysAgoLabel(o.daysAgo)}</span>
          </button>
        ))}
      </CardContent>

      <OrderFormDialog
        open={!!openId}
        orderId={openId}
        onOpenChange={(open) => setOpenId(open ? openId : null)}
        onSaved={() => router.refresh()}
      />
    </Card>
  );
}
