import { NextResponse } from "next/server";
import {
  withAuth,
  withPermission,
  AuthenticatedRequest,
} from "@/lib/api-middleware";
import { handleApiError } from "@/lib/api-error-handler-new";
import { prisma } from "@/lib/db";

import { USER_ROLES } from "@/lib/auth/roles";
import {
  createStockAdditionSchema,
  stockAdditionQuerySchema,
  type CreateStockAdditionData,
} from "@/lib/validations/stock-management";

// GET /api/stock-additions - List stock additions with filtering
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams: Record<string, unknown> = {};

    // Parse query parameters
    for (const [key, value] of searchParams) {
      if (
        key === "productId" ||
        key === "supplierId" ||
        key === "createdBy" ||
        key === "page" ||
        key === "limit"
      ) {
        queryParams[key] = parseInt(value);
      } else {
        queryParams[key] = value;
      }
    }

    const validatedQuery = stockAdditionQuerySchema.parse(queryParams);

    // Build Prisma where clause
    const where: any = {};
    if (validatedQuery.productId) where.productId = validatedQuery.productId;
    if (validatedQuery.supplierId) where.supplierId = validatedQuery.supplierId;
    if (validatedQuery.createdBy) where.createdById = validatedQuery.createdBy;
    if (validatedQuery.startDate || validatedQuery.endDate) {
      where.purchaseDate = {};
      if (validatedQuery.startDate)
        where.purchaseDate.gte = new Date(validatedQuery.startDate);
      if (validatedQuery.endDate)
        where.purchaseDate.lte = new Date(validatedQuery.endDate);
    }

    // Pagination
    const page = validatedQuery.page || 1;
    const limit = validatedQuery.limit || 20;
    const offset = (page - 1) * limit;

    // Get stock additions and total count
    const [stockAdditions, totalCount] = await Promise.all([
      prisma.stockAddition.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
              cost: true,
            },
          },
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.stockAddition.count({ where }),
    ]);

    // Transform the data
    const transformedStockAdditions = stockAdditions.map((addition) => ({
      id: addition.id,
      productId: addition.productId,
      product: addition.product,
      supplierId: addition.supplierId,
      supplier: addition.supplier,
      quantity: addition.quantity,
      costPerUnit: addition.costPerUnit,
      totalCost: addition.totalCost,
      purchaseDate: addition.purchaseDate,
      notes: addition.notes,
      createdBy: addition.createdBy,
      createdAt: addition.createdAt,
      updatedAt: addition.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: transformedStockAdditions,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/stock-additions - Create new stock addition
export const POST = withPermission(
  [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();

      const validatedData: CreateStockAdditionData =
        createStockAdditionSchema.parse(body);

      // Ensure user ID is properly parsed
      const userId = parseInt(request.user.id);
      if (isNaN(userId)) {
        throw new Error("Invalid user ID in session");
      }

      // Execute all operations in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Check if product exists
        const product = await tx.product.findUnique({
          where: { id: validatedData.productId },
          select: { id: true, name: true, stock: true, cost: true },
        });

        if (!product) {
          throw new Error(
            `Product with ID ${validatedData.productId} not found`
          );
        }

        // Check if supplier exists (if provided)
        if (validatedData.supplierId) {
          const supplier = await tx.supplier.findUnique({
            where: { id: validatedData.supplierId },
            select: { id: true, name: true },
          });

          if (!supplier) {
            throw new Error(
              `Supplier with ID ${validatedData.supplierId} not found`
            );
          }
        }

        // Create the stock addition record
        const totalCost = validatedData.quantity * validatedData.costPerUnit;
        const stockAddition = await tx.stockAddition.create({
          data: {
            productId: validatedData.productId,
            supplierId: validatedData.supplierId,
            quantity: validatedData.quantity,
            costPerUnit: validatedData.costPerUnit,
            totalCost: totalCost,
            purchaseDate: validatedData.purchaseDate
              ? new Date(validatedData.purchaseDate)
              : new Date(),
            notes: validatedData.notes,
            createdById: userId,
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
                cost: true,
              },
            },
            supplier: {
              select: {
                id: true,
                name: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });

        // Update product stock
        const newStock = product.stock + validatedData.quantity;
        await tx.product.update({
          where: { id: validatedData.productId },
          data: {
            stock: newStock,
            // Update cost if this addition provides a new cost
            ...(validatedData.costPerUnit && {
              cost: validatedData.costPerUnit,
            }),
          },
        });

        return {
          stockAddition,
          previousStock: product.stock,
          newStock,
        };
      });

      return NextResponse.json(
        {
          success: true,
          message: "Stock addition created successfully",
          data: {
            id: result.stockAddition.id,
            productId: result.stockAddition.productId,
            product: result.stockAddition.product,
            supplierId: result.stockAddition.supplierId,
            supplier: result.stockAddition.supplier,
            quantity: result.stockAddition.quantity,
            costPerUnit: result.stockAddition.costPerUnit,
            totalCost: result.stockAddition.totalCost,
            purchaseDate: result.stockAddition.purchaseDate,
            notes: result.stockAddition.notes,
            createdBy: result.stockAddition.createdBy,
            createdAt: result.stockAddition.createdAt,
            updatedAt: result.stockAddition.updatedAt,
          },
          stockUpdate: {
            previousStock: result.previousStock,
            newStock: result.newStock,
            quantityAdded: validatedData.quantity,
          },
        },
        { status: 201 }
      );
    } catch (error) {
      return handleApiError(error);
    }
  }
);
