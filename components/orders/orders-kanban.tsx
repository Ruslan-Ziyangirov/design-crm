"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { formatMoney, formatDate } from "@/lib/format";
import { isOverdue } from "@/lib/calculations";
import { cn } from "@/lib/utils";
import type { OrderWithRelations } from "@/lib/db/queries";
import type { ProjectStatus } from "@/lib/db/schema";

function KanbanCard({ order, onEdit }: { order: OrderWithRelations; onEdit: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: order.id });
  const overdue = isOverdue({
    deadline: order.deadline ? new Date(order.deadline) : null,
    statusCategory: order.status?.category ?? "active",
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => !isDragging && onEdit(order.id)}
      style={transform ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 10 } : undefined}
      className={cn(
        "cursor-grab rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-soft)] active:cursor-grabbing",
        isDragging && "opacity-60",
      )}
    >
      <p className="truncate text-[13px] font-medium text-[var(--color-ink)]">{order.title}</p>
      <p className="mt-0.5 truncate text-[12px] text-[var(--color-ink-muted)]">{order.client?.name ?? "—"}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="font-numeric text-[13px] font-semibold text-[var(--color-ink)]">
          {formatMoney(order.price)}
        </span>
        {order.deadline && (
          <span className={cn("text-[11px]", overdue ? "font-medium text-[var(--color-negative)]" : "text-[var(--color-ink-faint)]")}>
            {formatDate(order.deadline)}
          </span>
        )}
      </div>
      {order.serviceType && (
        <p className="mt-1 truncate text-[11px] text-[var(--color-ink-faint)]">{order.serviceType.name}</p>
      )}
    </div>
  );
}

function KanbanColumn({
  status,
  orders,
  onEdit,
}: {
  status: ProjectStatus;
  orders: OrderWithRelations[];
  onEdit: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status.id });
  const total = orders.reduce((s, o) => s + o.price, 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-[260px] shrink-0 flex-col rounded-[14px] border border-[var(--color-border)] bg-black/[0.015] p-2.5",
        isOver && "ring-2 ring-[var(--color-accent)]",
      )}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: status.color }} />
          <p className="text-[12.5px] font-semibold text-[var(--color-ink)]">{status.name}</p>
          <span className="text-[11.5px] text-[var(--color-ink-faint)]">{orders.length}</span>
        </div>
      </div>
      <p className="mb-2 px-1 font-numeric text-[11.5px] text-[var(--color-ink-faint)]">{formatMoney(total)}</p>
      <div className="flex min-h-[60px] flex-1 flex-col gap-2">
        {orders.map((o) => (
          <KanbanCard key={o.id} order={o} onEdit={onEdit} />
        ))}
      </div>
    </div>
  );
}

export function OrdersKanban({
  orders,
  statuses,
  onEdit,
  onChanged,
}: {
  orders: OrderWithRelations[];
  statuses: ProjectStatus[];
  onEdit: (id: string) => void;
  onChanged: () => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localOrders, setLocalOrders] = useState(orders);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useMemo(() => setLocalOrders(orders), [orders]);

  const sortedStatuses = useMemo(
    () => [...statuses].filter((s) => s.category !== "archived").sort((a, b) => a.sortOrder - b.sortOrder),
    [statuses],
  );

  const byStatus = useMemo(() => {
    const map = new Map<string, OrderWithRelations[]>();
    for (const s of sortedStatuses) map.set(s.id, []);
    for (const o of localOrders) {
      if (!map.has(o.statusId)) map.set(o.statusId, []);
      map.get(o.statusId)!.push(o);
    }
    return map;
  }, [localOrders, sortedStatuses]);

  const activeOrder = localOrders.find((o) => o.id === activeId);

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string);
  }

  async function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const orderId = active.id as string;
    const newStatusId = over.id as string;
    const order = localOrders.find((o) => o.id === orderId);
    if (!order || order.statusId === newStatusId) return;

    setLocalOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, statusId: newStatusId } : o)));

    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusId: newStatusId }),
    });
    if (res.ok) {
      toast.success("Статус заказа обновлён");
      onChanged();
    } else {
      toast.error("Не удалось изменить статус");
      setLocalOrders(orders);
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-3">
        {sortedStatuses.map((status) => (
          <KanbanColumn key={status.id} status={status} orders={byStatus.get(status.id) ?? []} onEdit={onEdit} />
        ))}
      </div>
      <DragOverlay>{activeOrder && <KanbanCard order={activeOrder} onEdit={() => {}} />}</DragOverlay>
    </DndContext>
  );
}
