import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  clients,
  orders,
  sources,
  serviceTypes,
  projectStatuses,
  paymentStatuses,
  timelineEvents,
  type NewClient,
  type NewOrder,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireUserId, errorResponse } from "@/lib/auth/session-helpers";

function toDate(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? null : d;
}

/** Оборачивает шаг восстановления, чтобы в случае ошибки было понятно, на каком именно шаге она произошла. */
async function step<T>(label: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`[шаг: ${label}] ${msg}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const backup = await req.json();

    if (!backup || typeof backup !== "object" || !Array.isArray(backup.clients)) {
      return NextResponse.json({ error: "Файл резервной копии повреждён или имеет неверный формат" }, { status: 400 });
    }

    await step("удаление timelineEvents", () => db.delete(timelineEvents).where(eq(timelineEvents.userId, userId)));
    await step("удаление orders", () => db.delete(orders).where(eq(orders.userId, userId)));
    await step("удаление clients", () => db.delete(clients).where(eq(clients.userId, userId)));
    await step("удаление paymentStatuses", () => db.delete(paymentStatuses).where(eq(paymentStatuses.userId, userId)));
    await step("удаление projectStatuses", () => db.delete(projectStatuses).where(eq(projectStatuses.userId, userId)));
    await step("удаление serviceTypes", () => db.delete(serviceTypes).where(eq(serviceTypes.userId, userId)));
    await step("удаление sources", () => db.delete(sources).where(eq(sources.userId, userId)));

    type RawSource = { id: string; name: string; sortOrder: number; isSystem: boolean };
    type RawService = RawSource;
    type RawProjectStatus = RawSource & { color: string; category: "active" | "done" | "cancelled" | "archived" };
    type RawPaymentStatus = RawSource & { color: string };
    type RawClient = Record<string, unknown> & { id: string; name: string };
    type RawOrder = Record<string, unknown> & { id: string; clientId: string; title: string; statusId: string; paymentStatusId: string };
    type RawTimeline = Record<string, unknown> & { id: string; clientId: string; type: string };

    if (backup.sources?.length) {
      await step("вставка sources", () =>
        db.insert(sources).values(
          (backup.sources as RawSource[]).map((r) => ({
            ...r,
            userId,
            createdAt: toDate((r as Record<string, unknown>).createdAt) ?? new Date(),
            updatedAt: toDate((r as Record<string, unknown>).updatedAt) ?? new Date(),
          })),
        ),
      );
    }
    if (backup.serviceTypes?.length) {
      await step("вставка serviceTypes", () =>
        db.insert(serviceTypes).values(
          (backup.serviceTypes as RawService[]).map((r) => ({
            ...r,
            userId,
            createdAt: toDate((r as Record<string, unknown>).createdAt) ?? new Date(),
            updatedAt: toDate((r as Record<string, unknown>).updatedAt) ?? new Date(),
          })),
        ),
      );
    }
    if (backup.projectStatuses?.length) {
      await step("вставка projectStatuses", () =>
        db.insert(projectStatuses).values(
          (backup.projectStatuses as RawProjectStatus[]).map((r) => ({
            ...r,
            userId,
            createdAt: toDate((r as Record<string, unknown>).createdAt) ?? new Date(),
            updatedAt: toDate((r as Record<string, unknown>).updatedAt) ?? new Date(),
          })),
        ),
      );
    }
    if (backup.paymentStatuses?.length) {
      await step("вставка paymentStatuses", () =>
        db.insert(paymentStatuses).values(
          (backup.paymentStatuses as RawPaymentStatus[]).map((r) => ({
            ...r,
            userId,
            createdAt: toDate((r as Record<string, unknown>).createdAt) ?? new Date(),
            updatedAt: toDate((r as Record<string, unknown>).updatedAt) ?? new Date(),
          })),
        ),
      );
    }
    if (backup.clients?.length) {
      await step("вставка clients", () => {
        const rows: NewClient[] = (backup.clients as RawClient[]).map((r) => ({
          ...(r as object),
          userId,
          lastContactAt: toDate(r.lastContactAt),
          createdAt: toDate(r.createdAt) ?? new Date(),
          updatedAt: toDate(r.updatedAt) ?? new Date(),
        })) as NewClient[];
        return db.insert(clients).values(rows);
      });
    }
    if (backup.orders?.length) {
      await step("вставка orders", () => {
        const rows: NewOrder[] = (backup.orders as RawOrder[]).map((r) => ({
          ...(r as object),
          userId,
          firstContactDate: toDate(r.firstContactDate),
          startDate: toDate(r.startDate),
          deadline: toDate(r.deadline),
          completedDate: toDate(r.completedDate),
          createdAt: toDate(r.createdAt) ?? new Date(),
          updatedAt: toDate(r.updatedAt) ?? new Date(),
        })) as NewOrder[];
        return db.insert(orders).values(rows);
      });
    }
    if (backup.timelineEvents?.length) {
      await step("вставка timelineEvents", () => {
        const rows = (backup.timelineEvents as RawTimeline[]).map((r) => ({
          ...(r as object),
          userId,
          eventDate: toDate(r.eventDate) ?? new Date(),
          createdAt: toDate(r.createdAt) ?? new Date(),
        }));
        return db.insert(timelineEvents).values(rows as (typeof timelineEvents.$inferInsert)[]);
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}