"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListChecks, Users, CalendarDays, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/orders", label: "Заказы", icon: ListChecks },
  { href: "/clients", label: "Клиенты", icon: Users },
  { href: "/calendar", label: "Календарь", icon: CalendarDays },
  { href: "/analytics", label: "Аналитика", icon: BarChart3 },
  { href: "/settings", label: "Настройки", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-between border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur px-1 py-1 lg:hidden">
      {ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 rounded-[10px] py-1.5 text-[10px] font-medium",
              active ? "text-[var(--color-accent)]" : "text-[var(--color-ink-muted)]",
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
