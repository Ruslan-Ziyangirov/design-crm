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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/orders", label: "Заказы", icon: ListChecks },
  { href: "/clients", label: "Клиенты", icon: Users },
  { href: "/calendar", label: "Календарь", icon: CalendarDays },
  { href: "/analytics", label: "Аналитика", icon: BarChart3 },
  { href: "/settings", label: "Настройки", icon: Settings },
];

export function Sidebar({ ownerName }: { ownerName: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[228px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-4 lg:flex">
      <div className="mb-6 px-3.5">
        <Logo className="h-5 w-auto text-[var(--color-ink)]" />
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-full px-3.5 py-2 text-[13.5px] font-medium transition-colors",
                active
                  ? "bg-[var(--color-ink)] text-white shadow-[var(--shadow-soft)]"
                  : "text-[var(--color-ink-muted)] hover:bg-black/[0.035] hover:text-[var(--color-ink)]",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/settings"
        className="mt-auto flex items-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2.5 py-2 transition-[border-color,box-shadow] hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-soft)]"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[13px] font-semibold text-[var(--color-accent-ink)]">
          {ownerName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-[var(--color-ink)]">{ownerName}</p>
          <p className="truncate text-[11px] text-[var(--color-ink-muted)]">Владелец · Настройки</p>
        </div>
      </Link>
    </aside>
  );
}
