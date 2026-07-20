"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Phone,
  MessageCircle,
  Users as UsersIcon,
  Send,
  Banknote,
  FolderInput,
  PackageCheck,
  Star,
  StickyNote,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/format";
import type { TimelineEvent } from "@/lib/db/schema";

const TYPE_META: Record<string, { label: string; icon: typeof Phone; color: string }> = {
  call: { label: "Звонок", icon: Phone, color: "#2563eb" },
  message: { label: "Сообщение", icon: MessageCircle, color: "#2563eb" },
  meeting: { label: "Встреча", icon: UsersIcon, color: "#7c5cbf" },
  proposal_sent: { label: "Отправлено предложение", icon: Send, color: "#c8850f" },
  prepayment_received: { label: "Получена предоплата", icon: Banknote, color: "#1c8a5a" },
  materials_received: { label: "Получены материалы", icon: FolderInput, color: "#c8850f" },
  result_sent: { label: "Отправлен результат", icon: PackageCheck, color: "#1c8a5a" },
  review_received: { label: "Получен отзыв", icon: Star, color: "#c8850f" },
  note: { label: "Заметка", icon: StickyNote, color: "#6b7280" },
};

export function ClientTimeline({ clientId, events, onChanged }: { clientId: string; events: TimelineEvent[]; onChanged: () => void }) {
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState("note");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    setSaving(true);
    try {
      const res = await fetch("/api/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, type, note, eventDate: date }),
      });
      if (!res.ok) throw new Error();
      toast.success("Событие добавлено");
      setNote("");
      setAdding(false);
      onChanged();
    } catch {
      toast.error("Не удалось добавить событие");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/timeline/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Событие удалено");
      onChanged();
    } else toast.error("Не удалось удалить событие");
  }

  const sorted = [...events].sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="font-display text-[14px] font-semibold text-[var(--color-ink)]">Таймлайн взаимодействия</p>
        <Button size="sm" variant="secondary" onClick={() => setAdding((v) => !v)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Добавить событие
        </Button>
      </div>

      {adding && (
        <div className="flex flex-col gap-2 rounded-[12px] border border-[var(--color-border)] p-3">
          <div className="flex gap-2">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_META).map(([value, meta]) => (
                  <SelectItem key={value} value={value}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-[150px]" />
          </div>
          <Textarea placeholder="Комментарий (необязательно)" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Отмена
            </Button>
            <Button size="sm" onClick={handleAdd} disabled={saving}>
              {saving ? "Сохраняем..." : "Добавить"}
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col">
        {sorted.length === 0 && <p className="text-[13px] text-[var(--color-ink-faint)]">Пока нет событий</p>}
        {sorted.map((e, i) => {
          const meta = TYPE_META[e.type] ?? TYPE_META.note;
          const Icon = meta.icon;
          return (
            <div key={e.id} className="group flex gap-3 pb-4">
              <div className="flex flex-col items-center">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  style={{ background: `${meta.color}1a`, color: meta.color }}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {i < sorted.length - 1 && <span className="mt-1 w-px flex-1 bg-[var(--color-border)]" />}
              </div>
              <div className="flex-1 pb-1">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-medium text-[var(--color-ink)]">{meta.label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[11.5px] text-[var(--color-ink-faint)]">{formatDateTime(e.eventDate)}</span>
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="opacity-0 transition-opacity group-hover:opacity-100 text-[var(--color-ink-faint)] hover:text-[var(--color-negative)]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {e.note && <p className="mt-0.5 text-[12.5px] text-[var(--color-ink-muted)]">{e.note}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
