import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients, orders } from "@/lib/db/schema";
import { and, eq, like, or } from "drizzle-orm";
import { requireUserId, errorResponse } from "@/lib/auth/session-helpers";

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const q = new URL(req.url).searchParams.get("q")?.trim() || "";
    if (q.length < 2) return NextResponse.json({ clients: [], orders: [] });

    const pattern = `%${q}%`;

    const [matchedClients, matchedOrders] = await Promise.all([
      db
        .select()
        .from(clients)
        .where(and(eq(clients.userId, userId), or(like(clients.name, pattern), like(clients.contactName, pattern), like(clients.email, pattern), like(clients.phone, pattern))))
        .limit(8),
      db.query.orders.findMany({
        where: and(eq(orders.userId, userId), like(orders.title, pattern)),
        with: { client: true },
        limit: 8,
      }),
    ]);

    return NextResponse.json({ clients: matchedClients, orders: matchedOrders });
  } catch (err) {
    return errorResponse(err);
  }
}
