import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { prisma } from '@/lib/db';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // Build date filter for sales data
    const dateFilter: any = {};
    if (fromDate) {
      dateFilter.gte = new Date(fromDate);
    }
    if (toDate) {
      dateFilter.lte = new Date(toDate + 'T23:59:59.999Z');
    }

    // Get basic product counts
    const totalProducts = await prisma.product.count({
      where: { isArchived: false },
    });

    const activeProducts = await prisma.product.count({
      where: {
        isArchived: false,
        status: 'ACTIVE',
      },
    });

    // Get out of stock products
    const outOfStockProducts = await prisma.product.count({
      where: {
        isArchived: false,
        status: 'ACTIVE',
        stock: 0,
      },
    });

    // For low stock, we need to fetch and filter in memory since Prisma doesn't support field-to-field comparison
    const productsForLowStock = await prisma.product.findMany({
      where: {
        isArchived: false,
        status: 'ACTIVE',
        stock: { gt: 0 },
      },
      select: {
        stock: true,
        minStock: true,
      },
    });

    const lowStockProducts = productsForLowStock.filter(
      product => product.stock <= product.minStock
    ).length;

    // Calculate total stock value and total quantity
    const productsForValue = await prisma.product.findMany({
      where: {
        isArchived: false,
        status: 'ACTIVE',
      },
      select: {
        stock: true,
        cost: true,
      },
    });

    const totalStockValue = productsForValue.reduce((sum, product) => {
      return sum + Number(product.stock) * Number(product.cost);
    }, 0);

    const totalQuantity = productsForValue.reduce((sum, product) => {
      return sum + Number(product.stock);
    }, 0);

    // Get total sold (from sales transactions)
    const totalSold = await prisma.salesItem.aggregate({
      where: {
        sales_transactions: {
          created_at:
            Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
        },
      },
      _sum: {
        quantity: true,
      },
    });

    // Get category breakdown
    const categoryBreakdown = await prisma.product.groupBy({
      by: ['categoryId'],
      where: {
        isArchived: false,
        status: 'ACTIVE',
      },
      _count: {
        id: true,
      },
      _sum: {
        stock: true,
      },
    });

    // Get category names for the breakdown
    const categoryIds = categoryBreakdown
      .map(item => item.categoryId)
      .filter(Boolean);
    const categories = await prisma.category.findMany({
      where: {
        id: { in: categoryIds as number[] },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const categoryData = categoryBreakdown.map(item => {
      const category = categories.find(cat => cat.id === item.categoryId);
      return {
        categoryName: category?.name || 'Uncategorized',
        productCount: item._count.id,
        totalStock: item._sum.stock || 0,
      };
    });

    // Get recent stock changes (last 10 activities)
    const recentStockChanges = await prisma.stockAddition.findMany({
      where: {
        product: {
          isArchived: false,
        },
        createdAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
      },
      select: {
        id: true,
        quantity: true,
        createdAt: true,
        product: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // Transform stock changes to match the interface
    const transformedStockChanges = recentStockChanges.map(change => ({
      id: change.id,
      productName: change.product.name,
      change: change.quantity,
      type: 'addition' as const,
      timestamp: change.createdAt?.toISOString() || new Date().toISOString(),
    }));

    return NextResponse.json({
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      totalStockValue,
      totalQuantity,
      totalSold: totalSold._sum?.quantity || 0,
      categoryBreakdown: categoryData,
      recentStockChanges: transformedStockChanges,
    });
  } catch (error) {
    console.error('Error fetching product overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product overview' },
      { status: 500 }
    );
  }
});
