import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Stage {
  name: string;
  color: string;
  count: number;
}

export function FunnelCard({ stages }: { stages: Stage[] }) {
  const max = Math.max(1, ...stages.map((s) => s.count));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Воронка проектов</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {stages.length === 0 && (
          <p className="text-[13px] text-[var(--color-ink-faint)]">Настройте статусы проектов в разделе «Настройки»</p>
        )}
        {stages.map((s) => (
          <div key={s.name} className="flex items-center gap-3">
            <span className="w-[128px] shrink-0 truncate text-[12.5px] text-[var(--color-ink-muted)]">{s.name}</span>
            <div className="h-6 flex-1 overflow-hidden rounded-[6px] bg-black/[0.04]">
              <div
                className="h-full rounded-[6px] transition-all"
                style={{ width: `${(s.count / max) * 100}%`, background: s.color }}
              />
            </div>
            <span className="w-6 shrink-0 text-right font-numeric text-[13px] font-medium text-[var(--color-ink)]">
              {s.count}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
