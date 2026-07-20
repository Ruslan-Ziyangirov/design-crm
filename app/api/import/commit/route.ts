import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireUserId, errorResponse } from "@/lib/auth/session-helpers";
import { importHelpers } from "@/lib/import";
import { z } from "zod";

const rowSchema = z.object({
  title: z.string().min(1),
  clientName: z.string().min(1),
  revenue: z.coerce.number().default(0),
  expenses: z.coerce.number().default(0),
  reviewText: z.string().optional().default(""),
  statusName: z.string().optional().default(""),
  sourceName: z.string().optional().default(""),
  contactDate: z.string().optional().default(""),
  completedDate: z.string().optional().default(""),
  action: z.enum(["create", "update", "skip"]).default("create"),
  matchedOrderId: z.string().optional().nullable(),
});

const bodySchema = z.object({ rows: z.array(rowSchema).min(1) });

function parseFlexibleDate(value: string): Date | null {
  if (!value?.trim()) return null;
  const v = value.trim();
  // Поддержка формата ДД.ММ.ГГГГ
  const ru = v.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (ru) return new Date(Number(ru[3]), Number(ru[2]) - 1, Number(ru[1]));
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { rows } = bodySchema.parse(body);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of rows) {
      if (row.action === "skip") {
        skipped += 1;
        continue;
      }

      const sourceId = await importHelpers.findOrCreateSource(userId, row.sourceName);
      const status = await importHelpers.resolveProjectStatus(userId, row.statusName);
      const defaultPayStatus = await importHelpers.resolveDefaultPaymentStatus(userId);

      let client = await importHelpers.findClientByName(userId, row.clientName);
      if (!client) client = await importHelpers.createClient(userId, row.clientName, sourceId);

      const contactDate = parseFlexibleDate(row.contactDate) ?? new Date();
      const completedDate = parseFlexibleDate(row.completedDate);

      if (row.action === "update" && row.matchedOrderId) {
        await db
          .update(orders)
          .set({
            paymentReceived: row.revenue,
            expenses: row.expenses,
            reviewReceived: !!row.reviewText,
            reviewText: row.reviewText || "",
            statusId: status.id,
            sourceId,
            completedDate,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, row.matchedOrderId));
        updated += 1;
      } else {
        await db.insert(orders).values({
          userId,
          clientId: client.id,
          title: row.title,
          price: row.revenue,
          paymentReceived: row.revenue,
          expenses: row.expenses,
          statusId: status.id,
          paymentStatusId: defaultPayStatus.id,
          sourceId,
          firstContactDate: contactDate,
          completedDate,
          reviewReceived: !!row.reviewText,
          reviewText: row.reviewText || "",
        });
        created += 1;
      }
    }

    return NextResponse.json({ created, updated, skipped });
  } catch (err) {
    return errorResponse(err);
  }
}
