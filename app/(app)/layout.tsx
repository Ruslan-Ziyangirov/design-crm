import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Sidebar } from "@/components/shared/sidebar";
import { MobileNav } from "@/components/shared/mobile-nav";
import { Topbar } from "@/components/shared/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const [user] = session?.user?.id
    ? await db.select().from(users).where(eq(users.id, session.user.id)).limit(1)
    : [];

  return (
    <div className="flex min-h-screen bg-[var(--color-canvas)]">
      <Sidebar crmName={user?.crmName ?? "Моя CRM"} ownerName={user?.name ?? "Владелец"} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-x-hidden px-4 pb-20 pt-5 lg:px-7 lg:pb-7 lg:pt-6">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
