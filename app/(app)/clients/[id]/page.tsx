import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/auth/session-helpers";
import { getClientDetail } from "@/lib/db/queries";
import { ClientDetailView } from "@/components/clients/client-detail-view";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  const client = await getClientDetail(userId, id);
  if (!client) notFound();

  return <ClientDetailView client={client} />;
}
