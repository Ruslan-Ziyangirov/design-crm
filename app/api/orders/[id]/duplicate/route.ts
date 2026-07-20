import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { requireUserId, errorResponse } from "@/lib/auth/session-helpers";
import { getOrderById } from "@/lib/db/queries";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const original = await getOrderById(userId, id);
    if (!original) return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });

    const [row] = await db
      .insert(orders)
      .values({
        userId,
        clientId: original.clientId,
        title: `${original.title} (копия)`,
        serviceTypeId: original.serviceTypeId,
        description: original.description,
        price: original.price,
        prepaymentReceived: 0,
        paymentReceived: 0,
        expenses: 0,
        statusId: original.statusId,
        paymentStatusId: original.paymentStatusId,
        sourceId: original.sourceId,
        firstContactDate: new Date(),
        startDate: null,
        deadline: null,
        completedDate: null,
        projectUrl: original.projectUrl,
        materialsUrl: original.materialsUrl,
        notes: original.notes,
        tags: original.tags,
        reviewReceived: false,
        reviewText: "",
        reviewUrl: "",
      })
      .returning();

    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
