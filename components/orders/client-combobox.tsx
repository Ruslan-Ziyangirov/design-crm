"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Client } from "@/lib/db/schema";

interface Props {
  clients: Client[];
  value: string | undefined;
  onChange: (clientId: string) => void;
  onClientCreated: (client: Client) => void;
}

export function ClientCombobox({ clients, value, onChange, onClientCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = clients.find((c) => c.id === value);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = q ? clients.filter((c) => c.name.toLowerCase().includes(q)) : clients;
  const exactMatch = clients.some((c) => c.name.toLowerCase() === q);

  async function handleCreate() {
    const name = query.trim();
    if (!name) return;
    setCreating(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, status: "lead", tags: [] }),
      });
      if (!res.ok) throw new Error();
      const client: Client = await res.json();
      toast.success(`Клиент «${client.name}» добавлен`);
      onClientCreated(client);
      onChange(client.id);
      setOpen(false);
    } catch {
      toast.error("Не удалось создать клиента");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]",
            !selected && "text-[var(--color-ink-faint)]",
          )}
        >
          <span className="truncate">{selected ? selected.name : "Выберите или создайте клиента"}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-1.5">
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск клиента или новое имя..."
          className="mb-1.5"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !exactMatch && query.trim()) {
              e.preventDefault();
              handleCreate();
            }
          }}
        />
        <div className="max-h-56 overflow-y-auto">
          {filtered.length === 0 && !query.trim() && (
            <p className="px-2 py-3 text-center text-[12.5px] text-[var(--color-ink-faint)]">Нет клиентов — начните вводить имя</p>
          )}
          {filtered.slice(0, 30).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onChange(c.id);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-2 rounded-[8px] px-2 py-1.5 text-left text-[13px] hover:bg-black/[0.04]"
            >
              <span className="truncate">{c.name}</span>
              {c.id === value && <Check className="h-3.5 w-3.5 shrink-0 text-[var(--color-accent)]" />}
            </button>
          ))}
          {query.trim() && !exactMatch && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="flex w-full items-center gap-2 rounded-[8px] px-2 py-1.5 text-left text-[13px] text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]"
            >
              {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Добавить нового клиента «{query.trim()}»
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
