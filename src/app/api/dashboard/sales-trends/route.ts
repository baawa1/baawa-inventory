import { prisma } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { createApiResponse } from '@/lib/api-response';

// GET /api/dashboard/sales-trends - Get sales trends for the last 7 days
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    // Get the last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    // Get daily sales data
    const dailySales = await prisma.salesTransaction.groupBy({
      by: ['created_at'],
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
        transaction_type: 'sale',
      },
      _sum: {
        total_amount: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    // Create a map of all 7 days with default values
    const salesData = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dayName = dayNames[date.getDay()];

      // Find sales data for this day
      const daySales = dailySales.find(sale => {
        const saleDate = new Date(sale.created_at!);
        return saleDate.toDateString() === date.toDateString();
      });

      salesData.push({
        day: dayName,
        sales: Number(daySales?._sum.total_amount) || 0,
        transactions: daySales?._count.id || 0,
        date: date.toISOString().split('T')[0],
      });
    }

    return createApiResponse.success(
      salesData,
      'Sales trends data retrieved successfully'
    );
  } catch (error) {
    console.error('Error fetching sales trends:', error);
    return createApiResponse.error(
      'Failed to fetch sales trends data',
      500,
      error
    );
  }
});
