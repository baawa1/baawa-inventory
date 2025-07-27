import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { USER_ROLES, hasRole } from '@/lib/auth/roles';

// Schema for report query parameters
const reportQuerySchema = z.object({
  type: z
    .enum([
      'current_stock',
      'low_stock',
      'out_of_stock',
      'high_value',
      'slow_moving',
      'category_analysis',
      'supplier_analysis',
    ])
    .default('current_stock'),
  categoryId: z.string().transform(Number).optional(),
  brandId: z.string().transform(Number).optional(),
  supplierId: z.string().transform(Number).optional(),
  includeArchived: z
    .string()
    .optional()
    .default('false')
    .transform(val => val === 'true'),
  lowStockThreshold: z.string().optional().default('10').transform(Number),
  highValueThreshold: z.string().optional().default('10000').transform(Number),
  days: z.string().optional().default('30').transform(Number), // For slow-moving analysis
});

// GET /api/inventory/reports - Generate inventory reports
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check permissions
    if (
      !hasRole(session.user.role, [
        USER_ROLES.ADMIN,
        USER_ROLES.MANAGER,
        USER_ROLES.STAFF,
      ])
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    const validatedQuery = reportQuerySchema.parse(query);

    let reportData;
    let reportTitle;

    // Base filter for products
    const baseFilter: any = {
      isArchived: validatedQuery.includeArchived ? undefined : false,
    };

    if (validatedQuery.categoryId)
      baseFilter.categoryId = validatedQuery.categoryId;
    if (validatedQuery.brandId) baseFilter.brandId = validatedQuery.brandId;
    if (validatedQuery.supplierId)
      baseFilter.supplierId = validatedQuery.supplierId;

    switch (validatedQuery.type) {
      case 'current_stock':
        reportTitle = 'Current Stock Report';
        reportData = await prisma.product.findMany({
          where: baseFilter,
          select: {
            id: true,
            name: true,
            sku: true,
            stock: true,
            minStock: true,
            price: true,
            cost: true,
            category: { select: { name: true } },
            brand: { select: { name: true } },
            supplier: { select: { name: true } },
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { name: 'asc' },
        });
        break;

      case 'low_stock':
        reportTitle = 'Low Stock Alert Report';
        reportData = await prisma.product.findMany({
          where: {
            ...baseFilter,
            stock: { lte: validatedQuery.lowStockThreshold },
          },
          select: {
            id: true,
            name: true,
            sku: true,
            stock: true,
            minStock: true,
            price: true,
            category: { select: { name: true } },
            supplier: { select: { name: true, email: true, phone: true } },
          },
          orderBy: { stock: 'asc' },
        });
        break;

      case 'out_of_stock':
        reportTitle = 'Out of Stock Report';
        reportData = await prisma.product.findMany({
          where: {
            ...baseFilter,
            stock: { lte: 0 },
          },
          select: {
            id: true,
            name: true,
            sku: true,
            stock: true,
            price: true,
            category: { select: { name: true } },
            supplier: { select: { name: true, email: true, phone: true } },
            updatedAt: true,
          },
          orderBy: { updatedAt: 'desc' },
        });
        break;

      case 'high_value':
        reportTitle = 'High Value Inventory Report';
        reportData = await prisma.product.findMany({
          where: baseFilter,
          select: {
            id: true,
            name: true,
            sku: true,
            stock: true,
            price: true,
            cost: true,
            category: { select: { name: true } },
            brand: { select: { name: true } },
          },
          orderBy: { price: 'desc' },
        });

        // Calculate total value and filter high-value items
        reportData = reportData
          .map(item => ({
            ...item,
            totalValue: Number(item.stock || 0) * Number(item.price || 0),
          }))
          .filter(item => item.totalValue >= validatedQuery.highValueThreshold);
        break;

      case 'category_analysis':
        reportTitle = 'Category Analysis Report';
        reportData = await prisma.category.findMany({
          select: {
            id: true,
            name: true,
            _count: { select: { products: true } },
            products: {
              select: {
                stock: true,
                price: true,
                cost: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        });

        // Calculate category totals
        reportData = reportData.map(category => {
          const totalProducts = category._count.products;
          const totalStock = category.products.reduce(
            (sum, p) => sum + Number(p.stock || 0),
            0
          );
          const totalValue = category.products.reduce(
            (sum, p) => sum + Number(p.stock || 0) * Number(p.price || 0),
            0
          );
          const totalCost = category.products.reduce(
            (sum, p) => sum + Number(p.stock || 0) * Number(p.cost || 0),
            0
          );

          return {
            id: category.id,
            name: category.name,
            totalProducts,
            totalStock,
            totalValue,
            totalCost,
            averagePrice: totalProducts > 0 ? totalValue / totalStock || 0 : 0,
          };
        });
        break;

      case 'supplier_analysis':
        reportTitle = 'Supplier Analysis Report';
        reportData = await prisma.supplier.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            _count: { select: { products: true } },
            products: {
              select: {
                stock: true,
                price: true,
                cost: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        });

        // Calculate supplier totals
        reportData = reportData.map(supplier => {
          const totalProducts = supplier._count.products;
          const totalStock = supplier.products.reduce(
            (sum, p) => sum + (p.stock || 0),
            0
          );
          const totalValue = supplier.products.reduce(
            (sum, p) => sum + Number(p.stock || 0) * Number(p.price || 0),
            0
          );

          return {
            id: supplier.id,
            name: supplier.name,
            email: supplier.email,
            phone: supplier.phone,
            totalProducts,
            totalStock,
            totalValue,
          };
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }

    // Generate summary statistics
    const summary = {
      totalItems: Array.isArray(reportData) ? reportData.length : 0,
      generatedAt: new Date().toISOString(),
      reportType: validatedQuery.type,
      filters: {
        categoryId: validatedQuery.categoryId,
        brandId: validatedQuery.brandId,
        supplierId: validatedQuery.supplierId,
        includeArchived: validatedQuery.includeArchived,
      },
    };

    return NextResponse.json({
      title: reportTitle,
      data: reportData,
      summary,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Error generating inventory report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
