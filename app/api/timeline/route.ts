import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { timelineEvents, clients } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUserId, errorResponse } from "@/lib/auth/session-helpers";
import { timelineEventSchema } from "@/lib/validation/schemas";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const parsed = timelineEventSchema.parse(body);

    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.userId, userId), eq(clients.id, parsed.clientId)))
      .limit(1);
    if (!client) return NextResponse.json({ error: "Клиент не найден" }, { status: 404 });

    const [row] = await db
      .insert(timelineEvents)
      .values({
        userId,
        clientId: parsed.clientId,
        orderId: parsed.orderId || null,
        type: parsed.type,
        note: parsed.note || "",
        eventDate: parsed.eventDate,
      })
      .returning();

    await db.update(clients).set({ lastContactAt: parsed.eventDate }).where(eq(clients.id, parsed.clientId));

    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
