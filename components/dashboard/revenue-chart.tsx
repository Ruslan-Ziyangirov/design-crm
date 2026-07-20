"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
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
          <LineChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
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
            <Line type="monotone" dataKey="revenue" name="Выручка" stroke="#2563eb" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="expenses" name="Расходы" stroke="#d33a2c" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="profit" name="Прибыль" stroke="#0f6e5c" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
