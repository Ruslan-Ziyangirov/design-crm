import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth/session-helpers";
import { getReferenceData, getProfitPlansForYear } from "@/lib/db/queries";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { SettingsView } from "@/components/settings/settings-view";

export default async function SettingsPage() {
  const userId = await requireUserId();
  const profitPlanYear = new Date().getFullYear();
  const [refs, [user], profitPlans] = await Promise.all([
    getReferenceData(userId),
    db.select().from(users).where(eq(users.id, userId)),
    getProfitPlansForYear(userId, profitPlanYear),
  ]);

  // Сессия (JWT) может пережить самого пользователя в БД — например, после
  // восстановления из бэкапа или пересоздания записи владельца. В этом
  // случае явно отправляем на повторный вход вместо падения с ошибкой.
  if (!user) redirect("/login");

  const { passwordHash: _unused, ...safeUser } = user;

  return (
    <SettingsView
      user={safeUser}
      sources={refs.sources}
      serviceTypes={refs.serviceTypes}
      projectStatuses={refs.projectStatuses}
      paymentStatuses={refs.paymentStatuses}
      profitPlans={profitPlans}
      profitPlanYear={profitPlanYear}
    />
  );
}
