import { auth } from "../../../../../../../auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PurchaseOrderEdit } from "@/components/inventory/PurchaseOrderEdit";

export const metadata = {
  title: "Edit Purchase Order - BaaWA Inventory POS",
  description: "Edit purchase order details and status",
};

interface PurchaseOrderEditPageProps {
  params: { id: string };
}

export default async function PurchaseOrderEditPage({
  params,
}: PurchaseOrderEditPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.status !== "APPROVED") {
    redirect("/pending-approval");
  }

  // Check permissions
  if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
    redirect("/unauthorized");
  }

  const id = parseInt(params.id);
  if (isNaN(id)) {
    notFound();
  }

  // Fetch purchase order
  const purchaseOrder = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      suppliers: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!purchaseOrder) {
    notFound();
  }

  // Transform data for component
  const transformedPurchaseOrder = {
    id: purchaseOrder.id,
    orderNumber: purchaseOrder.order_number,
    supplierId: purchaseOrder.supplier_id,
    userId: purchaseOrder.user_id,
    orderDate: purchaseOrder.order_date.toISOString(),
    expectedDeliveryDate: purchaseOrder.expected_delivery_date?.toISOString(),
    actualDeliveryDate: purchaseOrder.actual_delivery_date?.toISOString(),
    subtotal: purchaseOrder.subtotal.toString(),
    taxAmount: purchaseOrder.tax_amount.toString(),
    shippingCost: purchaseOrder.shipping_cost?.toString(),
    totalAmount: purchaseOrder.total_amount.toString(),
    status: purchaseOrder.status,
    notes: purchaseOrder.notes,
    createdAt: purchaseOrder.created_at?.toISOString() || "",
    updatedAt: purchaseOrder.updated_at?.toISOString() || "",
    suppliers: purchaseOrder.suppliers,
    users: purchaseOrder.users,
  };

  return (
    <PurchaseOrderEdit
      purchaseOrder={transformedPurchaseOrder}
      user={session.user}
    />
  );
}
