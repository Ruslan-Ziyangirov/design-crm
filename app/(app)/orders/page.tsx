import { requireUserId } from "@/lib/auth/session-helpers";
import { getOrdersFull, getReferenceData } from "@/lib/db/queries";
import { OrdersView } from "@/components/orders/orders-view";

export default async function OrdersPage() {
  const userId = await requireUserId();
  const [orders, refs] = await Promise.all([getOrdersFull(userId), getReferenceData(userId)]);

  return (
    <OrdersView
      orders={orders}
      projectStatuses={refs.projectStatuses}
      paymentStatuses={refs.paymentStatuses}
      serviceTypes={refs.serviceTypes}
      sources={refs.sources}
    />
  );
}
