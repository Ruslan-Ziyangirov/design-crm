import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projectStatuses } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUserId, errorResponse } from "@/lib/auth/session-helpers";
import { z } from "zod";

const schema = z.object({ orderedIds: z.array(z.string()).min(1) });

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { orderedIds } = schema.parse(body);
    await Promise.all(
      orderedIds.map((id, index) =>
        db
          .update(projectStatuses)
          .set({ sortOrder: index })
          .where(and(eq(projectStatuses.userId, userId), eq(projectStatuses.id, id))),
      ),
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
