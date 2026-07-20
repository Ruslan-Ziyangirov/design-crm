"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// Валидированная категориальная палитра (см. навык dataviz: фиксированный порядок,
// CVD-разделение и контраст против подложки #F8FBFF проверены скриптом validate_palette.js).
const COLORS = ["#2a78d6", "#008300", "#e87ba4", "#eda100", "#1baf7a", "#eb6834", "#4a3aa7", "#e34948", "#64748b", "#92400e", "#475569"];

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
