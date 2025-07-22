import { auth } from "../../../../../../../auth";
import { redirect } from "next/navigation";
import EditPurchaseOrderForm from "@/components/inventory/EditPurchaseOrderForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPurchaseOrderPage({ params }: PageProps) {
  const session = await auth();

  // Only admins and managers can edit purchase orders
  if (!["ADMIN", "MANAGER"].includes(session?.user.role || "")) {
    redirect("/unauthorized");
  }

  const { id } = await params;
  const purchaseOrderId = parseInt(id);

  if (isNaN(purchaseOrderId)) {
    redirect("/inventory/purchase-orders");
  }

  return <EditPurchaseOrderForm purchaseOrderId={purchaseOrderId} />;
}
