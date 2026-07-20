import { requireUserId } from "@/lib/auth/session-helpers";
import { getOrdersFull } from "@/lib/db/queries";
import { CalendarPageView } from "@/components/calendar/calendar-page-view";

export default async function CalendarPage() {
  const userId = await requireUserId();
  const orders = await getOrdersFull(userId);
  return <CalendarPageView orders={orders} />;
}
