"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
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
import type { ProjectStatus } from "@/lib/db/schema";

const PALETTE = ["#64748b", "#2563eb", "#c8850f", "#7c5cbf", "#ea580c", "#1c8a5a", "#d33a2c", "#94a3b8", "#ff3c00", "#6b7280"];

const CATEGORY_LABELS: Record<string, string> = {
  active: "В работе (влияет на активные проекты)",
  done: "Завершён (учитывается как готово)",
  cancelled: "Отменён (исключается из выручки)",
  archived: "Архив",
};

export function StatusListEditor({ statuses, onChanged }: { statuses: ProjectStatus[]; onChanged: () => void }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PALETTE[0]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const sorted = [...statuses].sort((a, b) => a.sortOrder - b.sortOrder);

  async function handleAdd() {
    if (!newName.trim()) return;
    const res = await fetch("/api/settings/project-statuses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), color: newColor, category: "active" }),
    });
    if (res.ok) {
      toast.success("Статус добавлен");
      setNewName("");
      setAdding(false);
      onChanged();
    } else toast.error("Не удалось добавить статус");
  }

  async function updateColor(id: string, color: string) {
    await fetch(`/api/settings/project-statuses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color }),
    });
    onChanged();
  }

  async function updateCategory(id: string, category: string) {
    await fetch(`/api/settings/project-statuses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category }),
    });
    onChanged();
  }

  async function rename(id: string, name: string) {
    await fetch(`/api/settings/project-statuses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    onChanged();
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/settings/project-statuses/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Статус удалён");
      onChanged();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "Не удалось удалить статус");
    }
    setDeleteId(null);
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= sorted.length) return;
    const reordered = [...sorted];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    await fetch("/api/settings/project-statuses/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: reordered.map((s) => s.id) }),
    });
    onChanged();
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="font-display text-[14px] font-semibold text-[var(--color-ink)]">Статусы проекта</p>
        <p className="text-[12.5px] text-[var(--color-ink-muted)]">
          Порядок статусов определяет колонки канбана и воронку на дашборде
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        {sorted.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 rounded-[10px] border border-[var(--color-border)] p-2">
            <div className="flex flex-col">
              <button disabled={i === 0} onClick={() => move(i, -1)} className="text-[var(--color-ink-faint)] disabled:opacity-20 hover:text-[var(--color-ink)]">
                <ArrowUp className="h-3 w-3" />
              </button>
              <button disabled={i === sorted.length - 1} onClick={() => move(i, 1)} className="text-[var(--color-ink-faint)] disabled:opacity-20 hover:text-[var(--color-ink)]">
                <ArrowDown className="h-3 w-3" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => updateColor(s.id, c)}
                  className="h-4 w-4 rounded-full ring-offset-1"
                  style={{ background: c, boxShadow: s.color === c ? `0 0 0 2px ${c}` : undefined }}
                />
              ))}
            </div>

            <Input
              defaultValue={s.name}
              onBlur={(e) => e.target.value !== s.name && rename(s.id, e.target.value)}
              className="h-7 max-w-[180px] text-[13px]"
            />

            <Select value={s.category} onValueChange={(v) => updateCategory(s.id, v)}>
              <SelectTrigger className="h-7 flex-1 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <button onClick={() => setDeleteId(s.id)} className="text-[var(--color-ink-faint)] hover:text-[var(--color-negative)]">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="flex items-center gap-2 rounded-[10px] border border-[var(--color-accent)] p-2">
          <div className="flex items-center gap-1">
            {PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className="h-4 w-4 rounded-full"
                style={{ background: c, boxShadow: newColor === c ? `0 0 0 2px ${c}` : undefined }}
              />
            ))}
          </div>
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Название статуса" className="h-7 max-w-[200px] text-[13px]" onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
          <Button size="sm" onClick={handleAdd}>
            Добавить
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
            Отмена
          </Button>
        </div>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setAdding(true)} className="w-fit gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Новый статус
        </Button>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить статус?</AlertDialogTitle>
            <AlertDialogDescription>
              Нельзя удалить статус, который используется хотя бы в одном заказе.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
