"use client";

import { useMemo, useState, Fragment } from "react";
import { toast } from "sonner";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
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
import { MoreHorizontal, ArrowUpDown, ChevronLeft, ChevronRight, Copy, Trash2, Archive, Pencil } from "lucide-react";
import { StatusBadge } from "@/components/orders/status-badge";
import { formatMoney, formatDate } from "@/lib/format";
import { calcProfit, isOverdue } from "@/lib/calculations";
import { cn } from "@/lib/utils";
import type { OrderWithRelations } from "@/lib/db/queries";
import type { OrdersFilters } from "@/components/orders/orders-view";

type SortKey = "title" | "client" | "paymentReceived" | "profit" | "deadline" | "createdAt";

const PAGE_SIZE = 20;

export function OrdersTable({
  orders,
  groupBy,
  onEdit,
  onChanged,
}: {
  orders: OrderWithRelations[];
  groupBy: OrdersFilters["groupBy"];
  onEdit: (id: string) => void;
  onChanged: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const sorted = useMemo(() => {
    const arr = [...orders];
    arr.sort((a, b) => {
      let av: number | string = "";
      let bv: number | string = "";
      switch (sortKey) {
        case "title":
          av = a.title; bv = b.title; break;
        case "client":
          av = a.client?.name ?? ""; bv = b.client?.name ?? ""; break;
        case "paymentReceived":
          av = a.paymentReceived; bv = b.paymentReceived; break;
        case "profit":
          av = calcProfit(a); bv = calcProfit(b); break;
        case "deadline":
          av = a.deadline ? new Date(a.deadline).getTime() : 0; bv = b.deadline ? new Date(b.deadline).getTime() : 0; break;
        case "createdAt":
          av = new Date(a.createdAt).getTime(); bv = new Date(b.createdAt).getTime(); break;
      }
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : av - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [orders, sortKey, sortDir]);

  const groups = useMemo(() => {
    if (groupBy === "none") return [{ key: "all", label: "", rows: sorted }];
    const map = new Map<string, OrderWithRelations[]>();
    for (const o of sorted) {
      let key: string;
      if (groupBy === "month") {
        const d = new Date(o.createdAt);
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      } else if (groupBy === "status") {
        key = o.status?.name ?? "Без статуса";
      } else {
        key = o.client?.name ?? "Без клиента";
      }
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(o);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, rows]) => ({ key, label: groupBy === "month" ? monthLabel(key) : key, rows }));
  }, [sorted, groupBy]);

  const flatRows = useMemo(() => groups.flatMap((g) => g.rows), [groups]);
  const totalPages = Math.max(1, Math.ceil(flatRows.length / PAGE_SIZE));
  const pageRows = useMemo(
    () => (groupBy === "none" ? flatRows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE) : flatRows),
    [flatRows, page, groupBy],
  );

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === pageRows.length) setSelected(new Set());
    else setSelected(new Set(pageRows.map((o) => o.id)));
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Заказ удалён");
      onChanged();
    } else toast.error("Не удалось удалить заказ");
    setDeleteId(null);
  }

  async function handleDuplicate(id: string) {
    const res = await fetch(`/api/orders/${id}/duplicate`, { method: "POST" });
    if (res.ok) {
      toast.success("Заказ дублирован");
      onChanged();
    } else toast.error("Не удалось дублировать заказ");
  }

  async function handleBulkArchive() {
    const res = await fetch("/api/orders/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), archived: true }),
    });
    if (res.ok) {
      toast.success(`Архивировано заказов: ${selected.size}`);
      setSelected(new Set());
      onChanged();
    } else toast.error("Не удалось архивировать заказы");
  }

  async function handleBulkDelete() {
    const res = await fetch("/api/orders/bulk", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    if (res.ok) {
      toast.success(`Удалено заказов: ${selected.size}`);
      setSelected(new Set());
      onChanged();
    } else toast.error("Не удалось удалить заказы");
    setBulkDeleteOpen(false);
  }

  function exportSelected() {
    const ids = new Set(selected);
    const rows = orders.filter((o) => ids.has(o.id));
    const header = ["Заказ", "Клиент", "Выручка", "Расход", "Прибыль", "Статус"];
    const csvRows = rows.map((o) =>
      [o.title, o.client?.name ?? "", o.paymentReceived, o.expenses, calcProfit(o), o.status?.name ?? ""]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = "\uFEFF" + [header.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders_selected.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const SortButton = ({ label, sortKeyValue }: { label: string; sortKeyValue: SortKey }) => (
    <button
      className="inline-flex items-center gap-1 hover:text-[var(--color-ink)]"
      onClick={() => toggleSort(sortKeyValue)}
    >
      {label}
      <ArrowUpDown className={cn("h-3 w-3", sortKey === sortKeyValue && "text-[var(--color-accent)]")} />
    </button>
  );

  return (
    <div className="flex flex-col gap-3">
      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-[12px] border border-[var(--color-border)] bg-[var(--color-accent-soft)] px-4 py-2">
          <p className="text-[13px] font-medium text-[var(--color-accent-ink)]">Выбрано: {selected.size}</p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={exportSelected} className="gap-1.5">
              Экспорт выбранных
            </Button>
            <Button size="sm" variant="secondary" onClick={handleBulkArchive} className="gap-1.5">
              <Archive className="h-3.5 w-3.5" />
              В архив
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setBulkDeleteOpen(true)} className="gap-1.5">
              <Trash2 className="h-3.5 w-3.5" />
              Удалить
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-h-[65vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-9">
                  <Checkbox checked={pageRows.length > 0 && selected.size === pageRows.length} onCheckedChange={toggleSelectAll} />
                </TableHead>
                <TableHead><SortButton label="Заказ" sortKeyValue="title" /></TableHead>
                <TableHead><SortButton label="Клиент" sortKeyValue="client" /></TableHead>
                <TableHead>Услуга</TableHead>
                <TableHead className="text-right"><SortButton label="Выручка" sortKeyValue="paymentReceived" /></TableHead>
                <TableHead className="text-right">Расход</TableHead>
                <TableHead className="text-right"><SortButton label="Прибыль" sortKeyValue="profit" /></TableHead>
                <TableHead>Отзыв</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Оплата</TableHead>
                <TableHead>Источник</TableHead>
                <TableHead><SortButton label="Дедлайн" sortKeyValue="deadline" /></TableHead>
                <TableHead className="w-9" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) => (
                <Fragment key={`grp-${group.key}`}>
                  {group.label && (
                    <TableRow key={`g-${group.key}`} className="bg-black/[0.02] hover:bg-black/[0.02]">
                      <TableCell colSpan={12} className="py-1.5 text-[12px] font-semibold text-[var(--color-ink-muted)]">
                        {group.label} · {group.rows.length} заказ(ов) ·{" "}
                        {formatMoney(group.rows.reduce((s, o) => s + o.paymentReceived, 0))}
                      </TableCell>
                    </TableRow>
                  )}
                  {(groupBy === "none" ? group.rows.filter((r) => pageRows.includes(r)) : group.rows).map((o) => {
                    const overdue = isOverdue({ deadline: o.deadline ? new Date(o.deadline) : null, statusCategory: o.status?.category ?? "active" });
                    return (
                      <TableRow key={o.id} data-state={selected.has(o.id) ? "selected" : undefined}>
                        <TableCell>
                          <Checkbox checked={selected.has(o.id)} onCheckedChange={() => toggleSelect(o.id)} />
                        </TableCell>
                        <TableCell className="max-w-[220px]">
                          <button className="truncate text-left font-medium text-[var(--color-ink)] hover:underline" onClick={() => onEdit(o.id)}>
                            {o.title}
                          </button>
                        </TableCell>
                        <TableCell className="max-w-[160px] truncate text-[var(--color-ink-muted)]">
                          {o.client?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-[var(--color-ink-muted)]">{o.serviceType?.name ?? "—"}</TableCell>
                        <TableCell className="text-right font-numeric">{formatMoney(o.paymentReceived)}</TableCell>
                        <TableCell className="text-right font-numeric text-[var(--color-ink-muted)]">{formatMoney(o.expenses)}</TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-numeric font-medium",
                            calcProfit(o) >= 0 ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]",
                          )}
                        >
                          {formatMoney(calcProfit(o))}
                        </TableCell>
                        <TableCell>
                          {o.reviewReceived ? (
                            <Badge variant="positive">Есть</Badge>
                          ) : (
                            <Badge variant="neutral">Нет</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {o.status && <StatusBadge name={o.status.name} color={o.status.color} />}
                        </TableCell>
                        <TableCell>
                          {o.paymentStatus && <StatusBadge name={o.paymentStatus.name} color={o.paymentStatus.color} />}
                        </TableCell>
                        <TableCell className="text-[var(--color-ink-muted)]">{o.source?.name ?? "—"}</TableCell>
                        <TableCell className={cn(overdue && "font-medium text-[var(--color-negative)]")}>
                          {formatDate(o.deadline)}
                          {overdue && " · просрочен"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onEdit(o.id)}>
                                <Pencil className="mr-2 h-3.5 w-3.5" /> Редактировать
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicate(o.id)}>
                                <Copy className="mr-2 h-3.5 w-3.5" /> Дублировать
                              </DropdownMenuItem>
                              <DropdownMenuItem destructive onClick={() => setDeleteId(o.id)}>
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Удалить
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>

        {groupBy === "none" && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-2.5">
            <p className="text-[12px] text-[var(--color-ink-muted)]">
              Страница {page + 1} из {totalPages} · всего {flatRows.length}
            </p>
            <div className="flex gap-1.5">
              <Button variant="secondary" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить заказ?</AlertDialogTitle>
            <AlertDialogDescription>Это действие необратимо. Все данные по заказу будут удалены.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить выбранные заказы?</AlertDialogTitle>
            <AlertDialogDescription>
              Будет удалено заказов: {selected.size}. Это действие необратимо.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const months = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  return `${months[m - 1]} ${y}`;
}
