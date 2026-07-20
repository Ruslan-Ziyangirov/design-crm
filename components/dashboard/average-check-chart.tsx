"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatMoney, formatMoneyCompact } from "@/lib/format";

export function AverageCheckChart({ data }: { data: { label: string; averageCheck: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Средний чек по месяцам</CardTitle>
      </CardHeader>
      <CardContent className="h-[240px] pl-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="avgCheckGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f6e5c" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#0f6e5c" stopOpacity={0} />
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
              formatter={(value) => [formatMoney(Number(value)), "Средний чек"]}
              contentStyle={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 10,
                fontSize: 12,
              }}
            />
            <Area type="monotone" dataKey="averageCheck" stroke="#0f6e5c" strokeWidth={2} fill="url(#avgCheckGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
