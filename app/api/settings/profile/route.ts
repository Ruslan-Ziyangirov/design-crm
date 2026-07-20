import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireUserId, errorResponse } from "@/lib/auth/session-helpers";
import { z } from "zod";

const profileSchema = z.object({
  crmName: z.string().trim().min(1).max(120).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  currency: z.string().max(10).optional(),
  timezone: z.string().max(80).optional(),
  dateFormat: z.string().max(20).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
});

export async function GET() {
  try {
    const userId = await requireUserId();
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    const { passwordHash: _unused, ...safe } = user;
    return NextResponse.json(safe);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const parsed = profileSchema.parse(body);
    const [row] = await db
      .update(users)
      .set({ ...parsed, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    const { passwordHash: _unused, ...safe } = row;
    return NextResponse.json(safe);
  } catch (err) {
    return errorResponse(err);
  }
}
