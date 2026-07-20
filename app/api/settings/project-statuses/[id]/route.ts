import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projectStatuses, orders } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUserId, errorResponse } from "@/lib/auth/session-helpers";
import { referenceItemSchema } from "@/lib/validation/schemas";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const body = await req.json();
    const parsed = referenceItemSchema.partial().parse(body);
    const updateData: Record<string, unknown> = {};
    if (parsed.name) updateData.name = parsed.name;
    if (parsed.color) updateData.color = parsed.color;
    if (parsed.category) updateData.category = parsed.category;
    const [row] = await db
      .update(projectStatuses)
      .set(updateData)
      .where(and(eq(projectStatuses.userId, userId), eq(projectStatuses.id, id)))
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
    const inUse = await db.select().from(orders).where(and(eq(orders.userId, userId), eq(orders.statusId, id))).limit(1);
    if (inUse.length > 0) {
      return NextResponse.json(
        { error: "Нельзя удалить статус, который используется в заказах. Сначала перенесите заказы на другой статус." },
        { status: 400 },
      );
    }
    const [row] = await db
      .delete(projectStatuses)
      .where(and(eq(projectStatuses.userId, userId), eq(projectStatuses.id, id)))
      .returning();
    if (!row) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
