import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { prisma } from '@/lib/db';

// GET /api/inventory/charts - Get inventory chart data
export const GET = withAuth(
  async (_request: AuthenticatedRequest): Promise<NextResponse> => {
    try {
      // Get stock movement data for the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const stockData = await Promise.all(
        Array.from({ length: 6 }, async (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

          const [stockIn, stockOut] = await Promise.all([
            // Stock additions
            prisma.stockAddition.aggregate({
              where: {
                createdAt: {
                  gte: monthStart,
                  lte: monthEnd,
                },
              },
              _sum: {
                quantity: true,
              },
            }),
            // Stock adjustments (out)
            prisma.stockAdjustment.aggregate({
              where: {
                created_at: {
                  gte: monthStart,
                  lte: monthEnd,
                },
                adjustment_type: 'DECREASE',
              },
              _sum: {
                quantity: true,
              },
            }),
          ]);

          return {
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            stockIn: stockIn._sum.quantity || 0,
            stockOut: stockOut._sum.quantity || 0,
          };
        })
      );

      // Get sales data by category (simplified approach)
      const salesItems = await prisma.salesItem.findMany({
        where: {
          products: {
            isArchived: false,
          },
        },
        include: {
          products: {
            include: {
              category: true,
            },
          },
        },
        take: 100, // Limit for performance
      });

      // Group sales by category
      const salesByCategory = salesItems.reduce(
        (acc, item) => {
          const categoryName = item.products?.category?.name || 'Uncategorized';
          const existing = acc.find(i => i.category === categoryName);

          if (existing) {
            existing.sales += item.quantity;
            existing.revenue += Number(item.total_price);
          } else {
            acc.push({
              category: categoryName,
              sales: item.quantity,
              revenue: Number(item.total_price),
            });
          }
          return acc;
        },
        [] as Array<{ category: string; sales: number; revenue: number }>
      );

      // Sort by revenue and take top 10
      const topSalesData = salesByCategory
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      return NextResponse.json({
        stockData: stockData.reverse(), // Reverse to show oldest first
        salesData: topSalesData,
      });
    } catch (error) {
      console.error('Error fetching inventory charts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch inventory charts' },
        { status: 500 }
      );
    }
  }
);
