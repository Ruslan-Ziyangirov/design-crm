"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { OrderFormDialog } from "@/components/orders/order-form-dialog";
import { formatMoney } from "@/lib/format";

export interface PipelineOrder {
  id: string;
  title: string;
  clientName: string;
  amount: number;
}

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  orders: PipelineOrder[];
}

export function FunnelCard({ stages }: { stages: PipelineStage[] }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Воронка проектов</CardTitle>
      </CardHeader>
      <CardContent className="flex max-h-[420px] flex-col gap-4 overflow-y-auto">
        {stages.length === 0 && (
          <p className="text-[13px] text-[var(--color-ink-faint)]">Нет активных заказов в воронке</p>
        )}
        {stages.map((stage) => (
          <div key={stage.id} className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 px-1">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: stage.color }} />
              <span className="text-[12.5px] font-semibold text-[var(--color-ink)]">{stage.name}</span>
              <span className="text-[11.5px] text-[var(--color-ink-faint)]">{stage.orders.length}</span>
            </div>
            {stage.orders.map((o) => (
              <button
                key={o.id}
                onClick={() => setOpenId(o.id)}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] px-2 py-1.5 text-left transition-colors hover:bg-black/[0.03]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-[var(--color-ink)]">{o.title}</span>
                  <span className="block truncate text-[11.5px] text-[var(--color-ink-faint)]">{o.clientName}</span>
                </span>
                <span className="shrink-0 font-numeric text-[13px] font-semibold text-[var(--color-ink)]">
                  {formatMoney(o.amount)}
                </span>
              </button>
            ))}
          </div>
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
