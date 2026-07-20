import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sources, clients, orders } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUserId, errorResponse } from "@/lib/auth/session-helpers";
import { referenceItemSchema } from "@/lib/validation/schemas";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const body = await req.json();
    const parsed = referenceItemSchema.partial().parse(body);
    const [row] = await db
      .update(sources)
      .set({ ...(parsed.name ? { name: parsed.name } : {}) })
      .where(and(eq(sources.userId, userId), eq(sources.id, id)))
      .returning();
    if (!row) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    // Отвязываем источник от клиентов/заказов вместо запрета удаления
    await db.update(clients).set({ sourceId: null }).where(and(eq(clients.userId, userId), eq(clients.sourceId, id)));
    await db.update(orders).set({ sourceId: null }).where(and(eq(orders.userId, userId), eq(orders.sourceId, id)));
    const [row] = await db
      .delete(sources)
      .where(and(eq(sources.userId, userId), eq(sources.id, id)))
      .returning();
    if (!row) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
