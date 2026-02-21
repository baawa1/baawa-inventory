import { prisma } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { createApiResponse } from '@/lib/api-response';
import { SUCCESSFUL_PAYMENT_STATUSES } from '@/lib/constants';

// GET /api/sales/stats - Get sales statistics
export const GET = withAuth(async function (request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFromParam =
      searchParams.get('dateFrom') ?? searchParams.get('fromDate');
    const dateToParam =
      searchParams.get('dateTo') ?? searchParams.get('toDate');

    const invalidFields: string[] = [];
    const parseDateParam = (value: string | null, field: string) => {
      if (!value) return undefined;
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        invalidFields.push(field);
        return undefined;
      }
      return parsed;
    };

    // Build where clause for date filtering and successful payment status
    const where: any = {
      payment_status: {
        in: SUCCESSFUL_PAYMENT_STATUSES,
      },
    };
    const hasDateRange = !!(dateFromParam || dateToParam);
    const now = new Date();

    const normalizeStartOfDay = (date: Date) => {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };

    const normalizeEndOfDay = (date: Date) => {
      const normalized = new Date(date);
      normalized.setHours(23, 59, 59, 999);
      return normalized;
    };

    let rangeStart: Date | undefined;
    let rangeEnd: Date | undefined;

    if (hasDateRange) {
      const parsedFrom = parseDateParam(dateFromParam, 'dateFrom');
      const parsedTo = parseDateParam(dateToParam, 'dateTo');

      if (invalidFields.length > 0) {
        return createApiResponse.validationError(
          `Invalid ${invalidFields.join(', ')}`
        );
      }

      if (parsedFrom) {
        rangeStart = normalizeStartOfDay(parsedFrom);
      }
      if (parsedTo) {
        rangeEnd = normalizeEndOfDay(parsedTo);
      }

      if (!rangeStart && rangeEnd) {
        rangeStart = normalizeStartOfDay(new Date(rangeEnd));
      }

      if (!rangeEnd && rangeStart) {
        rangeEnd = normalizeEndOfDay(now);
      }

      if (rangeStart && rangeEnd && rangeStart > rangeEnd) {
        const swappedStart = rangeEnd;
        rangeEnd = rangeStart;
        rangeStart = swappedStart;
      }

      where.created_at = {};
      if (rangeStart) where.created_at.gte = rangeStart;
      if (rangeEnd) where.created_at.lte = rangeEnd;
    }

    // Get current date for comparison
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const msPerDay = 24 * 60 * 60 * 1000;

    // Current period stats
    const currentPeriodWhere = hasDateRange
      ? {
          ...where,
        }
      : {
          ...where,
          created_at: {
            ...where.created_at,
            gte: currentMonthStart,
          },
        };

    // Previous period stats
    const previousPeriodWhere = hasDateRange
      ? (() => {
          if (!rangeStart || !rangeEnd) {
            return {
              payment_status: {
                in: SUCCESSFUL_PAYMENT_STATUSES,
              },
              created_at: {
                gte: previousMonthStart,
                lte: previousMonthEnd,
              },
            };
          }

          const normalizedStart = normalizeStartOfDay(rangeStart);
          const normalizedEnd = normalizeStartOfDay(rangeEnd);
          const periodDays =
            Math.floor(
              (normalizedEnd.getTime() - normalizedStart.getTime()) / msPerDay
            ) + 1;
          const previousPeriodEnd = new Date(rangeStart.getTime() - 1);
          const previousPeriodStart = new Date(
            rangeStart.getTime() - periodDays * msPerDay
          );

          return {
            payment_status: {
              in: SUCCESSFUL_PAYMENT_STATUSES,
            },
            created_at: {
              gte: previousPeriodStart,
              lte: previousPeriodEnd,
            },
          };
        })()
      : {
          payment_status: {
            in: SUCCESSFUL_PAYMENT_STATUSES,
          },
          created_at: {
            gte: previousMonthStart,
            lte: previousMonthEnd,
          },
        };

    // Execute queries in parallel
    const [currentPeriodStats, previousPeriodStats, totalStats] =
      await Promise.all([
        // Current period stats
        prisma.$transaction(async tx => {
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
        prisma.$transaction(async tx => {
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
        !hasDateRange
          ? prisma.$transaction(async tx => {
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
      'Sales statistics retrieved successfully'
    );
  } catch (error) {
    console.error('Error in GET /api/sales/stats:', error);
    return createApiResponse.internalError('Internal server error');
  }
});
