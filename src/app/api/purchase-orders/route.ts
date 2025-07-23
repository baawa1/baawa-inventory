import { auth } from "../../../../auth";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/auth/roles";
import {
  createPurchaseOrderSchema,
  purchaseOrderQuerySchema,
  validatePurchaseOrderTotals,
  validatePurchaseOrderRules,
} from "@/lib/validations/purchase-order";
import { handleApiError } from "@/lib/api-error-handler-new";
import { createApiResponse } from "@/lib/api-response";
import { PURCHASE_ORDER_STATUS } from "@/lib/constants";
import { AuditLogger } from "@/lib/utils/audit-logger";

// GET /api/purchase-orders - List purchase orders with optional filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return handleApiError(new Error("Unauthorized"), 401);
    }

    // Check permissions
    if (!hasPermission(session.user.role, "PURCHASE_ORDER_READ")) {
      return handleApiError(new Error("Insufficient permissions"), 403);
    }

    const { searchParams } = new URL(request.url);

    // Convert search params to proper types for validation
    const queryParams = {
      page: Math.max(parseInt(searchParams.get("page") || "1"), 1),
      limit: Math.min(parseInt(searchParams.get("limit") || "10"), 100),
      search: searchParams.get("search") || undefined,
      supplierId: searchParams.get("supplierId")
        ? parseInt(searchParams.get("supplierId")!)
        : undefined,
      status: searchParams.get("status") || undefined,
      fromDate: searchParams.get("fromDate") || undefined,
      toDate: searchParams.get("toDate") || undefined,
      sortBy: searchParams.get("sortBy") || "orderDate",
      sortOrder: searchParams.get("sortOrder") || "desc",
    };

    // Validate query parameters
    const validatedQuery = purchaseOrderQuerySchema.parse(queryParams);
    const {
      page,
      limit,
      search,
      supplierId,
      status,
      fromDate,
      toDate,
      sortBy,
      sortOrder,
    } = validatedQuery;

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build where clause for Prisma
    const where: any = {};

    // Apply filters
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
        { suppliers: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (status) {
      where.status = status;
    }

    if (fromDate || toDate) {
      where.orderDate = {};
      if (fromDate) where.orderDate.gte = new Date(fromDate);
      if (toDate) where.orderDate.lte = new Date(toDate);
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === "orderDate") {
      orderBy.orderDate = sortOrder;
    } else if (sortBy === "orderNumber") {
      orderBy.orderNumber = sortOrder;
    } else if (sortBy === "totalAmount") {
      orderBy.totalAmount = sortOrder;
    } else if (sortBy === "status") {
      orderBy.status = sortOrder;
    } else if (sortBy === "createdAt") {
      orderBy.createdAt = sortOrder;
    } else {
      orderBy.orderDate = sortOrder; // default fallback
    }

    // Execute queries in parallel for better performance
    const [purchaseOrdersData, totalCount] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
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
            },
          },
          purchaseOrderItems: {
            include: {
              products: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
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
          _count: {
            select: {
              purchaseOrderItems: true,
            },
          },
        },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    // Transform the data to match the component interface
    const purchaseOrders = purchaseOrdersData.map((po) => ({
      id: po.id,
      orderNumber: po.orderNumber,
      supplierId: po.supplierId,
      userId: po.userId,
      orderDate: po.orderDate,
      expectedDeliveryDate: po.expectedDeliveryDate,
      actualDeliveryDate: po.actualDeliveryDate,
      subtotal: po.subtotal,
      taxAmount: po.taxAmount,
      shippingCost: po.shippingCost,
      totalAmount: po.totalAmount,
      status: po.status.toUpperCase(),
      notes: po.notes,
      createdAt: po.createdAt,
      updatedAt: po.updatedAt,
      suppliers: po.suppliers,
      users: po.users,
      purchaseOrderItems: po.purchaseOrderItems,
      itemCount: po._count.purchaseOrderItems,
    }));

    return createApiResponse.successWithPagination(purchaseOrders, {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/purchase-orders - Create a new purchase order
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return handleApiError(new Error("Unauthorized"), 401);
    }

    // Check permissions
    if (!hasPermission(session.user.role, "PURCHASE_ORDER_WRITE")) {
      return handleApiError(new Error("Insufficient permissions"), 403);
    }

    const body = await request.json();
    const validatedData = createPurchaseOrderSchema.parse(body);

    // Validate business rules
    const ruleErrors = validatePurchaseOrderRules(validatedData);
    if (ruleErrors.length > 0) {
      return handleApiError(new Error(ruleErrors.join("; ")), 400);
    }

    // Validate totals
    const totalValidation = validatePurchaseOrderTotals(validatedData);
    if (!totalValidation.totalsMatch) {
      return handleApiError(
        new Error(
          `Total amount mismatch. Calculated: ₦${totalValidation.calculatedTotal.toFixed(2)}, Provided: ₦${validatedData.totalAmount.toFixed(2)}`
        ),
        400
      );
    }

    if (!totalValidation.itemsMatch) {
      return handleApiError(
        new Error(
          `Subtotal mismatch. Items total: ₦${totalValidation.itemsTotal.toFixed(2)}, Provided: ₦${validatedData.subtotal.toFixed(2)}`
        ),
        400
      );
    }

    // Check if supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: validatedData.supplierId },
      select: { id: true, name: true, isActive: true },
    });

    if (!supplier) {
      return handleApiError(new Error("Supplier not found"), 404);
    }

    if (!supplier.isActive) {
      return handleApiError(
        new Error("Cannot create purchase order for inactive supplier"),
        400
      );
    }

    // Check if order number already exists
    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { orderNumber: validatedData.orderNumber },
      select: { id: true },
    });

    if (existingOrder) {
      return handleApiError(
        new Error("Purchase order with this number already exists"),
        409
      );
    }

    // Validate products exist
    for (const item of validatedData.items) {
      if (item.productId) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true },
        });

        if (!product) {
          return handleApiError(
            new Error(`Product with ID ${item.productId} not found`),
            404
          );
        }
      }

      if (item.variantId) {
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.variantId },
          select: { id: true, name: true },
        });

        if (!variant) {
          return handleApiError(
            new Error(`Product variant with ID ${item.variantId} not found`),
            404
          );
        }
      }
    }

    // Create purchase order with items in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the purchase order
      const purchaseOrder = await tx.purchaseOrder.create({
        data: {
          orderNumber: validatedData.orderNumber,
          orderDate: new Date(validatedData.orderDate),
          expectedDeliveryDate: validatedData.expectedDeliveryDate
            ? new Date(validatedData.expectedDeliveryDate)
            : null,
          subtotal: validatedData.subtotal,
          taxAmount: validatedData.taxAmount,
          shippingCost: validatedData.shippingCost,
          totalAmount: validatedData.totalAmount,
          notes: validatedData.notes,
          status: PURCHASE_ORDER_STATUS.DRAFT,
          supplierId: validatedData.supplierId,
          userId: parseInt(session.user.id),
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
            },
          },
        },
      });

      // Create purchase order items
      const purchaseOrderItems = await Promise.all(
        validatedData.items.map((item) =>
          tx.purchaseOrderItem.create({
            data: {
              purchaseOrderId: purchaseOrder.id,
              productId: item.productId || null,
              variantId: item.variantId || null,
              quantityOrdered: item.quantityOrdered,
              quantityReceived: 0,
              unitCost: item.unitCost,
              totalCost: item.totalCost,
            },
            include: {
              products: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
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
          })
        )
      );

      return { purchaseOrder, purchaseOrderItems };
    });

    // Log the purchase order creation
    await AuditLogger.logPurchaseOrderCreated(
      parseInt(session.user.id),
      session.user.email!,
      result.purchaseOrder.id,
      result.purchaseOrder.orderNumber,
      result.purchaseOrder.suppliers.name,
      Number(result.purchaseOrder.totalAmount),
      request
    );

    return createApiResponse.success(
      {
        ...result.purchaseOrder,
        items: result.purchaseOrderItems,
      },
      "Purchase order created successfully",
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
