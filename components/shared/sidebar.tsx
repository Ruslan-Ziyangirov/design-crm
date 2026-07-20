"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListChecks,
  Users,
  CalendarDays,
  BarChart3,
  Settings,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/orders", label: "Заказы", icon: ListChecks },
  { href: "/clients", label: "Клиенты", icon: Users },
  { href: "/calendar", label: "Календарь", icon: CalendarDays },
  { href: "/analytics", label: "Аналитика", icon: BarChart3 },
  { href: "/settings", label: "Настройки", icon: Settings },
];

export function Sidebar({ crmName, ownerName }: { crmName: string; ownerName: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[228px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-4 lg:flex">
      <div className="mb-6 flex items-center gap-2.5 px-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[var(--color-accent)] text-white">
          <Palette className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-[14px] font-semibold leading-tight text-[var(--color-ink)]">
            {crmName}
          </p>
          <p className="truncate text-[11px] text-[var(--color-ink-muted)]">Личная CRM</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-[13.5px] font-medium transition-colors",
                active
                  ? "bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]"
                  : "text-[var(--color-ink-muted)] hover:bg-black/[0.035] hover:text-[var(--color-ink)]",
              )}
            >
              <Icon className="h-[17px] w-[17px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-2.5 rounded-[10px] px-2 py-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[13px] font-semibold text-[var(--color-accent-ink)]">
          {ownerName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-[var(--color-ink)]">{ownerName}</p>
          <p className="truncate text-[11px] text-[var(--color-ink-muted)]">Владелец</p>
        </div>
      </div>
    </aside>
  );
}
