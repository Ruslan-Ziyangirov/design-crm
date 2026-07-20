"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const COLORS = ["#0f6e5c", "#2563eb", "#c8850f", "#d33a2c", "#7c5cbf", "#94a3b8", "#ea580c", "#1c8a5a", "#64748b", "#2fa88d", "#6b7280"];

interface Props {
  title: string;
  data: Record<string, { count: number; revenue: number }>;
  valueKey?: "count" | "revenue";
  emptyLabel?: string;
}

export function DistributionPieChart({ title, data, valueKey = "count", emptyLabel = "Пока нет данных" }: Props) {
  const entries = Object.entries(data)
    .map(([name, v]) => ({ name, value: v[valueKey] }))
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[260px]">
        {entries.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[13px] text-[var(--color-ink-faint)]">
            {emptyLabel}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={entries} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={2}>
                {entries.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="var(--color-surface)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 10,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11.5 }} layout="vertical" align="right" verticalAlign="middle" />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
