import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { handleApiError } from '@/lib/api-error-handler-new';
import { prisma } from '@/lib/db';
import { PAYMENT_STATUS } from '@/lib/constants';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const format = searchParams.get('format') || 'csv';

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { error: 'fromDate and toDate are required' },
        { status: 400 }
      );
    }

    const periodStart = new Date(fromDate);
    const periodEnd = new Date(toDate + 'T23:59:59'); // End of day

    // Get products with their sales data
    const products = await prisma.product.findMany({
      include: {
        category: {
          select: { name: true },
        },
        brand: {
          select: { name: true },
        },
        sales_items: {
          where: {
            sales_transactions: {
              created_at: {
                gte: periodStart,
                lte: periodEnd,
              },
              payment_status: PAYMENT_STATUS.PAID,
            },
          },
          include: {
            sales_transactions: {
              select: {
                created_at: true,
              },
            },
          },
        },
      },
    });

    // Transform to performance data and filter out products with no sales
    const productPerformance = products
      .map(product => {
        const salesItems = product.sales_items || [];
        const totalSold = salesItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        const revenue = salesItems.reduce(
          (sum, item) => sum + Number(item.total_price),
          0
        );
        const averageOrderValue = totalSold > 0 ? revenue / totalSold : 0;

        // Find last sold date
        const lastSold =
          salesItems.length > 0
            ? salesItems
                .map(item => item.sales_transactions?.created_at)
                .filter(Boolean)
                .sort(
                  (a, b) => new Date(b!).getTime() - new Date(a!).getTime()
                )[0]
            : null;

        // Calculate trend
        const halfPeriodStart = new Date(
          periodStart.getTime() + (Date.now() - periodStart.getTime()) / 2
        );

        const recentSales = salesItems.filter(
          item =>
            item.sales_transactions?.created_at &&
            new Date(item.sales_transactions.created_at) >= halfPeriodStart
        );

        const olderSales = salesItems.filter(
          item =>
            item.sales_transactions?.created_at &&
            new Date(item.sales_transactions.created_at) < halfPeriodStart
        );

        const recentRevenue = recentSales.reduce(
          (sum, item) => sum + Number(item.total_price),
          0
        );
        const olderRevenue = olderSales.reduce(
          (sum, item) => sum + Number(item.total_price),
          0
        );

        let trending: 'up' | 'down' | 'stable' = 'stable';
        let trendPercentage = 0;

        if (olderRevenue > 0) {
          const change = ((recentRevenue - olderRevenue) / olderRevenue) * 100;
          trendPercentage = Math.abs(change);

          if (change > 5) trending = 'up';
          else if (change < -5) trending = 'down';
        } else if (recentRevenue > 0) {
          trending = 'up';
          trendPercentage = 100;
        }

        return {
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category?.name || 'Uncategorized',
          brand: product.brand?.name || 'Unknown',
          currentStock: product.stock,
          totalSold,
          revenue,
          averageOrderValue,
          lastSold: lastSold?.toISOString() || 'Never',
          trending,
          trendPercentage: Math.round(trendPercentage),
        };
      })
      .filter(product => product.totalSold > 0); // Only include products with sales

    // Sort by items sold first, then by revenue
    productPerformance.sort((a, b) => {
      // First sort by total sold (descending)
      if (b.totalSold !== a.totalSold) {
        return b.totalSold - a.totalSold;
      }
      // If items sold are equal, sort by revenue (descending)
      return b.revenue - a.revenue;
    });

    if (format === 'csv') {
      // Generate CSV content
      const csvHeaders = [
        'Product Name',
        'SKU',
        'Category',
        'Brand',
        'Current Stock',
        'Units Sold',
        'Revenue (₦)',
        'Average Order Value (₦)',
        'Last Sold',
        'Trend',
        'Trend Percentage (%)',
      ];

      const csvRows = productPerformance.map(product => [
        product.name,
        product.sku,
        product.category,
        product.brand,
        product.currentStock,
        product.totalSold,
        product.revenue.toFixed(2),
        product.averageOrderValue.toFixed(2),
        product.lastSold === 'Never'
          ? 'Never'
          : new Date(product.lastSold).toLocaleDateString(),
        product.trending,
        product.trendPercentage,
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="product-analytics-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Default JSON response
    return NextResponse.json({
      success: true,
      data: productPerformance,
      summary: {
        totalProducts: productPerformance.length,
        totalSold: productPerformance.reduce((sum, p) => sum + p.totalSold, 0),
        totalRevenue: productPerformance.reduce((sum, p) => sum + p.revenue, 0),
        averageOrderValue:
          productPerformance.length > 0
            ? productPerformance.reduce((sum, p) => sum + p.revenue, 0) /
              productPerformance.length
            : 0,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
});
