"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { orderSchema } from "@/lib/validation/schemas";
import type { z } from "zod";
import { calcProfit } from "@/lib/calculations";
import { formatMoney } from "@/lib/format";

type OrderFormValues = z.input<typeof orderSchema>;
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientCombobox } from "@/components/orders/client-combobox";
import type { Client, Source, ServiceType, ProjectStatus, PaymentStatus } from "@/lib/db/schema";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId?: string | null;
  defaultClientId?: string;
  onSaved?: () => void;
}

function toDateInput(v: unknown): string {
  if (!v) return "";
  const d = new Date(v as string);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function OrderFormDialog({ open, onOpenChange, orderId, defaultClientId, onSaved }: Props) {
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatus[]>([]);
  const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatus[]>([]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      clientId: defaultClientId || "",
      title: "",
      paymentReceived: 0,
      expenses: 0,
      profitOverride: null,
      tags: [],
      reviewReceived: false,
    },
  });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function load() {
      setLoadingRefs(true);
      try {
        const [clientsRes, srcRes, svcRes, psRes, payRes] = await Promise.all([
          fetch("/api/clients").then((r) => r.json()),
          fetch("/api/settings/sources").then((r) => r.json()),
          fetch("/api/settings/service-types").then((r) => r.json()),
          fetch("/api/settings/project-statuses").then((r) => r.json()),
          fetch("/api/settings/payment-statuses").then((r) => r.json()),
        ]);
        if (cancelled) return;
        setClients(clientsRes);
        setSources(srcRes);
        setServiceTypes(svcRes);
        setProjectStatuses(psRes);
        setPaymentStatuses(payRes);

        if (orderId) {
          const order = await fetch(`/api/orders/${orderId}`).then((r) => r.json());
          if (cancelled) return;
          reset({
            clientId: order.clientId,
            title: order.title,
            serviceTypeId: order.serviceTypeId,
            description: order.description || "",
            paymentReceived: order.paymentReceived,
            expenses: order.expenses,
            profitOverride: order.profitOverride ?? null,
            statusId: order.statusId,
            paymentStatusId: order.paymentStatusId,
            sourceId: order.sourceId,
            firstContactDate: order.firstContactDate ? new Date(order.firstContactDate) : null,
            startDate: order.startDate ? new Date(order.startDate) : null,
            deadline: order.deadline ? new Date(order.deadline) : null,
            completedDate: order.completedDate ? new Date(order.completedDate) : null,
            projectUrl: order.projectUrl || "",
            materialsUrl: order.materialsUrl || "",
            notes: order.notes || "",
            tags: JSON.parse(order.tags || "[]"),
            reviewReceived: order.reviewReceived,
            reviewText: order.reviewText || "",
            reviewUrl: order.reviewUrl || "",
          });
        } else {
          reset({
            clientId: defaultClientId || "",
            title: "",
            serviceTypeId: svcRes[0]?.id,
            statusId: psRes.find((s: ProjectStatus) => s.category === "active")?.id ?? psRes[0]?.id,
            paymentStatusId: payRes.find((s: PaymentStatus) => s.name === "Не оплачено")?.id ?? payRes[0]?.id,
            sourceId: srcRes[0]?.id,
            paymentReceived: 0,
            expenses: 0,
            profitOverride: null,
            firstContactDate: new Date(),
            tags: [],
            reviewReceived: false,
          });
        }
      } catch {
        toast.error("Не удалось загрузить данные для формы");
      } finally {
        if (!cancelled) setLoadingRefs(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, orderId]);

  const paymentReceived = Number(watch("paymentReceived")) || 0;
  const expenses = Number(watch("expenses")) || 0;
  const reviewReceived = watch("reviewReceived");
  const profitOverride = watch("profitOverride");
  const manualProfit = profitOverride !== null && profitOverride !== undefined;

  const autoProfit = useMemo(() => calcProfit({ paymentReceived, expenses }), [paymentReceived, expenses]);
  const profit = manualProfit ? Number(profitOverride) : autoProfit;

  async function onSubmit(raw: OrderFormValues) {
    setSaving(true);
    try {
      const values = orderSchema.parse(raw);
      const res = await fetch(orderId ? `/api/orders/${orderId}` : "/api/orders", {
        method: orderId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Ошибка сохранения");
      }
      toast.success(orderId ? "Заказ обновлён" : "Заказ создан");
      onOpenChange(false);
      onSaved?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось сохранить заказ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{orderId ? "Редактировать заказ" : "Новый заказ"}</DialogTitle>
          <DialogDescription>
            Прибыль считается автоматически (Выручка − Расход), но при необходимости её можно задать вручную.
          </DialogDescription>
        </DialogHeader>

        {loadingRefs ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label>Название заказа</Label>
                <Input {...register("title")} placeholder="Например: Сайт-визитка" />
                {errors.title && <p className="text-[12px] text-[var(--color-negative)]">{errors.title.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Клиент</Label>
                <Controller
                  control={control}
                  name="clientId"
                  render={({ field }) => (
                    <ClientCombobox
                      clients={clients}
                      value={field.value}
                      onChange={field.onChange}
                      onClientCreated={(newClient) => setClients((prev) => [newClient, ...prev])}
                    />
                  )}
                />
                {errors.clientId && <p className="text-[12px] text-[var(--color-negative)]">{errors.clientId.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Тип услуги</Label>
                <Controller
                  control={control}
                  name="serviceTypeId"
                  render={({ field }) => (
                    <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Услуга" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceTypes.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Статус проекта</Label>
                <Controller
                  control={control}
                  name="statusId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Статус" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectStatuses.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            <span className="inline-flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                              {s.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Статус оплаты</Label>
                <Controller
                  control={control}
                  name="paymentStatusId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Статус оплаты" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentStatuses.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Откуда пришёл заказ</Label>
                <Controller
                  control={control}
                  name="sourceId"
                  render={({ field }) => (
                    <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Источник" />
                      </SelectTrigger>
                      <SelectContent>
                        {sources.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-[12px] border border-[var(--color-border)] bg-black/[0.015] p-3">
              <div className="flex flex-col gap-1.5">
                <Label>Выручка, ₽</Label>
                <Input type="number" step="0.01" {...register("paymentReceived")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Расход, ₽</Label>
                <Input type="number" step="0.01" {...register("expenses")} />
              </div>
              <div className="col-span-2 flex flex-col gap-2 border-t border-[var(--color-border)] pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[var(--color-ink-muted)]">Прибыль</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[var(--color-ink-faint)]">Указать вручную</span>
                    <Switch
                      checked={manualProfit}
                      onCheckedChange={(checked) => setValue("profitOverride", checked ? autoProfit : null)}
                    />
                  </div>
                </div>
                {manualProfit ? (
                  <Input
                    type="number"
                    step="0.01"
                    value={profitOverride == null ? 0 : Number(profitOverride)}
                    onChange={(e) => setValue("profitOverride", e.target.value === "" ? null : Number(e.target.value))}
                  />
                ) : (
                  <span
                    className={`font-numeric text-[15px] font-semibold ${profit >= 0 ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]"}`}
                  >
                    {formatMoney(profit)}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Дата контакта</Label>
                <Input type="date" defaultValue={toDateInput(watch("firstContactDate"))} {...register("firstContactDate")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Дата начала</Label>
                <Input type="date" defaultValue={toDateInput(watch("startDate"))} {...register("startDate")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Дедлайн</Label>
                <Input type="date" defaultValue={toDateInput(watch("deadline"))} {...register("deadline")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Дата завершения</Label>
                <Input type="date" defaultValue={toDateInput(watch("completedDate"))} {...register("completedDate")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Ссылка на проект</Label>
                <Input {...register("projectUrl")} placeholder="https://" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Ссылка на материалы</Label>
                <Input {...register("materialsUrl")} placeholder="https://" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Заметки</Label>
              <Textarea rows={2} {...register("notes")} />
            </div>

            <div className="flex flex-col gap-3 rounded-[12px] border border-[var(--color-border)] p-3">
              <div className="flex items-center justify-between">
                <Label className="text-[var(--color-ink)]">Отзыв получен</Label>
                <Controller
                  control={control}
                  name="reviewReceived"
                  render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
                />
              </div>
              {reviewReceived && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <Label>Текст отзыва</Label>
                    <Textarea rows={2} {...register("reviewText")} />
                  </div>
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <Label>Ссылка на отзыв</Label>
                    <Input {...register("reviewUrl")} placeholder="https://" />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Сохраняем..." : "Сохранить"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
