"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { clientSchema } from "@/lib/validation/schemas";
import type { z } from "zod";

type ClientFormValues = z.input<typeof clientSchema>;
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { Source } from "@/lib/db/schema";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string | null;
  onSaved?: (clientId: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  active: "Активный",
  lead: "Лид",
  lost: "Потерян",
  archived: "Архив",
};

export function ClientFormDialog({ open, onOpenChange, clientId, onSaved }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", status: "lead", tags: [] },
  });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const srcRes: Source[] = await fetch("/api/settings/sources").then((r) => r.json());
        if (cancelled) return;
        setSources(srcRes);

        if (clientId) {
          const client = await fetch(`/api/clients/${clientId}`).then((r) => r.json());
          if (cancelled) return;
          reset({
            name: client.name,
            contactName: client.contactName || "",
            phone: client.phone || "",
            email: client.email || "",
            telegram: client.telegram || "",
            website: client.website || "",
            city: client.city || "",
            sourceId: client.sourceId,
            notes: client.notes || "",
            tags: JSON.parse(client.tags || "[]"),
            status: client.status,
          });
        } else {
          reset({ name: "", status: "lead", tags: [], sourceId: srcRes[0]?.id });
        }
      } catch {
        toast.error("Не удалось загрузить данные клиента");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, clientId]);

  async function onSubmit(raw: ClientFormValues) {
    setSaving(true);
    try {
      const values = clientSchema.parse(raw);
      const res = await fetch(clientId ? `/api/clients/${clientId}` : "/api/clients", {
        method: clientId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Ошибка сохранения");
      }
      const row = await res.json();
      toast.success(clientId ? "Клиент обновлён" : "Клиент добавлен");
      onOpenChange(false);
      onSaved?.(row.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось сохранить клиента");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{clientId ? "Редактировать клиента" : "Новый клиент"}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <Label>Имя клиента или название компании</Label>
              <Input {...register("name")} placeholder="ООО «Ромашка» или Иван Иванов" />
              {errors.name && <p className="text-[12px] text-[var(--color-negative)]">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Контактное лицо</Label>
                <Input {...register("contactName")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Город</Label>
                <Input {...register("city")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Телефон</Label>
                <Input {...register("phone")} placeholder="+7 900 000-00-00" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Email</Label>
                <Input {...register("email")} placeholder="mail@example.com" />
                {errors.email && <p className="text-[12px] text-[var(--color-negative)]">{errors.email.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Telegram</Label>
                <Input {...register("telegram")} placeholder="@username" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Сайт / соцсети</Label>
                <Input {...register("website")} placeholder="https://" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Откуда пришёл клиент</Label>
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
              <div className="flex flex-col gap-1.5">
                <Label>Статус клиента</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Общие заметки</Label>
              <Textarea rows={3} {...register("notes")} />
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
