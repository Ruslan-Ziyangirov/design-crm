import { db } from "@/lib/db";
import {
  clients,
  orders,
  sources,
  serviceTypes,
  projectStatuses,
  paymentStatuses,
  timelineEvents,
  type Order,
} from "@/lib/db/schema";
import { and, eq, desc, asc } from "drizzle-orm";
import type { OrderForCalc } from "@/lib/calculations";

export async function getReferenceData(userId: string) {
  const [srcs, services, pStatuses, payStatuses] = await Promise.all([
    db.select().from(sources).where(eq(sources.userId, userId)).orderBy(asc(sources.sortOrder)),
    db
      .select()
      .from(serviceTypes)
      .where(eq(serviceTypes.userId, userId))
      .orderBy(asc(serviceTypes.sortOrder)),
    db
      .select()
      .from(projectStatuses)
      .where(eq(projectStatuses.userId, userId))
      .orderBy(asc(projectStatuses.sortOrder)),
    db
      .select()
      .from(paymentStatuses)
      .where(eq(paymentStatuses.userId, userId))
      .orderBy(asc(paymentStatuses.sortOrder)),
  ]);
  return { sources: srcs, serviceTypes: services, projectStatuses: pStatuses, paymentStatuses: payStatuses };
}

export type OrderWithRelations = Awaited<ReturnType<typeof getOrdersFull>>[number];

export async function getOrdersFull(userId: string) {
  return db.query.orders.findMany({
    where: eq(orders.userId, userId),
    with: {
      client: true,
      serviceType: true,
      status: true,
      paymentStatus: true,
      source: true,
    },
    orderBy: [desc(orders.createdAt)],
  });
}

export async function getOrderById(userId: string, orderId: string) {
  return db.query.orders.findFirst({
    where: and(eq(orders.userId, userId), eq(orders.id, orderId)),
    with: { client: true, serviceType: true, status: true, paymentStatus: true, source: true },
  });
}

export async function getClientsFull(userId: string) {
  return db.query.clients.findMany({
    where: eq(clients.userId, userId),
    with: { source: true, orders: true },
    orderBy: [desc(clients.createdAt)],
  });
}

export async function getClientDetail(userId: string, clientId: string) {
  return db.query.clients.findFirst({
    where: and(eq(clients.userId, userId), eq(clients.id, clientId)),
    with: {
      source: true,
      orders: {
        with: { serviceType: true, status: true, paymentStatus: true, source: true },
        orderBy: [desc(orders.createdAt)],
      },
      timeline: { orderBy: [desc(timelineEvents.eventDate)] },
    },
  });
}

/** Преобразует заказ из БД (с relations) в формат для чистого модуля расчётов. */
export function toCalcOrder(o: {
  id: string;
  statusId: string;
  price: number;
  paymentReceived: number;
  expenses: number;
  deadline: Date | null;
  createdAt: Date;
  completedDate: Date | null;
  startDate: Date | null;
  clientId: string;
  serviceTypeId: string | null;
  sourceId: string | null;
  status: { category: "active" | "done" | "cancelled" | "archived" };
}): OrderForCalc {
  return {
    id: o.id,
    statusId: o.statusId,
    price: o.price,
    paymentReceived: o.paymentReceived,
    expenses: o.expenses,
    statusCategory: o.status.category,
    deadline: o.deadline,
    createdAt: o.createdAt,
    completedDate: o.completedDate,
    startDate: o.startDate,
    clientId: o.clientId,
    serviceTypeId: o.serviceTypeId,
    sourceId: o.sourceId,
  };
}
