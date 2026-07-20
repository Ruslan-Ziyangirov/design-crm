import { NextRequest, NextResponse } from "next/server";
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
});

const bodySchema = z.object({ rows: z.array(rowSchema).min(1) });

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { rows } = bodySchema.parse(body);

    const results = [];
    for (const row of rows) {
      const client = await importHelpers.findClientByName(userId, row.clientName);
      let duplicate = null;
      if (client) {
        const existingOrder = await importHelpers.findMatchingOrder(userId, client.id, row.title);
        if (existingOrder) {
          duplicate = {
            orderId: existingOrder.id,
            existingRevenue: existingOrder.paymentReceived,
            existingExpenses: existingOrder.expenses,
          };
        }
      }
      results.push({
        ...row,
        clientExists: !!client,
        duplicate,
      });
    }

    return NextResponse.json({ rows: results });
  } catch (err) {
    return errorResponse(err);
  }
}
