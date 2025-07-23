import { auth } from "../../../../../../auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PurchaseOrderDetail } from "@/components/inventory/PurchaseOrderDetail";

export const metadata = {
  title: "Purchase Order Details - BaaWA Inventory POS",
  description: "View detailed information about a specific purchase order",
};

interface PurchaseOrderPageProps {
  params: { id: string };
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

  const id = parseInt(params.id);
  if (isNaN(id)) {
    notFound();
  }

  // Fetch purchase order with related data
  const purchaseOrder = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      suppliers: {
        select: {
          id: true,
          name: true,
          contactPerson: true,
          email: true,
          phone: true,
          address: true,
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
      purchaseOrderItems: {
        include: {
          products: {
            select: {
              id: true,
              name: true,
              sku: true,
              barcode: true,
            },
          },
          productVariants: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
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
    orderNumber: purchaseOrder.orderNumber,
    supplierId: purchaseOrder.supplierId,
    userId: purchaseOrder.userId,
    orderDate: purchaseOrder.orderDate.toISOString(),
    expectedDeliveryDate: purchaseOrder.expectedDeliveryDate?.toISOString(),
    actualDeliveryDate: purchaseOrder.actualDeliveryDate?.toISOString(),
    subtotal: purchaseOrder.subtotal.toString(),
    taxAmount: purchaseOrder.taxAmount.toString(),
    shippingCost: purchaseOrder.shippingCost?.toString(),
    totalAmount: purchaseOrder.totalAmount.toString(),
    status: purchaseOrder.status,
    notes: purchaseOrder.notes || undefined,
    createdAt: purchaseOrder.createdAt?.toISOString() || "",
    updatedAt: purchaseOrder.updatedAt?.toISOString() || "",
    suppliers: purchaseOrder.suppliers,
    users: purchaseOrder.users,
    purchaseOrderItems: purchaseOrder.purchaseOrderItems.map((item) => ({
      id: item.id,
      purchaseOrderId: item.purchaseOrderId,
      productId: item.productId,
      variantId: item.variantId,
      quantityOrdered: item.quantityOrdered,
      quantityReceived: item.quantityReceived,
      unitCost: item.unitCost.toString(),
      totalCost: item.totalCost.toString(),
      products: item.products,
      productVariants: item.productVariants,
    })),
  };

  return (
    <PurchaseOrderDetail
      purchaseOrder={transformedPurchaseOrder}
      user={session.user}
    />
  );
}
