"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { PaymentStatus } from "@/lib/db/schema";

const PALETTE = ["#64748b", "#2563eb", "#c8850f", "#1c8a5a", "#d33a2c", "#6b7280"];

export function PaymentStatusEditor({ statuses, onChanged }: { statuses: PaymentStatus[]; onChanged: () => void }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PALETTE[0]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function handleAdd() {
    if (!newName.trim()) return;
    const res = await fetch("/api/settings/payment-statuses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), color: newColor }),
    });
    if (res.ok) {
      toast.success("Статус оплаты добавлен");
      setNewName("");
      setAdding(false);
      onChanged();
    } else toast.error("Не удалось добавить");
  }

  async function updateColor(id: string, color: string) {
    await fetch(`/api/settings/payment-statuses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color }),
    });
    onChanged();
  }

  async function rename(id: string, name: string) {
    await fetch(`/api/settings/payment-statuses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    onChanged();
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/settings/payment-statuses/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Удалено");
      onChanged();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "Не удалось удалить");
    }
    setDeleteId(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="font-display text-[14px] font-semibold text-[var(--color-ink)]">Статусы оплаты</p>
      </div>
      <div className="flex flex-col gap-1.5">
        {statuses.map((s) => (
          <div key={s.id} className="flex items-center gap-2 rounded-[10px] border border-[var(--color-border)] p-2">
            <div className="flex items-center gap-1">
              {PALETTE.map((c) => (
                <button key={c} onClick={() => updateColor(s.id, c)} className="h-4 w-4 rounded-full" style={{ background: c, boxShadow: s.color === c ? `0 0 0 2px ${c}` : undefined }} />
              ))}
            </div>
            <Input defaultValue={s.name} onBlur={(e) => e.target.value !== s.name && rename(s.id, e.target.value)} className="h-7 max-w-[220px] text-[13px]" />
            <button onClick={() => setDeleteId(s.id)} className="ml-auto text-[var(--color-ink-faint)] hover:text-[var(--color-negative)]">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="flex items-center gap-2 rounded-[10px] border border-[var(--color-accent)] p-2">
          <div className="flex items-center gap-1">
            {PALETTE.map((c) => (
              <button key={c} onClick={() => setNewColor(c)} className="h-4 w-4 rounded-full" style={{ background: c, boxShadow: newColor === c ? `0 0 0 2px ${c}` : undefined }} />
            ))}
          </div>
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Название" className="h-7 max-w-[200px] text-[13px]" onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
          <Button size="sm" onClick={handleAdd}>Добавить</Button>
          <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Отмена</Button>
        </div>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setAdding(true)} className="w-fit gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Новый статус оплаты
        </Button>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить статус оплаты?</AlertDialogTitle>
            <AlertDialogDescription>Нельзя удалить статус, который используется хотя бы в одном заказе.</AlertDialogDescription>
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
