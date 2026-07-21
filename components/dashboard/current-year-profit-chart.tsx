"use client";

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatMoney, formatMoneyCompact } from "@/lib/format";

export function CurrentYearProfitChart({ data }: { data: { label: string; profit: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Прибыль по месяцам текущего года</CardTitle>
      </CardHeader>
      <CardContent className="h-[260px] pl-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
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
              formatter={(value) => [formatMoney(Number(value)), "Прибыль"]}
              contentStyle={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 10,
                fontSize: 12,
              }}
            />
            <Bar dataKey="profit" name="Прибыль" radius={[6, 6, 0, 0]} maxBarSize={36}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.profit >= 0 ? "#1c8a5a" : "#e11d48"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
