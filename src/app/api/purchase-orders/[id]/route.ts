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
    if (!hasPermission(session.user.role, "PURCHASE_ORDER_READ")) {
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
      return handleApiError(new Error("Purchase order not found"), 404);
    }

    // Transform the data to match the component interface
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
      status: purchaseOrder.status.toUpperCase(),
      notes: purchaseOrder.notes,
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
    if (!hasPermission(session.user.role, "PURCHASE_ORDER_WRITE")) {
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

    // Prepare update data - only include fields that are provided
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.supplierId !== undefined) updateData.supplierId = body.supplierId;
    if (body.orderNumber !== undefined)
      updateData.orderNumber = body.orderNumber;
    if (body.orderDate !== undefined)
      updateData.orderDate = new Date(body.orderDate);
    if (body.expectedDeliveryDate !== undefined) {
      updateData.expectedDeliveryDate = body.expectedDeliveryDate
        ? new Date(body.expectedDeliveryDate)
        : null;
    }
    if (body.actualDeliveryDate !== undefined) {
      updateData.actualDeliveryDate = body.actualDeliveryDate
        ? new Date(body.actualDeliveryDate)
        : null;
    }
    if (body.subtotal !== undefined) updateData.subtotal = body.subtotal;
    if (body.taxAmount !== undefined) updateData.taxAmount = body.taxAmount;
    if (body.shippingCost !== undefined)
      updateData.shippingCost = body.shippingCost;
    if (body.totalAmount !== undefined)
      updateData.totalAmount = body.totalAmount;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;

    // Update the purchase order
    const updatedOrder = await prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
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

    // Transform the response
    const transformedOrder = {
      id: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      supplierId: updatedOrder.supplierId,
      userId: updatedOrder.userId,
      orderDate: updatedOrder.orderDate.toISOString(),
      expectedDeliveryDate: updatedOrder.expectedDeliveryDate?.toISOString(),
      actualDeliveryDate: updatedOrder.actualDeliveryDate?.toISOString(),
      subtotal: updatedOrder.subtotal.toString(),
      taxAmount: updatedOrder.taxAmount.toString(),
      shippingCost: updatedOrder.shippingCost?.toString(),
      totalAmount: updatedOrder.totalAmount.toString(),
      status: updatedOrder.status,
      notes: updatedOrder.notes,
      createdAt: updatedOrder.createdAt?.toISOString() || "",
      updatedAt: updatedOrder.updatedAt?.toISOString() || "",
      suppliers: updatedOrder.suppliers,
      users: updatedOrder.users,
      purchaseOrderItems: updatedOrder.purchaseOrderItems.map((item) => ({
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
