"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Phone,
  Mail,
  Send,
  Globe,
  MapPin,
  Pencil,
  Trash2,
  Plus,
  Star,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/orders/status-badge";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { ClientTimeline } from "@/components/clients/client-timeline";
import { OrderFormDialog } from "@/components/orders/order-form-dialog";
import { formatDate, formatMoney } from "@/lib/format";
import { calcProfit, aggregateOrders } from "@/lib/calculations";
import type { Client, Source, Order, ServiceType, ProjectStatus, PaymentStatus, TimelineEvent } from "@/lib/db/schema";

interface FullOrder extends Order {
  serviceType: ServiceType | null;
  status: ProjectStatus | null;
  paymentStatus: PaymentStatus | null;
}

interface Props {
  client: Client & { source: Source | null; orders: FullOrder[]; timeline: TimelineEvent[] };
}

const STATUS_LABELS: Record<string, string> = { active: "Активный", lead: "Лид", lost: "Потерян", archived: "Архив" };

export function ClientDetailView({ client }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [orderDialog, setOrderDialog] = useState<{ open: boolean; orderId: string | null }>({ open: false, orderId: null });

  const calcOrders = client.orders.map((o) => ({
    id: o.id,
    statusId: o.statusId,
    price: o.price,
    paymentReceived: o.paymentReceived,
    expenses: o.expenses,
    statusCategory: (o.status?.category ?? "active") as "active" | "done" | "cancelled" | "archived",
    deadline: o.deadline ? new Date(o.deadline) : null,
    createdAt: new Date(o.createdAt),
    completedDate: o.completedDate ? new Date(o.completedDate) : null,
    startDate: o.startDate ? new Date(o.startDate) : null,
    clientId: client.id,
    serviceTypeId: o.serviceTypeId,
    sourceId: o.sourceId,
  }));
  const agg = aggregateOrders(calcOrders);
  const reviews = client.orders.filter((o) => o.reviewReceived && o.reviewText);

  async function handleDelete() {
    const res = await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Клиент удалён");
      router.push("/clients");
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "Не удалось удалить клиента");
    }
    setDeleteOpen(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <Link href="/clients" className="inline-flex w-fit items-center gap-1.5 text-[13px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
        <ArrowLeft className="h-3.5 w-3.5" />
        Все клиенты
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-[22px] font-semibold text-[var(--color-ink)]">{client.name}</h1>
            <Badge variant={client.status === "active" ? "positive" : client.status === "lost" ? "negative" : "info"}>
              {STATUS_LABELS[client.status]}
            </Badge>
          </div>
          {client.contactName && <p className="text-[13px] text-[var(--color-ink-muted)]">{client.contactName}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)} className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Редактировать
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setDeleteOpen(true)} className="gap-1.5 text-[var(--color-negative)]">
            <Trash2 className="h-3.5 w-3.5" />
            Удалить
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-[12px] text-[var(--color-ink-muted)]">Всего заказов</p>
          <p className="mt-1 font-numeric text-[19px] font-semibold">{client.orders.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[12px] text-[var(--color-ink-muted)]">Выручка</p>
          <p className="mt-1 font-numeric text-[19px] font-semibold">{formatMoney(agg.revenue)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[12px] text-[var(--color-ink-muted)]">Прибыль</p>
          <p className="mt-1 font-numeric text-[19px] font-semibold text-[var(--color-positive)]">{formatMoney(agg.profit)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[12px] text-[var(--color-ink-muted)]">Задолженность</p>
          <p className={`mt-1 font-numeric text-[19px] font-semibold ${agg.outstanding > 0 ? "text-[var(--color-warning)]" : ""}`}>
            {formatMoney(agg.outstanding)}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Контакты</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5 text-[13px]">
              {client.phone && (
                <div className="flex items-center gap-2 text-[var(--color-ink-muted)]">
                  <Phone className="h-3.5 w-3.5" /> {client.phone}
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-2 text-[var(--color-ink-muted)]">
                  <Mail className="h-3.5 w-3.5" /> {client.email}
                </div>
              )}
              {client.telegram && (
                <div className="flex items-center gap-2 text-[var(--color-ink-muted)]">
                  <Send className="h-3.5 w-3.5" /> {client.telegram}
                </div>
              )}
              {client.website && (
                <div className="flex items-center gap-2 text-[var(--color-ink-muted)]">
                  <Globe className="h-3.5 w-3.5" /> {client.website}
                </div>
              )}
              {client.city && (
                <div className="flex items-center gap-2 text-[var(--color-ink-muted)]">
                  <MapPin className="h-3.5 w-3.5" /> {client.city}
                </div>
              )}
              <div className="mt-1 border-t border-[var(--color-border)] pt-2.5">
                <p className="text-[12px] text-[var(--color-ink-faint)]">Источник</p>
                <p>{client.source?.name ?? "Не указан"}</p>
              </div>
              <div>
                <p className="text-[12px] text-[var(--color-ink-faint)]">Первый контакт</p>
                <p>{formatDate(client.createdAt)}</p>
              </div>
              <div>
                <p className="text-[12px] text-[var(--color-ink-faint)]">Последний контакт</p>
                <p>{formatDate(client.lastContactAt)}</p>
              </div>
              {client.notes && (
                <div className="mt-1 border-t border-[var(--color-border)] pt-2.5">
                  <p className="text-[12px] text-[var(--color-ink-faint)]">Заметки</p>
                  <p className="whitespace-pre-wrap text-[var(--color-ink-muted)]">{client.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-[var(--color-warning)]" />
                  Отзывы
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {reviews.map((o) => (
                  <div key={o.id} className="rounded-[10px] bg-black/[0.02] p-3">
                    <p className="text-[12.5px] text-[var(--color-ink-muted)]">«{o.reviewText}»</p>
                    <p className="mt-1 text-[11.5px] text-[var(--color-ink-faint)]">по заказу «{o.title}»</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-5">
              <ClientTimeline clientId={client.id} events={client.timeline} onChanged={() => router.refresh()} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>История заказов</CardTitle>
              <Button size="sm" onClick={() => setOrderDialog({ open: true, orderId: null })} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Новый заказ
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {client.orders.length === 0 && (
                <p className="text-[13px] text-[var(--color-ink-faint)]">У этого клиента пока нет заказов</p>
              )}
              {client.orders.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setOrderDialog({ open: true, orderId: o.id })}
                  className="flex items-center justify-between gap-3 rounded-[10px] border border-[var(--color-border)] p-3 text-left hover:border-[var(--color-border-strong)]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium text-[var(--color-ink)]">{o.title}</p>
                    <p className="text-[11.5px] text-[var(--color-ink-faint)]">
                      {o.serviceType?.name ?? "—"} · {formatDate(o.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <p className="font-numeric text-[13px] font-semibold">{formatMoney(o.price)}</p>
                      <p
                        className={`font-numeric text-[11px] ${calcProfit(o) >= 0 ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]"}`}
                      >
                        прибыль {formatMoney(calcProfit(o))}
                      </p>
                    </div>
                    {o.status && <StatusBadge name={o.status.name} color={o.status.color} />}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <ClientFormDialog open={editOpen} onOpenChange={setEditOpen} clientId={client.id} onSaved={() => router.refresh()} />
      <OrderFormDialog
        open={orderDialog.open}
        orderId={orderDialog.orderId}
        defaultClientId={client.id}
        onOpenChange={(open) => setOrderDialog({ open, orderId: open ? orderDialog.orderId : null })}
        onSaved={() => router.refresh()}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить клиента?</AlertDialogTitle>
            <AlertDialogDescription>
              Будут удалены все заказы и история взаимодействия с этим клиентом. Это действие необратимо.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
