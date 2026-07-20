import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { requireUserId, errorResponse } from "@/lib/auth/session-helpers";
import { getClientsFull, getOrdersFull } from "@/lib/db/queries";
import { buildClientRows, buildOrderRows } from "@/lib/export";

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const entity = searchParams.get("entity") === "clients" ? "clients" : "orders";
    const format = searchParams.get("format") || "csv";
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let rows: Record<string, unknown>[];
    let filenameBase: string;

    if (entity === "clients") {
      let clients = await getClientsFull(userId);
      if (from) clients = clients.filter((c) => new Date(c.createdAt) >= new Date(from));
      if (to) clients = clients.filter((c) => new Date(c.createdAt) <= new Date(to));
      rows = buildClientRows(clients);
      filenameBase = "clients";
    } else {
      let orders = await getOrdersFull(userId);
      if (from) orders = orders.filter((o) => new Date(o.createdAt) >= new Date(from));
      if (to) orders = orders.filter((o) => new Date(o.createdAt) <= new Date(to));
      rows = buildOrderRows(orders);
      filenameBase = "orders";
    }

    const filename = `${filenameBase}_${new Date().toISOString().slice(0, 10)}.${format}`;

    if (format === "json") {
      return new NextResponse(JSON.stringify(rows, null, 2), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    if (format === "xlsx") {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, entity === "clients" ? "Клиенты" : "Заказы");
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      return new NextResponse(buf, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // CSV по умолчанию — с BOM для корректного открытия в Excel с кириллицей
    const csv = "\uFEFF" + Papa.unparse(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
