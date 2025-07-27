import { NextResponse } from 'next/server';
import {
  withAuth,
  withPermission,
  AuthenticatedRequest,
} from '@/lib/api-middleware';
import { handleApiError } from '@/lib/api-error-handler-new';
import { prisma } from '@/lib/db';
import { USER_ROLES } from '@/lib/auth/roles';
import {
  createStockReconciliationSchema,
  stockReconciliationQuerySchema,
  type CreateStockReconciliationData,
} from '@/lib/validations/stock-management';

// GET /api/stock-reconciliations - List stock reconciliations with filtering
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams: Record<string, unknown> = {};

    // Parse query parameters
    for (const [key, value] of searchParams) {
      if (
        key === 'createdBy' ||
        key === 'approvedBy' ||
        key === 'page' ||
        key === 'limit'
      ) {
        queryParams[key] = parseInt(value);
      } else {
        queryParams[key] = value;
      }
    }

    const validatedQuery = stockReconciliationQuerySchema.parse(queryParams);

    // Build where clause
    const where: any = {};
    if (validatedQuery.status) where.status = validatedQuery.status;
    if (validatedQuery.createdBy) where.createdById = validatedQuery.createdBy;
    if (validatedQuery.approvedBy)
      where.approvedById = validatedQuery.approvedBy;
    if (validatedQuery.startDate || validatedQuery.endDate) {
      where.createdAt = {};
      if (validatedQuery.startDate)
        where.createdAt.gte = new Date(validatedQuery.startDate);
      if (validatedQuery.endDate)
        where.createdAt.lte = new Date(validatedQuery.endDate);
    }

    // Calculate pagination
    const page = validatedQuery.page || 1;
    const limit = validatedQuery.limit || 10;
    const skip = (page - 1) * limit;

    // Fetch reconciliations with relations
    const [reconciliations, totalCount] = await Promise.all([
      prisma.stockReconciliation.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          approvedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.stockReconciliation.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: reconciliations.map(reconciliation => ({
        ...reconciliation,
        items: reconciliation.items.map(item => ({
          ...item,
          estimatedImpact:
            item.estimatedImpact !== null && item.estimatedImpact !== undefined
              ? Number(item.estimatedImpact)
              : null,
        })),
      })),
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

// POST /api/stock-reconciliations - Create new stock reconciliation
export const POST = withPermission(
  [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const validatedData: CreateStockReconciliationData =
        createStockReconciliationSchema.parse(body);

      // Validate all products exist and get current stock counts
      const productIds = validatedData.items.map(item => item.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, sku: true, stock: true, cost: true },
      });

      if (products.length !== productIds.length) {
        const missingIds = productIds.filter(
          id => !products.find(p => p.id === id)
        );
        return NextResponse.json(
          { error: `Products not found: ${missingIds.join(', ')}` },
          { status: 404 }
        );
      }

      // Create reconciliation in transaction
      const reconciliation = await prisma.$transaction(async tx => {
        // Create the reconciliation record
        const newReconciliation = await tx.stockReconciliation.create({
          data: {
            title: validatedData.title,
            description: validatedData.description,
            notes: validatedData.notes,
            status: 'DRAFT',
            createdById: parseInt(request.user.id),
          },
          include: {
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

        // Create reconciliation items with proper schema fields
        const itemsData = validatedData.items.map(item => {
          const product = products.find(p => p.id === item.productId)!;
          const discrepancy = item.physicalCount - item.systemCount;

          // Calculate estimated impact with proper null handling
          let estimatedImpact = item.estimatedImpact;
          if (estimatedImpact === null || estimatedImpact === undefined) {
            const productCost = Number(product.cost) || 0;
            estimatedImpact = discrepancy * productCost;

            // Ensure we don't store NaN
            if (isNaN(estimatedImpact)) {
              estimatedImpact = 0;
            }
          }

          return {
            reconciliationId: newReconciliation.id,
            productId: item.productId,
            systemCount: item.systemCount,
            physicalCount: item.physicalCount,
            discrepancy,
            discrepancyReason: item.discrepancyReason,
            estimatedImpact,
            notes: item.notes,
          };
        });

        await tx.stockReconciliationItem.createMany({
          data: itemsData,
        });

        return newReconciliation;
      });

      // Fetch complete reconciliation with items
      const completeReconciliation =
        await prisma.stockReconciliation.findUnique({
          where: { id: reconciliation.id },
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            items: {
              include: {
                product: {
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

      return NextResponse.json(
        {
          success: true,
          message: 'Stock reconciliation created successfully',
          data: completeReconciliation
            ? {
                ...completeReconciliation,
                items: completeReconciliation.items.map(item => ({
                  ...item,
                  estimatedImpact:
                    item.estimatedImpact !== null &&
                    item.estimatedImpact !== undefined
                      ? Number(item.estimatedImpact)
                      : null,
                })),
              }
            : null,
        },
        { status: 201 }
      );
    } catch (error) {
      return handleApiError(error);
    }
  }
);
