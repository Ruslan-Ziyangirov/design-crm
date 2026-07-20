import { requireUserId } from "@/lib/auth/session-helpers";
import { getClientsFull } from "@/lib/db/queries";
import { ClientsView } from "@/components/clients/clients-view";

export default async function ClientsPage() {
  const userId = await requireUserId();
  const clients = await getClientsFull(userId);
  return <ClientsView clients={clients} />;
}
