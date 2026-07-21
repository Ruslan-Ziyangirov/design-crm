import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profitPlans } from "@/lib/db/schema";
import { requireUserId, errorResponse } from "@/lib/auth/session-helpers";
import { profitPlanSchema } from "@/lib/validation/schemas";
import { getProfitPlansForYear } from "@/lib/db/queries";

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const year = Number(new URL(req.url).searchParams.get("year")) || new Date().getFullYear();
    const rows = await getProfitPlansForYear(userId, year);
    return NextResponse.json(rows);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const parsed = profitPlanSchema.parse(body);

    const [row] = await db
      .insert(profitPlans)
      .values({ userId, year: parsed.year, month: parsed.month, targetProfit: parsed.targetProfit })
      .onConflictDoUpdate({
        target: [profitPlans.userId, profitPlans.year, profitPlans.month],
        set: { targetProfit: parsed.targetProfit, updatedAt: new Date() },
      })
      .returning();

    return NextResponse.json(row);
  } catch (err) {
    return errorResponse(err);
  }
}
