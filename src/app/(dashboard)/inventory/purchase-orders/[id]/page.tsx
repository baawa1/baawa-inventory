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
      purchase_order_items: {
        include: {
          products: {
            select: {
              id: true,
              name: true,
              sku: true,
              barcode: true,
            },
          },
          product_variants: {
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
    purchaseOrderItems: purchaseOrder.purchase_order_items.map((item) => ({
      id: item.id,
      purchaseOrderId: item.purchase_order_id,
      productId: item.product_id,
      variantId: item.variant_id,
      quantityOrdered: item.quantity_ordered,
      quantityReceived: item.quantity_received,
      unitCost: item.unit_cost.toString(),
      totalCost: item.total_cost.toString(),
      products: item.products,
      productVariants: item.product_variants,
    })),
  };

  return (
    <PurchaseOrderDetail
      purchaseOrder={transformedPurchaseOrder}
      user={session.user}
    />
  );
}
