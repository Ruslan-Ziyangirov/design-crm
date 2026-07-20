import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUserId, errorResponse } from "@/lib/auth/session-helpers";
import { orderSchema } from "@/lib/validation/schemas";
import { getOrderById } from "@/lib/db/queries";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const data = await getOrderById(userId, id);
    if (!data) return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const body = await req.json();
    const parsed = orderSchema.partial().parse(body);

    // Пишем только поля, реально присутствовавшие в теле запроса — иначе
    // Zod подставляет .default() для полей вроде paymentReceived/expenses,
    // которых не было в запросе (например, при частичном PATCH из Канбана),
    // и они затирают реальные значения в БД нулями.
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of Object.keys(body)) {
      if (!(key in parsed)) continue;
      const value = parsed[key as keyof typeof parsed];
      if (key === "tags") updateData.tags = JSON.stringify(value ?? []);
      else updateData[key] = value;
    }

    const [row] = await db
      .update(orders)
      .set(updateData)
      .where(and(eq(orders.userId, userId), eq(orders.id, id)))
      .returning();

    if (!row) return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const [row] = await db
      .delete(orders)
      .where(and(eq(orders.userId, userId), eq(orders.id, id)))
      .returning();
    if (!row) return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
