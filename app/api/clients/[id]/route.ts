import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUserId, errorResponse } from "@/lib/auth/session-helpers";
import { clientSchema } from "@/lib/validation/schemas";
import { getClientDetail } from "@/lib/db/queries";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const data = await getClientDetail(userId, id);
    if (!data) return NextResponse.json({ error: "Клиент не найден" }, { status: 404 });
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
    const parsed = clientSchema.partial().parse(body);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    for (const [key, value] of Object.entries(parsed)) {
      if (key === "tags") updateData.tags = JSON.stringify(value ?? []);
      else if (value !== undefined) updateData[key] = value === "" && key !== "notes" ? null : value;
    }

    const [row] = await db
      .update(clients)
      .set(updateData)
      .where(and(eq(clients.userId, userId), eq(clients.id, id)))
      .returning();

    if (!row) return NextResponse.json({ error: "Клиент не найден" }, { status: 404 });
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
      .delete(clients)
      .where(and(eq(clients.userId, userId), eq(clients.id, id)))
      .returning();
    if (!row) return NextResponse.json({ error: "Клиент не найден" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
