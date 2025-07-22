import { auth } from "../../../../../auth";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/auth/roles";
import { handleApiError } from "@/lib/api-error-handler-new";
import { createApiResponse } from "@/lib/api-response";

// GET /api/purchase-orders/[id] - Get a specific purchase order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return handleApiError(new Error("Unauthorized"), 401);
    }

    // Check permissions
    if (!hasPermission(session.user.role, "INVENTORY_READ")) {
      return handleApiError(new Error("Insufficient permissions"), 403);
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return handleApiError(new Error("Invalid purchase order ID"), 400);
    }

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
      return handleApiError(new Error("Purchase order not found"), 404);
    }

    // Transform the data to match the component interface
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

    return createApiResponse.success(transformedPurchaseOrder);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/purchase-orders/[id] - Update a purchase order
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return handleApiError(new Error("Unauthorized"), 401);
    }

    // Check permissions
    if (!hasPermission(session.user.role, "INVENTORY_WRITE")) {
      return handleApiError(new Error("Insufficient permissions"), 403);
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return handleApiError(new Error("Invalid purchase order ID"), 400);
    }

    const body = await request.json();

    // Check if purchase order exists
    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existingOrder) {
      return handleApiError(new Error("Purchase order not found"), 404);
    }

    // Update the purchase order
    const updatedOrder = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: body.status,
        notes: body.notes,
        expected_delivery_date: body.expectedDeliveryDate
          ? new Date(body.expectedDeliveryDate)
          : undefined,
        actual_delivery_date: body.actualDeliveryDate
          ? new Date(body.actualDeliveryDate)
          : undefined,
        updated_at: new Date(),
      },
      include: {
        suppliers: {
          select: {
            id: true,
            name: true,
            contactPerson: true,
            email: true,
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

    // Transform the response
    const transformedOrder = {
      id: updatedOrder.id,
      orderNumber: updatedOrder.order_number,
      supplierId: updatedOrder.supplier_id,
      userId: updatedOrder.user_id,
      orderDate: updatedOrder.order_date.toISOString(),
      expectedDeliveryDate: updatedOrder.expected_delivery_date?.toISOString(),
      actualDeliveryDate: updatedOrder.actual_delivery_date?.toISOString(),
      subtotal: updatedOrder.subtotal.toString(),
      taxAmount: updatedOrder.tax_amount.toString(),
      shippingCost: updatedOrder.shipping_cost?.toString(),
      totalAmount: updatedOrder.total_amount.toString(),
      status: updatedOrder.status,
      notes: updatedOrder.notes,
      createdAt: updatedOrder.created_at?.toISOString() || "",
      updatedAt: updatedOrder.updated_at?.toISOString() || "",
      suppliers: updatedOrder.suppliers,
      users: updatedOrder.users,
    };

    return createApiResponse.success(transformedOrder);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/purchase-orders/[id] - Delete a purchase order
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return handleApiError(new Error("Unauthorized"), 401);
    }

    // Check permissions - only admins can delete
    if (session.user.role !== "ADMIN") {
      return handleApiError(new Error("Insufficient permissions"), 403);
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return handleApiError(new Error("Invalid purchase order ID"), 400);
    }

    // Check if purchase order exists
    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existingOrder) {
      return handleApiError(new Error("Purchase order not found"), 404);
    }

    // Prevent deletion of orders that are already processed
    if (["ordered", "shipped", "delivered"].includes(existingOrder.status)) {
      return handleApiError(
        new Error("Cannot delete purchase orders that are already processed"),
        400
      );
    }

    // Delete the purchase order (cascade will handle items)
    await prisma.purchaseOrder.delete({
      where: { id },
    });

    return createApiResponse.success({
      message: "Purchase order deleted successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
