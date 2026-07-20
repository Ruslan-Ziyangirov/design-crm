"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
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

interface Item {
  id: string;
  name: string;
  isSystem: boolean;
}

export function ReferenceListEditor({
  title,
  description,
  apiPath,
  items,
  onChanged,
}: {
  title: string;
  description: string;
  apiPath: string;
  items: Item[];
  onChanged: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function handleAdd() {
    if (!newName.trim()) return;
    const res = await fetch(apiPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      toast.success("Добавлено");
      setNewName("");
      setAdding(false);
      onChanged();
    } else toast.error("Не удалось добавить");
  }

  async function handleRename(id: string) {
    if (!editingName.trim()) return;
    const res = await fetch(`${apiPath}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editingName.trim() }),
    });
    if (res.ok) {
      toast.success("Сохранено");
      setEditingId(null);
      onChanged();
    } else toast.error("Не удалось сохранить");
  }

  async function handleDelete(id: string) {
    const res = await fetch(`${apiPath}/${id}`, { method: "DELETE" });
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
        <p className="font-display text-[14px] font-semibold text-[var(--color-ink)]">{title}</p>
        <p className="text-[12.5px] text-[var(--color-ink-muted)]">{description}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <div key={item.id} className="group flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] py-1 pl-3 pr-1.5">
            {editingId === item.id ? (
              <>
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="h-6 w-28 border-none p-0 text-[12.5px] shadow-none focus-visible:ring-0"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleRename(item.id)}
                />
                <button onClick={() => handleRename(item.id)} className="text-[var(--color-positive)]">
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setEditingId(null)} className="text-[var(--color-ink-faint)]">
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <>
                <span className="text-[12.5px] text-[var(--color-ink)]">{item.name}</span>
                <button
                  onClick={() => {
                    setEditingId(item.id);
                    setEditingName(item.name);
                  }}
                  className="ml-1 text-[var(--color-ink-faint)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-ink)]"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setDeleteId(item.id)}
                  className="text-[var(--color-ink-faint)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-negative)]"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        ))}

        {adding ? (
          <div className="flex items-center gap-1 rounded-full border border-[var(--color-accent)] bg-[var(--color-surface)] py-1 pl-3 pr-1.5">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Название"
              className="h-6 w-28 border-none p-0 text-[12.5px] shadow-none focus-visible:ring-0"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <button onClick={handleAdd} className="text-[var(--color-positive)]">
              <Check className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setAdding(false)} className="text-[var(--color-ink-faint)]">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setAdding(true)} className="h-7 gap-1 rounded-full">
            <Plus className="h-3.5 w-3.5" />
            Добавить
          </Button>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить значение?</AlertDialogTitle>
            <AlertDialogDescription>Связанные записи будут помечены как "не указано".</AlertDialogDescription>
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
