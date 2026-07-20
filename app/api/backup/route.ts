import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  clients,
  orders,
  sources,
  serviceTypes,
  projectStatuses,
  paymentStatuses,
  timelineEvents,
  users,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireUserId, errorResponse } from "@/lib/auth/session-helpers";

export async function GET() {
  try {
    const userId = await requireUserId();

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const [srcs, services, pStatuses, payStatuses, clientRows, orderRows, timeline] = await Promise.all([
      db.select().from(sources).where(eq(sources.userId, userId)),
      db.select().from(serviceTypes).where(eq(serviceTypes.userId, userId)),
      db.select().from(projectStatuses).where(eq(projectStatuses.userId, userId)),
      db.select().from(paymentStatuses).where(eq(paymentStatuses.userId, userId)),
      db.select().from(clients).where(eq(clients.userId, userId)),
      db.select().from(orders).where(eq(orders.userId, userId)),
      db.select().from(timelineEvents).where(eq(timelineEvents.userId, userId)),
    ]);

    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      profile: user
        ? { crmName: user.crmName, currency: user.currency, timezone: user.timezone, dateFormat: user.dateFormat }
        : null,
      sources: srcs,
      serviceTypes: services,
      projectStatuses: pStatuses,
      paymentStatuses: payStatuses,
      clients: clientRows,
      orders: orderRows,
      timelineEvents: timeline,
    };

    const filename = `crm-backup_${new Date().toISOString().slice(0, 10)}.json`;
    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
