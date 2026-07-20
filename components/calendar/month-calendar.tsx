"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CalendarEvent {
  id: string;
  date: Date;
  label: string;
  color: string;
  kind: string;
  onClick?: () => void;
}

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function MonthCalendar({ events }: { events: CalendarEvent[] }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const today = new Date();

  const days = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7; // понедельник = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const key = `${e.date.getFullYear()}-${e.date.getMonth()}-${e.date.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [events]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="font-display text-[15px] font-semibold text-[var(--color-ink)]">
          {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
        </p>
        <div className="flex items-center gap-1.5">
          <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}>
            Сегодня
          </Button>
          <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-[14px] border border-[var(--color-border)] bg-[var(--color-border)]">
        {WEEKDAYS.map((w) => (
          <div key={w} className="bg-[var(--color-surface)] px-2 py-1.5 text-center text-[11px] font-medium text-[var(--color-ink-muted)]">
            {w}
          </div>
        ))}
        {days.map((day, i) => {
          const key = day ? `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}` : `empty-${i}`;
          const dayEvents = day ? eventsByDay.get(key) ?? [] : [];
          const isToday = day && isSameDay(day, today);
          return (
            <div key={key} className={cn("min-h-[92px] bg-[var(--color-surface)] p-1.5", !day && "bg-black/[0.015]")}>
              {day && (
                <>
                  <span
                    className={cn(
                      "inline-flex h-5 w-5 items-center justify-center rounded-full text-[11.5px]",
                      isToday ? "bg-[var(--color-accent)] font-semibold text-white" : "text-[var(--color-ink-muted)]",
                    )}
                  >
                    {day.getDate()}
                  </span>
                  <div className="mt-1 flex flex-col gap-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <button
                        key={e.id}
                        onClick={e.onClick}
                        title={e.label}
                        className="truncate rounded-[5px] px-1 py-0.5 text-left text-[10.5px] font-medium leading-tight hover:opacity-80"
                        style={{ background: `${e.color}1a`, color: e.color }}
                      >
                        {e.label}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="px-1 text-[10px] text-[var(--color-ink-faint)]">+{dayEvents.length - 3} ещё</span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
