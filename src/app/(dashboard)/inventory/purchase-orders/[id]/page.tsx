import { auth } from "../../../../../../auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { PurchaseOrderDetail } from "@/components/inventory/PurchaseOrderDetail";

export const metadata = {
  title: "Purchase Order Details - BaaWA Inventory POS",
  description: "View detailed information about a specific purchase order",
};

interface PurchaseOrderPageProps {
  params: Promise<{ id: string }>;
}

export default async function PurchaseOrderPage({
  params,
}: PurchaseOrderPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.status !== "APPROVED") {
    redirect("/pending-approval");
  }

  const { id } = await params;
  const purchaseOrderId = parseInt(id);
  if (isNaN(purchaseOrderId)) {
    notFound();
  }

  // Fetch purchase order data from API
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/purchase-orders/${purchaseOrderId}`,
    {
      headers: {
        Cookie: `authjs.session-token=${session.user.id}`,
      },
    }
  );

  if (!response.ok) {
    notFound();
  }

  const result = await response.json();
  const purchaseOrder = result.data;

  return (
    <PurchaseOrderDetail purchaseOrder={purchaseOrder} user={session.user} />
  );
}
