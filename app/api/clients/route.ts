import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { requireUserId, errorResponse } from "@/lib/auth/session-helpers";
import { clientSchema } from "@/lib/validation/schemas";
import { getClientsFull } from "@/lib/db/queries";

export async function GET() {
  try {
    const userId = await requireUserId();
    const data = await getClientsFull(userId);
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const parsed = clientSchema.parse(body);

    const [row] = await db
      .insert(clients)
      .values({
        userId,
        name: parsed.name,
        contactName: parsed.contactName || null,
        phone: parsed.phone || null,
        email: parsed.email || null,
        telegram: parsed.telegram || null,
        website: parsed.website || null,
        city: parsed.city || null,
        sourceId: parsed.sourceId || null,
        notes: parsed.notes || "",
        tags: JSON.stringify(parsed.tags ?? []),
        status: parsed.status,
        lastContactAt: parsed.lastContactAt ?? new Date(),
      })
      .returning();

    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
