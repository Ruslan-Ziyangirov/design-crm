"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatMoneyCompact, formatMoney } from "@/lib/format";

interface Point {
  label: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export function RevenueChart({ data }: { data: Point[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Выручка, расходы и прибыль по месяцам</CardTitle>
      </CardHeader>
      <CardContent className="h-[280px] pl-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expensesFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e11d48" stopOpacity={0.24} />
                <stop offset="100%" stopColor="#e11d48" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1c8a5a" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#1c8a5a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--color-ink-muted)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--color-ink-muted)" }}
              tickFormatter={(v) => formatMoneyCompact(v)}
              axisLine={false}
              tickLine={false}
              width={64}
            />
            <Tooltip
              formatter={(value, name) => [formatMoney(Number(value)), String(name)]}
              contentStyle={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 10,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Выручка"
              stroke="#2563eb"
              strokeWidth={2}
              fill="url(#revenueFill)"
              dot={{ r: 3, strokeWidth: 0, fill: "#2563eb" }}
              activeDot={{ r: 4 }}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              name="Расходы"
              stroke="#e11d48"
              strokeWidth={2}
              fill="url(#expensesFill)"
              dot={{ r: 3, strokeWidth: 0, fill: "#e11d48" }}
              activeDot={{ r: 4 }}
            />
            <Area
              type="monotone"
              dataKey="profit"
              name="Прибыль"
              stroke="#1c8a5a"
              strokeWidth={2.5}
              fill="url(#profitFill)"
              dot={{ r: 3, strokeWidth: 0, fill: "#1c8a5a" }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
