import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, clients } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUserId, errorResponse } from "@/lib/auth/session-helpers";
import { orderSchema } from "@/lib/validation/schemas";
import { getOrdersFull } from "@/lib/db/queries";

export async function GET() {
  try {
    const userId = await requireUserId();
    const data = await getOrdersFull(userId);
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const parsed = orderSchema.parse(body);

    // Проверяем, что клиент принадлежит текущему владельцу
    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.userId, userId), eq(clients.id, parsed.clientId)))
      .limit(1);
    if (!client) return NextResponse.json({ error: "Клиент не найден" }, { status: 404 });

    const [row] = await db
      .insert(orders)
      .values({
        userId,
        clientId: parsed.clientId,
        title: parsed.title,
        serviceTypeId: parsed.serviceTypeId || null,
        description: parsed.description || "",
        price: parsed.price,
        prepaymentReceived: parsed.prepaymentReceived,
        paymentReceived: parsed.paymentReceived,
        expenses: parsed.expenses,
        statusId: parsed.statusId,
        paymentStatusId: parsed.paymentStatusId,
        sourceId: parsed.sourceId || null,
        firstContactDate: parsed.firstContactDate ?? new Date(),
        startDate: parsed.startDate ?? null,
        deadline: parsed.deadline ?? null,
        completedDate: parsed.completedDate ?? null,
        projectUrl: parsed.projectUrl || "",
        materialsUrl: parsed.materialsUrl || "",
        notes: parsed.notes || "",
        tags: JSON.stringify(parsed.tags ?? []),
        reviewReceived: parsed.reviewReceived,
        reviewText: parsed.reviewText || "",
        reviewUrl: parsed.reviewUrl || "",
      })
      .returning();

    await db.update(clients).set({ lastContactAt: new Date() }).where(eq(clients.id, parsed.clientId));

    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
