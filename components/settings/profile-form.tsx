"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { User } from "@/lib/db/schema";

const TIMEZONES = [
  "Europe/Kaliningrad", "Europe/Moscow", "Europe/Samara", "Asia/Yekaterinburg",
  "Asia/Omsk", "Asia/Krasnoyarsk", "Asia/Irkutsk", "Asia/Yakutsk", "Asia/Vladivostok",
];

export function ProfileForm({ user }: { user: Omit<User, "passwordHash"> }) {
  const [crmName, setCrmName] = useState(user.crmName);
  const [name, setName] = useState(user.name);
  const [timezone, setTimezone] = useState(user.timezone);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crmName, name, timezone }),
      });
      if (!res.ok) throw new Error();
      toast.success("Настройки сохранены");
    } catch {
      toast.error("Не удалось сохранить настройки");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3.5 max-w-md">
      <div className="flex flex-col gap-1.5">
        <Label>Название CRM</Label>
        <Input value={crmName} onChange={(e) => setCrmName(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Имя владельца</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Основная валюта</Label>
        <Input value="Российский рубль (₽)" disabled />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Часовой пояс</Label>
        <Select value={timezone} onValueChange={setTimezone}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Формат даты</Label>
        <Input value="ДД.ММ.ГГГГ" disabled />
      </div>
      <Button onClick={handleSave} disabled={saving} className="w-fit">
        {saving ? "Сохраняем..." : "Сохранить"}
      </Button>
    </div>
  );
}
