import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { timelineEvents } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUserId, errorResponse } from "@/lib/auth/session-helpers";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const [row] = await db
      .delete(timelineEvents)
      .where(and(eq(timelineEvents.userId, userId), eq(timelineEvents.id, id)))
      .returning();
    if (!row) return NextResponse.json({ error: "Событие не найдено" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
