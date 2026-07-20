import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients, orders, timelineEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireUserId, errorResponse } from "@/lib/auth/session-helpers";

/**
 * Удаляет все клиенты, заказы и события таймлайна пользователя.
 * Справочники (источники, услуги, статусы) и настройки CRM сохраняются,
 * чтобы приложением можно было сразу пользоваться дальше.
 */
export async function DELETE() {
  try {
    const userId = await requireUserId();
    await db.delete(timelineEvents).where(eq(timelineEvents.userId, userId));
    await db.delete(orders).where(eq(orders.userId, userId));
    await db.delete(clients).where(eq(clients.userId, userId));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
