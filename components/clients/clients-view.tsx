"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { formatMoney, formatDate } from "@/lib/format";
import { calcProfit, calcRemainder } from "@/lib/calculations";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Client, Source, Order } from "@/lib/db/schema";

interface ClientRow extends Client {
  source: Source | null;
  orders: Order[];
}

const STATUS_LABELS: Record<string, string> = {
  active: "Активный",
  lead: "Лид",
  lost: "Потерян",
  archived: "Архив",
};
const STATUS_VARIANT: Record<string, "positive" | "info" | "negative" | "neutral"> = {
  active: "positive",
  lead: "info",
  lost: "negative",
  archived: "neutral",
};

export function ClientsView({ clients }: { clients: ClientRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useLocalStorage("clients:search", "");
  const [statusFilter, setStatusFilter] = useLocalStorage("clients:status", "all");
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!c.name.toLowerCase().includes(q) && !(c.contactName ?? "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [clients, search, statusFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-semibold text-[var(--color-ink)]">Клиенты</h1>
          <p className="text-[13px] text-[var(--color-ink-muted)]">База клиентов вашей студии</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Новый клиент
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-[280px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-faint)]" />
          <Input className="pl-8" placeholder="Поиск клиентов..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Пока нет клиентов"
          description="Добавьте первого клиента, чтобы начать вести базу и создавать заказы."
          action={
            <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Новый клиент
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title="Ничего не найдено" description="Попробуйте изменить запрос или фильтр по статусу." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const calcOrders = c.orders.map((o) => ({
              paymentReceived: o.paymentReceived,
              expenses: o.expenses,
              price: o.price,
            }));
            const profit = calcOrders.reduce((s, o) => s + calcProfit({ price: o.price, paymentReceived: o.paymentReceived, expenses: o.expenses }), 0);
            const debt = calcOrders.reduce((s, o) => s + calcRemainder({ price: o.price, paymentReceived: o.paymentReceived, expenses: o.expenses }), 0);

            return (
              <Link key={c.id} href={`/clients/${c.id}`}>
                <Card className="h-full p-4 transition-shadow hover:shadow-[var(--shadow-lifted)]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-display text-[15px] font-semibold text-[var(--color-ink)]">{c.name}</p>
                      {c.contactName && <p className="truncate text-[12.5px] text-[var(--color-ink-muted)]">{c.contactName}</p>}
                    </div>
                    <Badge variant={STATUS_VARIANT[c.status]}>{STATUS_LABELS[c.status]}</Badge>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="font-numeric text-[13px] font-semibold text-[var(--color-ink)]">{c.orders.length}</p>
                      <p className="text-[10.5px] text-[var(--color-ink-faint)]">заказов</p>
                    </div>
                    <div>
                      <p className="font-numeric text-[13px] font-semibold text-[var(--color-positive)]">{formatMoney(profit)}</p>
                      <p className="text-[10.5px] text-[var(--color-ink-faint)]">прибыль</p>
                    </div>
                    <div>
                      <p className={`font-numeric text-[13px] font-semibold ${debt > 0 ? "text-[var(--color-warning)]" : "text-[var(--color-ink-faint)]"}`}>
                        {formatMoney(debt)}
                      </p>
                      <p className="text-[10.5px] text-[var(--color-ink-faint)]">долг</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11.5px] text-[var(--color-ink-faint)]">
                    <span>{c.source?.name ?? "Источник не указан"}</span>
                    <span>с {formatDate(c.createdAt)}</span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <ClientFormDialog open={createOpen} onOpenChange={setCreateOpen} onSaved={(id) => router.push(`/clients/${id}`)} />
    </div>
  );
}
