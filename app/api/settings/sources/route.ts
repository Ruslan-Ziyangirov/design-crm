import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sources } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import { requireUserId, errorResponse } from "@/lib/auth/session-helpers";
import { referenceItemSchema } from "@/lib/validation/schemas";

export async function GET() {
  try {
    const userId = await requireUserId();
    const rows = await db.select().from(sources).where(eq(sources.userId, userId)).orderBy(asc(sources.sortOrder));
    return NextResponse.json(rows);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const parsed = referenceItemSchema.parse(body);
    const existing = await db.select().from(sources).where(eq(sources.userId, userId));
    const [row] = await db
      .insert(sources)
      .values({ userId, name: parsed.name, sortOrder: existing.length })
      .returning();
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
