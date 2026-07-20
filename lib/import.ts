import { db } from "@/lib/db";
import { clients, sources, serviceTypes, projectStatuses, paymentStatuses, orders } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";

async function findOrCreateSource(userId: string, name: string | undefined) {
  if (!name?.trim()) return null;
  const trimmed = name.trim();
  const [existing] = await db
    .select()
    .from(sources)
    .where(and(eq(sources.userId, userId), sql`lower(${sources.name}) = lower(${trimmed})`))
    .limit(1);
  if (existing) return existing.id;
  const count = await db.select().from(sources).where(eq(sources.userId, userId));
  const [created] = await db.insert(sources).values({ userId, name: trimmed, sortOrder: count.length }).returning();
  return created.id;
}

async function findOrCreateServiceType(userId: string, name: string | undefined) {
  if (!name?.trim()) return null;
  const trimmed = name.trim();
  const [existing] = await db
    .select()
    .from(serviceTypes)
    .where(and(eq(serviceTypes.userId, userId), sql`lower(${serviceTypes.name}) = lower(${trimmed})`))
    .limit(1);
  if (existing) return existing.id;
  const count = await db.select().from(serviceTypes).where(eq(serviceTypes.userId, userId));
  const [created] = await db
    .insert(serviceTypes)
    .values({ userId, name: trimmed, sortOrder: count.length })
    .returning();
  return created.id;
}

/** Ищет статус проекта по имени (нестрого) или возвращает статус по умолчанию "Новый запрос". */
async function resolveProjectStatus(userId: string, name: string | undefined) {
  const all = await db.select().from(projectStatuses).where(eq(projectStatuses.userId, userId));
  if (name?.trim()) {
    const found = all.find((s) => s.name.toLowerCase() === name.trim().toLowerCase());
    if (found) return found;
  }
  return all.find((s) => s.category === "active") || all[0];
}

async function resolveDefaultPaymentStatus(userId: string) {
  const all = await db.select().from(paymentStatuses).where(eq(paymentStatuses.userId, userId));
  return all.find((s) => s.name === "Не оплачено") || all[0];
}

async function findClientByName(userId: string, name: string) {
  const [existing] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.userId, userId), sql`lower(${clients.name}) = lower(${name.trim()})`))
    .limit(1);
  return existing ?? null;
}

async function createClient(userId: string, name: string, sourceId: string | null) {
  const [row] = await db
    .insert(clients)
    .values({ userId, name: name.trim(), sourceId, status: "active" })
    .returning();
  return row;
}

async function findMatchingOrder(userId: string, clientId: string, title: string) {
  const [existing] = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.userId, userId),
        eq(orders.clientId, clientId),
        sql`lower(${orders.title}) = lower(${title.trim()})`,
      ),
    )
    .limit(1);
  return existing ?? null;
}

export const importHelpers = {
  findOrCreateSource,
  findOrCreateServiceType,
  resolveProjectStatus,
  resolveDefaultPaymentStatus,
  findClientByName,
  createClient,
  findMatchingOrder,
};
