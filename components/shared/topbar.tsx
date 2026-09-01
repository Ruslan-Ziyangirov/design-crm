"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import { Search, Plus, Moon, Sun, LogOut, CircleUserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { OrderFormDialog } from "@/components/orders/order-form-dialog";
import { formatMoney } from "@/lib/format";
import Link from "next/link";

interface SearchClient {
  id: string;
  name: string;
  email: string | null;
}
interface SearchOrder {
  id: string;
  title: string;
  paymentReceived: number;
  client: { id: string; name: string } | null;
}

export function Topbar({ ownerName, ownerEmail }: { ownerName: string; ownerEmail: string }) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ clients: SearchClient[]; orders: SearchOrder[] }>({ clients: [], orders: [] });
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const typing = ["INPUT", "TEXTAREA"].includes(target.tagName) || target.isContentEditable;
      if (typing) return;
      if (e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setQuickAddOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setSearchOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ clients: [], orders: [] });
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`).then((r) => r.json());
      setResults(res);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 lg:px-6">
      <div ref={searchRef} className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-faint)]" />
        <Input
          placeholder="Поиск клиентов и заказов…"
          className="pl-8 pr-14"
          value={query}
          onFocus={() => setSearchOpen(true)}
          onChange={(e) => setQuery(e.target.value)}
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-[var(--color-border)] bg-black/[0.03] px-1.5 py-0.5 text-[10px] text-[var(--color-ink-faint)]">
          ⌘K
        </kbd>

        {searchOpen && query.trim().length >= 2 && (
          <div className="absolute left-0 top-11 z-50 w-[420px] max-h-[60vh] overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-2 shadow-[var(--shadow-lifted)] animate-fade-in">
            {results.clients.length === 0 && results.orders.length === 0 && (
              <p className="px-2 py-3 text-[13px] text-[var(--color-ink-muted)]">Ничего не найдено</p>
            )}
            {results.clients.length > 0 && (
              <div className="mb-1">
                <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">
                  Клиенты
                </p>
                {results.clients.map((c) => (
                  <Link
                    key={c.id}
                    href={`/clients/${c.id}`}
                    onClick={() => setSearchOpen(false)}
                    className="block rounded-[var(--radius-sm)] px-2 py-1.5 text-[13px] hover:bg-[var(--color-accent-soft)]"
                  >
                    {c.name}
                    {c.email && <span className="ml-2 text-[var(--color-ink-faint)]">{c.email}</span>}
                  </Link>
                ))}
              </div>
            )}
            {results.orders.length > 0 && (
              <div>
                <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">
                  Заказы
                </p>
                {results.orders.map((o) => (
                  <Link
                    key={o.id}
                    href={`/orders?open=${o.id}`}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center justify-between rounded-[var(--radius-sm)] px-2 py-1.5 text-[13px] hover:bg-[var(--color-accent-soft)]"
                  >
                    <span>
                      {o.title}
                      {o.client && <span className="ml-2 text-[var(--color-ink-faint)]">{o.client.name}</span>}
                    </span>
                    <span className="font-numeric text-[var(--color-ink-muted)]">{formatMoney(o.paymentReceived)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => setQuickAddOpen(true)} className="gap-1.5 rounded-full">
          <Plus className="h-4 w-4" />
          Новый заказ
          <kbd className="ml-1 rounded bg-white/20 px-1 text-[10px]">N</kbd>
        </Button>

        <Button
          variant="secondary"
          size="icon"
          className="rounded-full"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          aria-label="Переключить тему"
        >
          {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Меню профиля"
              className="ml-1 flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] py-1 pl-1 pr-3 transition-[border-color,box-shadow] hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[12px] font-semibold text-[var(--color-accent-ink)]">
                {ownerName ? ownerName.charAt(0).toUpperCase() : <CircleUserRound className="h-4 w-4" />}
              </div>
              <div className="hidden min-w-0 text-left sm:block">
                <p className="truncate text-[12.5px] font-medium leading-tight text-[var(--color-ink)]">{ownerName}</p>
                {ownerEmail && (
                  <p className="max-w-[140px] truncate text-[11px] leading-tight text-[var(--color-ink-faint)]">
                    {ownerEmail}
                  </p>
                )}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push("/settings")}>Настройки</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="mr-2 h-3.5 w-3.5" /> Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <OrderFormDialog
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        onSaved={() => router.refresh()}
      />
    </header>
  );
}
