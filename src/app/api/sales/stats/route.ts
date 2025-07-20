import { prisma } from "@/lib/db";
import { withAuth, AuthenticatedRequest } from "@/lib/api-middleware";
import { createApiResponse } from "@/lib/api-response";

// GET /api/sales/stats - Get sales statistics
export const GET = withAuth(async function (request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    // Build where clause for date filtering
    const where: any = {};
    if (fromDate || toDate) {
      where.created_at = {};
      if (fromDate) where.created_at.gte = new Date(fromDate);
      if (toDate) where.created_at.lte = new Date(toDate + "T23:59:59");
    }

    // Get current date for comparison
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Current period stats
    const currentPeriodWhere = {
      ...where,
      created_at: {
        ...where.created_at,
        gte: currentMonthStart,
      },
    };

    // Previous period stats
    const previousPeriodWhere = {
      created_at: {
        gte: previousMonthStart,
        lte: previousMonthEnd,
      },
    };

    // Execute queries in parallel
    const [currentPeriodStats, previousPeriodStats, totalStats] =
      await Promise.all([
        // Current period stats
        prisma.$transaction(async (tx) => {
          const [transactions, totalSales, totalItems, totalDiscount] =
            await Promise.all([
              tx.salesTransaction.count({ where: currentPeriodWhere }),
              tx.salesTransaction.aggregate({
                where: currentPeriodWhere,
                _sum: { total_amount: true },
              }),
              tx.salesItem.aggregate({
                where: {
                  sales_transactions: currentPeriodWhere,
                },
                _sum: { quantity: true },
              }),
              tx.salesTransaction.aggregate({
                where: currentPeriodWhere,
                _sum: { discount_amount: true },
              }),
            ]);

          return {
            transactions: transactions,
            totalSales: totalSales._sum.total_amount || 0,
            totalItems: totalItems._sum.quantity || 0,
            totalDiscount: totalDiscount._sum.discount_amount || 0,
          };
        }),

        // Previous period stats
        prisma.$transaction(async (tx) => {
          const [transactions, totalSales, totalItems, totalDiscount] =
            await Promise.all([
              tx.salesTransaction.count({ where: previousPeriodWhere }),
              tx.salesTransaction.aggregate({
                where: previousPeriodWhere,
                _sum: { total_amount: true },
              }),
              tx.salesItem.aggregate({
                where: {
                  sales_transactions: previousPeriodWhere,
                },
                _sum: { quantity: true },
              }),
              tx.salesTransaction.aggregate({
                where: previousPeriodWhere,
                _sum: { discount_amount: true },
              }),
            ]);

          return {
            transactions: transactions,
            totalSales: totalSales._sum.total_amount || 0,
            totalItems: totalItems._sum.quantity || 0,
            totalDiscount: totalDiscount._sum.discount_amount || 0,
          };
        }),

        // Overall stats (if no date filter)
        !fromDate && !toDate
          ? prisma.$transaction(async (tx) => {
              const [transactions, totalSales, totalItems, totalDiscount] =
                await Promise.all([
                  tx.salesTransaction.count({ where }),
                  tx.salesTransaction.aggregate({
                    where,
                    _sum: { total_amount: true },
                  }),
                  tx.salesItem.aggregate({
                    where: {
                      sales_transactions: where,
                    },
                    _sum: { quantity: true },
                  }),
                  tx.salesTransaction.aggregate({
                    where,
                    _sum: { discount_amount: true },
                  }),
                ]);

              return {
                transactions: transactions,
                totalSales: totalSales._sum.total_amount || 0,
                totalItems: totalItems._sum.quantity || 0,
                totalDiscount: totalDiscount._sum.discount_amount || 0,
              };
            })
          : Promise.resolve(null),
      ]);

    // Calculate averages and changes
    const currentPeriod = currentPeriodStats;
    const previousPeriod = previousPeriodStats;
    const overall = totalStats ? totalStats : currentPeriod;

    const averageOrderValue =
      currentPeriod.transactions > 0
        ? Number(currentPeriod.totalSales) / currentPeriod.transactions
        : 0;

    const netSales =
      Number(currentPeriod.totalSales) - Number(currentPeriod.totalDiscount);

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const stats = {
      // Current period
      totalSales: Number(currentPeriod.totalSales),
      totalTransactions: currentPeriod.transactions,
      averageOrderValue,
      totalItems: currentPeriod.totalItems,
      totalDiscount: Number(currentPeriod.totalDiscount),
      netSales,

      // Changes from previous period
      salesChange: calculateChange(
        Number(currentPeriod.totalSales),
        Number(previousPeriod.totalSales)
      ),
      transactionsChange: calculateChange(
        currentPeriod.transactions,
        previousPeriod.transactions
      ),
      itemsChange: calculateChange(
        currentPeriod.totalItems,
        previousPeriod.totalItems
      ),
      averageOrderValueChange: calculateChange(
        averageOrderValue,
        previousPeriod.transactions > 0
          ? Number(previousPeriod.totalSales) / previousPeriod.transactions
          : 0
      ),

      // Overall totals (if no date filter)
      overallTotalSales: overall
        ? Number(overall.totalSales)
        : Number(currentPeriod.totalSales),
      overallTotalTransactions: overall
        ? overall.transactions
        : currentPeriod.transactions,
      overallTotalItems: overall
        ? overall.totalItems
        : currentPeriod.totalItems,
    };

    return createApiResponse.success(
      stats,
      "Sales statistics retrieved successfully"
    );
  } catch (error) {
    console.error("Error in GET /api/sales/stats:", error);
    return createApiResponse.internalError("Internal server error");
  }
});
