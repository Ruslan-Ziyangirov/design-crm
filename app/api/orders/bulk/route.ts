import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { requireUserId, errorResponse } from "@/lib/auth/session-helpers";
import { z } from "zod";

const bulkUpdateSchema = z.object({
  ids: z.array(z.string()).min(1),
  statusId: z.string().optional(),
  archived: z.boolean().optional(),
});

const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1),
});

export async function PATCH(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { ids, statusId, archived } = bulkUpdateSchema.parse(body);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (statusId) updateData.statusId = statusId;
    if (archived !== undefined) updateData.archived = archived;

    const rows = await db
      .update(orders)
      .set(updateData)
      .where(and(eq(orders.userId, userId), inArray(orders.id, ids)))
      .returning();

    return NextResponse.json({ updated: rows.length });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { ids } = bulkDeleteSchema.parse(body);

    const rows = await db
      .delete(orders)
      .where(and(eq(orders.userId, userId), inArray(orders.id, ids)))
      .returning();

    return NextResponse.json({ deleted: rows.length });
  } catch (err) {
    return errorResponse(err);
  }
}
