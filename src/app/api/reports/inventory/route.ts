import { NextResponse } from 'next/server';
import { withPermission, AuthenticatedRequest } from '@/lib/api-middleware';
import { handleApiError } from '@/lib/api-error-handler-new';
import { prisma } from '@/lib/db';
import { format } from 'date-fns';
import { USER_ROLES } from '@/lib/auth/roles';

export const GET = withPermission(
  [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  async (request: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const reportType = searchParams.get('type') || 'current_stock';
      const format_type = searchParams.get('format') || 'json';
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const category = searchParams.get('category');
      const brand = searchParams.get('brand');
      const supplier = searchParams.get('supplier');
      const lowStockOnly = searchParams.get('lowStockOnly') === 'true';
      const includeArchived = searchParams.get('includeArchived') === 'true';

      let reportData;
      let reportTitle;
      let filename;

      switch (reportType) {
        case 'current_stock':
          reportData = await getCurrentStockReport({
            category,
            brand,
            supplier,
            lowStockOnly,
            includeArchived,
            page,
            limit,
          });
          reportTitle = 'Current Stock Report';
          filename = `current-stock-${format(new Date(), 'yyyy-MM-dd')}`;
          break;

        case 'stock_value':
          reportData = await getStockValueReport({
            category,
            brand,
            supplier,
            includeArchived,
            page,
            limit,
          });
          reportTitle = 'Stock Value Report';
          filename = `stock-value-${format(new Date(), 'yyyy-MM-dd')}`;
          break;

        case 'low_stock':
          reportData = await getLowStockReport({
            category,
            brand,
            supplier,
            page,
            limit,
          });
          reportTitle = 'Low Stock Report';
          filename = `low-stock-${format(new Date(), 'yyyy-MM-dd')}`;
          break;

        case 'stock_movement':
          const fromDate = searchParams.get('fromDate');
          const toDate = searchParams.get('toDate');
          reportData = await getStockMovementReport({
            category,
            brand,
            supplier,
            fromDate,
            toDate,
            page,
            limit,
          });
          reportTitle = 'Stock Movement Report';
          filename = `stock-movement-${format(new Date(), 'yyyy-MM-dd')}`;
          break;

        case 'reorder':
          reportData = await getReorderReport({
            category,
            brand,
            supplier,
            page,
            limit,
          });
          reportTitle = 'Reorder Report';
          filename = `reorder-${format(new Date(), 'yyyy-MM-dd')}`;
          break;

        default:
          return NextResponse.json(
            { error: 'Invalid report type' },
            { status: 400 }
          );
      }

      // Handle different response formats
      if (format_type === 'csv') {
        const csv = generateCSV(reportData.data, reportType);
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${filename}.csv"`,
          },
        });
      } else if (format_type === 'pdf') {
        // PDF generation would go here - for now return JSON
        return NextResponse.json(
          {
            error: 'PDF format not yet implemented',
          },
          { status: 501 }
        );
      }

      // Default JSON response
      return NextResponse.json({
        success: true,
        reportType,
        reportTitle,
        generatedAt: new Date().toISOString(),
        data: reportData.data,
        summary: reportData.summary,
        pagination: reportData.pagination,
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);

// Helper function to get current stock report
async function getCurrentStockReport(filters: any) {
  const {
    category,
    brand,
    supplier,
    lowStockOnly,
    includeArchived,
    page,
    limit,
  } = filters;

  const where: any = {
    isArchived: includeArchived ? undefined : false,
  };

  if (category) {
    where.category = { name: { contains: category, mode: 'insensitive' } };
  }
  if (brand) {
    where.brand = { name: { contains: brand, mode: 'insensitive' } };
  }
  if (supplier) {
    where.supplier = { name: { contains: supplier, mode: 'insensitive' } };
  }
  if (lowStockOnly) {
    where.stock = { lte: prisma.product.fields.minStock };
  }

  const offset = (page - 1) * limit;

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
        supplier: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
      skip: offset,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  // Get all products for summary calculations (not paginated)
  const allProducts = await prisma.product.findMany({
    where,
    select: {
      stock: true,
      minStock: true,
      price: true,
      cost: true,
    },
  });

  const summary = {
    totalProducts: totalCount,
    totalValue: allProducts.reduce(
      (sum, p) => sum + (p.stock || 0) * Number(p.price || 0),
      0
    ),
    lowStockItems: allProducts.filter(p => (p.stock || 0) <= (p.minStock || 0))
      .length,
    outOfStockItems: allProducts.filter(p => (p.stock || 0) === 0).length,
  };

  return {
    data: products.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category?.name || 'Uncategorized',
      brand: p.brand?.name || 'No Brand',
      supplier: p.supplier?.name || 'No Supplier',
      currentStock: p.stock,
      minStock: p.minStock,
      price: p.price,
      cost: p.cost,
      stockValue: (p.stock || 0) * Number(p.price || 0),
      status:
        p.stock <= p.minStock
          ? p.stock === 0
            ? 'Out of Stock'
            : 'Low Stock'
          : 'In Stock',
    })),
    summary,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
}

// Helper function to get stock value report
async function getStockValueReport(filters: any) {
  const { category, brand, supplier, includeArchived, page, limit } = filters;

  const where: any = {
    isArchived: includeArchived ? undefined : false,
  };

  if (category) {
    where.category = { name: { contains: category, mode: 'insensitive' } };
  }
  if (brand) {
    where.brand = { name: { contains: brand, mode: 'insensitive' } };
  }
  if (supplier) {
    where.supplier = { name: { contains: supplier, mode: 'insensitive' } };
  }

  const offset = (page - 1) * limit;

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
        supplier: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
      skip: offset,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  // Get all products for summary calculations (not paginated)
  const allProducts = await prisma.product.findMany({
    where,
    select: {
      stock: true,
      price: true,
      cost: true,
    },
  });

  const summary = {
    totalProducts: totalCount,
    totalStockValue: allProducts.reduce(
      (sum, p) => sum + (p.stock || 0) * Number(p.price || 0),
      0
    ),
    totalCostValue: allProducts.reduce(
      (sum, p) => sum + (p.stock || 0) * Number(p.cost || 0),
      0
    ),
    totalProfit: allProducts.reduce(
      (sum, p) =>
        sum + (p.stock || 0) * (Number(p.price || 0) - Number(p.cost || 0)),
      0
    ),
  };

  return {
    data: products.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category?.name || 'Uncategorized',
      brand: p.brand?.name || 'No Brand',
      currentStock: p.stock,
      costPrice: p.cost,
      sellingPrice: p.price,
      stockValue: (p.stock || 0) * Number(p.price || 0),
      costValue: (p.stock || 0) * Number(p.cost || 0),
      profitValue:
        (p.stock || 0) * (Number(p.price || 0) - Number(p.cost || 0)),
      profitMargin:
        Number(p.price || 0) > 0 && Number(p.cost || 0) > 0
          ? ((Number(p.price || 0) - Number(p.cost || 0)) /
              Number(p.price || 0)) *
            100
          : 0,
    })),
    summary,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
}

// Helper function to get low stock report
async function getLowStockReport(filters: any) {
  const { category, brand, supplier, page, limit } = filters;

  const where: any = {
    isArchived: false,
    stock: { lte: prisma.product.fields.minStock },
  };

  if (category) {
    where.category = { name: { contains: category, mode: 'insensitive' } };
  }
  if (brand) {
    where.brand = { name: { contains: brand, mode: 'insensitive' } };
  }
  if (supplier) {
    where.supplier = { name: { contains: supplier, mode: 'insensitive' } };
  }

  const offset = (page - 1) * limit;

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
        supplier: { select: { name: true } },
      },
      orderBy: { stock: 'asc' },
      skip: offset,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  // Get all products for summary calculations (not paginated)
  const allProducts = await prisma.product.findMany({
    where,
    select: {
      stock: true,
      minStock: true,
      cost: true,
    },
  });

  const summary = {
    totalLowStockItems: totalCount,
    outOfStockItems: allProducts.filter(p => (p.stock || 0) === 0).length,
    criticallyLowItems: allProducts.filter(
      p => (p.stock || 0) > 0 && (p.stock || 0) <= (p.minStock || 0) * 0.5
    ).length,
    totalReorderValue: allProducts.reduce(
      (sum, p) => sum + (p.minStock || 0) * 2 * Number(p.cost || 0),
      0
    ),
  };

  return {
    data: products.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category?.name || 'Uncategorized',
      brand: p.brand?.name || 'No Brand',
      supplier: p.supplier?.name || 'No Supplier',
      currentStock: p.stock,
      minStock: p.minStock,
      shortage: (p.minStock || 0) - (p.stock || 0),
      reorderQuantity: (p.minStock || 0) * 2, // Simple reorder logic
      reorderValue: (p.minStock || 0) * 2 * Number(p.cost || 0),
      urgency:
        (p.stock || 0) === 0
          ? 'Critical'
          : (p.stock || 0) <= (p.minStock || 0) * 0.5
            ? 'High'
            : 'Medium',
    })),
    summary,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
}

// Helper function to get stock movement report
async function getStockMovementReport(filters: any) {
  const { category, brand, supplier, fromDate, toDate, page, limit } = filters;

  const where: any = {};

  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = new Date(fromDate);
    if (toDate) where.createdAt.lte = new Date(toDate);
  }

  if (category || brand || supplier) {
    where.product = {};
    if (category) {
      where.product.category = {
        name: { contains: category, mode: 'insensitive' },
      };
    }
    if (brand) {
      where.product.brand = { name: { contains: brand, mode: 'insensitive' } };
    }
    if (supplier) {
      where.product.supplier = {
        name: { contains: supplier, mode: 'insensitive' },
      };
    }
  }

  const offset = (page - 1) * limit;

  const [stockAdditions, totalCount] = await Promise.all([
    prisma.stockAddition.findMany({
      where,
      include: {
        product: {
          include: {
            category: { select: { name: true } },
            brand: { select: { name: true } },
            supplier: { select: { name: true } },
          },
        },
        createdBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.stockAddition.count({ where }),
  ]);

  const summary = {
    totalMovements: totalCount,
    totalQuantityAdded: stockAdditions.reduce(
      (sum, sa) => sum + sa.quantity,
      0
    ),
    totalValueAdded: stockAdditions.reduce(
      (sum, sa) => sum + Number(sa.totalCost),
      0
    ),
  };

  return {
    data: stockAdditions.map(sa => ({
      id: sa.id,
      date: sa.createdAt,
      productName: sa.product.name,
      sku: sa.product.sku,
      category: sa.product.category?.name || 'Uncategorized',
      brand: sa.product.brand?.name || 'No Brand',
      supplier: sa.product.supplier?.name || 'No Supplier',
      movementType: 'Addition',
      quantity: sa.quantity,
      unitCost: sa.costPerUnit,
      totalCost: sa.totalCost,
      createdBy: `${sa.createdBy.firstName} ${sa.createdBy.lastName}`,
    })),
    summary,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
}

// Helper function to get reorder report
async function getReorderReport(filters: any) {
  const { category, brand, supplier, page, limit } = filters;

  const where: any = {
    isArchived: false,
    stock: { lte: prisma.product.fields.minStock },
  };

  if (category) {
    where.category = { name: { contains: category, mode: 'insensitive' } };
  }
  if (brand) {
    where.brand = { name: { contains: brand, mode: 'insensitive' } };
  }
  if (supplier) {
    where.supplier = { name: { contains: supplier, mode: 'insensitive' } };
  }

  const offset = (page - 1) * limit;

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
        supplier: { select: { name: true } },
      },
      orderBy: { stock: 'asc' },
      skip: offset,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  // Get all products for summary calculations (not paginated)
  const allProducts = await prisma.product.findMany({
    where,
    select: {
      minStock: true,
      cost: true,
    },
  });

  const summary = {
    totalReorderItems: totalCount,
    totalReorderValue: allProducts.reduce(
      (sum, p) => sum + (p.minStock || 0) * 2 * Number(p.cost || 0),
      0
    ),
  };

  return {
    data: products.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category?.name || 'Uncategorized',
      brand: p.brand?.name || 'No Brand',
      supplier: p.supplier?.name || 'No Supplier',
      currentStock: p.stock,
      minStock: p.minStock,
      recommendedOrder: (p.minStock || 0) * 2, // Simple reorder logic
      unitCost: p.cost,
      orderValue: (p.minStock || 0) * 2 * Number(p.cost || 0),
    })),
    summary,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
}

// Helper function to generate CSV
function generateCSV(data: any[], _reportType: string): string {
  if (!data || data.length === 0) {
    return 'No data available';
  }

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers
        .map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          if (
            typeof value === 'string' &&
            (value.includes(',') || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(',')
    ),
  ];

  return csvRows.join('\n');
}
