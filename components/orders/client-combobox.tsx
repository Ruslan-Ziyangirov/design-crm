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

const LISTBOX_ID = "client-combobox-listbox";

export function ClientCombobox({ clients, value, onChange, onClientCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = clients.find((c) => c.id === value);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  const q = query.trim().toLowerCase();
  const filtered = (q ? clients.filter((c) => c.name.toLowerCase().includes(q)) : clients).slice(0, 30);
  const exactMatch = clients.some((c) => c.name.toLowerCase() === q);
  const showCreate = !!query.trim() && !exactMatch;
  // Виртуальный список для навигации стрелками: элементы клиентов + опция "создать" последней.
  const optionCount = filtered.length + (showCreate ? 1 : 0);

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

  function selectByIndex(index: number) {
    if (index < 0 || index >= optionCount) return;
    if (index < filtered.length) {
      onChange(filtered[index].id);
      setOpen(false);
    } else {
      handleCreate();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, optionCount - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0) selectByIndex(activeIndex);
      else if (showCreate) handleCreate();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const activeId = activeIndex >= 0 ? `${LISTBOX_ID}-option-${activeIndex}` : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm shadow-sm transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:border-[var(--color-accent)]",
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
          role="combobox"
          aria-expanded="true"
          aria-controls={LISTBOX_ID}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          onKeyDown={handleKeyDown}
        />
        <div id={LISTBOX_ID} role="listbox" aria-label="Клиенты" className="max-h-56 overflow-y-auto">
          {filtered.length === 0 && !query.trim() && (
            <p className="px-2 py-3 text-center text-[12.5px] text-[var(--color-ink-faint)]">Нет клиентов — начните вводить имя</p>
          )}
          {filtered.map((c, i) => (
            <button
              key={c.id}
              id={`${LISTBOX_ID}-option-${i}`}
              role="option"
              aria-selected={c.id === value}
              type="button"
              onClick={() => selectByIndex(i)}
              onMouseEnter={() => setActiveIndex(i)}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-[13px]",
                i === activeIndex ? "bg-[var(--color-accent-soft)]" : "hover:bg-[var(--color-accent-soft)]",
              )}
            >
              <span className="truncate">{c.name}</span>
              {c.id === value && <Check className="h-3.5 w-3.5 shrink-0 text-[var(--color-accent)]" />}
            </button>
          ))}
          {showCreate && (
            <button
              id={`${LISTBOX_ID}-option-${filtered.length}`}
              role="option"
              aria-selected={false}
              type="button"
              onClick={() => selectByIndex(filtered.length)}
              onMouseEnter={() => setActiveIndex(filtered.length)}
              disabled={creating}
              className={cn(
                "flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-[13px] text-[var(--color-accent)]",
                filtered.length === activeIndex ? "bg-[var(--color-accent-soft)]" : "hover:bg-[var(--color-accent-soft)]",
              )}
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
