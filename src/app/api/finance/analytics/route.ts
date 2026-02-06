import { createFreshPrismaClient } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { createApiResponse } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { SUCCESSFUL_PAYMENT_STATUSES } from '@/lib/constants';

const analyticsQuerySchema = z.object({
  dateFrom: z.string().nullable().optional(),
  dateTo: z.string().nullable().optional(),
  type: z.enum(['all', 'income', 'expense']).optional().default('all'),
  paymentMethod: z.string().nullable().optional(),
  groupBy: z.enum(['day', 'week', 'month']).optional().default('day'),
});

// GET /api/finance/analytics - Get financial analytics data with all data sources
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  const prisma = createFreshPrismaClient();
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      type: searchParams.get('type') || 'all',
      paymentMethod: searchParams.get('paymentMethod') || undefined,
      groupBy: searchParams.get('groupBy') || 'day',
    };

    const validatedQuery = analyticsQuerySchema.parse(queryParams);

    // Build date range for queries
    const startDate = validatedQuery.dateFrom
      ? new Date(validatedQuery.dateFrom)
      : undefined;
    const endDate = validatedQuery.dateTo
      ? new Date(validatedQuery.dateTo + 'T23:59:59')
      : undefined;

    // Build where clause for FinancialTransaction
    const financialWhere: any = {
      status: { in: ['COMPLETED', 'APPROVED'] },
    };
    if (startDate || endDate) {
      financialWhere.transactionDate = {};
      if (startDate) financialWhere.transactionDate.gte = startDate;
      if (endDate) financialWhere.transactionDate.lte = endDate;
    }
    if (validatedQuery.paymentMethod && validatedQuery.paymentMethod !== 'all') {
      financialWhere.paymentMethod = validatedQuery.paymentMethod;
    }

    // Build where clause for SalesTransaction
    const salesWhere: any = {
      payment_status: { in: SUCCESSFUL_PAYMENT_STATUSES },
    };
    if (startDate || endDate) {
      salesWhere.created_at = {};
      if (startDate) salesWhere.created_at.gte = startDate;
      if (endDate) salesWhere.created_at.lte = endDate;
    }
    if (validatedQuery.paymentMethod && validatedQuery.paymentMethod !== 'all') {
      salesWhere.payment_method = validatedQuery.paymentMethod;
    }

    // Build where clause for StockAddition
    const stockWhere: any = {};
    if (startDate || endDate) {
      stockWhere.purchaseDate = {};
      if (startDate) stockWhere.purchaseDate.gte = startDate;
      if (endDate) stockWhere.purchaseDate.lte = endDate;
    }

    // Determine which data to fetch based on type filter
    const includeIncome = validatedQuery.type === 'all' || validatedQuery.type === 'income';
    const includeExpense = validatedQuery.type === 'all' || validatedQuery.type === 'expense';

    // Fetch all data in parallel
    const [
      // Financial Transaction aggregates
      financialIncomeAgg,
      financialExpenseAgg,
      financialTransactionCount,
      financialPaymentMethodStats,
      financialExpenseByType,
      financialExpenseVendors,
      // Sales Transaction aggregates (income)
      salesAgg,
      salesCount,
      salesPaymentMethodStats,
      // Stock Addition aggregates (expense)
      stockAgg,
      stockCount,
    ] = await Promise.all([
      // Financial Income
      includeIncome
        ? prisma.financialTransaction.aggregate({
            where: { ...financialWhere, type: 'INCOME' },
            _sum: { amount: true },
          })
        : Promise.resolve({ _sum: { amount: null } }),

      // Financial Expense
      includeExpense
        ? prisma.financialTransaction.aggregate({
            where: { ...financialWhere, type: 'EXPENSE' },
            _sum: { amount: true },
          })
        : Promise.resolve({ _sum: { amount: null } }),

      // Financial Transaction count
      prisma.financialTransaction.count({
        where: validatedQuery.type === 'all'
          ? financialWhere
          : { ...financialWhere, type: validatedQuery.type.toUpperCase() },
      }),

      // Financial Payment method distribution
      prisma.financialTransaction.groupBy({
        by: ['paymentMethod'],
        where: financialWhere,
        _count: { paymentMethod: true },
        _sum: { amount: true },
      }),

      // Expense breakdown by type - use groupBy for efficiency instead of fetching all records
      includeExpense
        ? prisma.expenseDetail.groupBy({
            by: ['expenseType'],
            where: {
              transaction: { ...financialWhere, type: 'EXPENSE' },
            },
            _sum: { id: true },
          }).then(async (groups) => {
            // Get sum of amounts per expense type
            const results = await Promise.all(
              groups.map(async (g) => {
                const sum = await prisma.financialTransaction.aggregate({
                  where: {
                    ...financialWhere,
                    type: 'EXPENSE',
                    expenseDetails: { expenseType: g.expenseType },
                  },
                  _sum: { amount: true },
                });
                return { expenseType: g.expenseType, amount: Number(sum._sum.amount) || 0 };
              })
            );
            return results;
          })
        : Promise.resolve([]),

      // Top vendors from expense transactions - limit to 100 most recent for performance
      includeExpense
        ? prisma.expenseDetail.findMany({
            where: {
              transaction: {
                ...financialWhere,
                type: 'EXPENSE',
              },
              vendorName: { not: null },
            },
            include: {
              transaction: {
                select: { amount: true },
              },
            },
            orderBy: {
              transaction: { transactionDate: 'desc' },
            },
            take: 100,
          })
        : Promise.resolve([]),

      // Sales aggregate (income source)
      includeIncome
        ? prisma.salesTransaction.aggregate({
            where: salesWhere,
            _sum: { total_amount: true },
          })
        : Promise.resolve({ _sum: { total_amount: null } }),

      // Sales count
      includeIncome
        ? prisma.salesTransaction.count({ where: salesWhere })
        : Promise.resolve(0),

      // Sales payment method distribution
      includeIncome
        ? prisma.salesTransaction.groupBy({
            by: ['payment_method'],
            where: salesWhere,
            _count: { payment_method: true },
            _sum: { total_amount: true },
          })
        : Promise.resolve([]),

      // Stock additions aggregate (expense source)
      includeExpense
        ? prisma.stockAddition.aggregate({
            where: stockWhere,
            _sum: { totalCost: true },
          })
        : Promise.resolve({ _sum: { totalCost: null } }),

      // Stock count
      includeExpense
        ? prisma.stockAddition.count({ where: stockWhere })
        : Promise.resolve(0),
    ]);

    // Calculate totals from all sources
    const financialIncome = Number(financialIncomeAgg._sum.amount) || 0;
    const financialExpense = Number(financialExpenseAgg._sum.amount) || 0;
    const salesIncome = Number(salesAgg._sum.total_amount) || 0;
    const stockExpense = Number(stockAgg._sum.totalCost) || 0;

    const totalIncome = financialIncome + salesIncome;
    const totalExpenses = financialExpense + stockExpense;
    const netProfit = totalIncome - totalExpenses;
    const totalTransactionCount = financialTransactionCount + (includeIncome ? salesCount : 0) + (includeExpense ? stockCount : 0);

    // Calculate average transaction value
    const totalAmount = totalIncome + totalExpenses;
    const averageTransactionValue = totalTransactionCount > 0 ? totalAmount / totalTransactionCount : 0;

    // Merge payment method distributions
    const paymentMethodMap = new Map<string, { count: number; amount: number }>();

    financialPaymentMethodStats.forEach(stat => {
      const method = stat.paymentMethod || 'Unknown';
      const existing = paymentMethodMap.get(method) || { count: 0, amount: 0 };
      paymentMethodMap.set(method, {
        count: existing.count + stat._count.paymentMethod,
        amount: existing.amount + (Number(stat._sum.amount) || 0),
      });
    });

    salesPaymentMethodStats.forEach(stat => {
      const method = stat.payment_method || 'Unknown';
      const existing = paymentMethodMap.get(method) || { count: 0, amount: 0 };
      paymentMethodMap.set(method, {
        count: existing.count + stat._count.payment_method,
        amount: existing.amount + (Number(stat._sum.total_amount) || 0),
      });
    });

    // Add stock purchases as BANK_TRANSFER (default payment method for stock)
    if (stockCount > 0 && includeExpense) {
      const existing = paymentMethodMap.get('BANK_TRANSFER') || { count: 0, amount: 0 };
      paymentMethodMap.set('BANK_TRANSFER', {
        count: existing.count + stockCount,
        amount: existing.amount + stockExpense,
      });
    }

    const paymentMethodDistribution = Array.from(paymentMethodMap.entries()).map(
      ([name, data]) => ({
        name,
        value: data.count,
        amount: data.amount,
      })
    );

    // Get top payment method
    const topPaymentMethod = paymentMethodDistribution.length > 0
      ? paymentMethodDistribution.reduce((prev, current) =>
          prev.value > current.value ? prev : current
        )
      : { name: 'Cash', value: 0, amount: 0 };

    // Build expense breakdown by type
    const expenseBreakdownMap = new Map<string, number>();

    // Add financial expense types from grouped results
    (financialExpenseByType as Array<{ expenseType: string; amount: number }>).forEach(item => {
      const expenseType = item.expenseType || 'OTHER';
      const existing = expenseBreakdownMap.get(expenseType) || 0;
      expenseBreakdownMap.set(expenseType, existing + item.amount);
    });

    // Add stock purchases as INVENTORY_PURCHASES
    if (stockExpense > 0) {
      const existing = expenseBreakdownMap.get('INVENTORY_PURCHASES') || 0;
      expenseBreakdownMap.set('INVENTORY_PURCHASES', existing + stockExpense);
    }

    const expenseBreakdown = Object.fromEntries(expenseBreakdownMap);

    // Build top vendors list
    const vendorMap = new Map<string, { amount: number; category: string }>();
    (financialExpenseVendors as any[]).forEach(detail => {
      const vendorName = detail.vendorName || 'Unknown Vendor';
      const existing = vendorMap.get(vendorName) || { amount: 0, category: detail.expenseType || 'OTHER' };
      vendorMap.set(vendorName, {
        amount: existing.amount + Number(detail.transaction?.amount || 0),
        category: existing.category,
      });
    });

    const topVendors = Array.from(vendorMap.entries())
      .map(([vendor, data]) => ({
        vendor,
        amount: data.amount,
        category: data.category,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Calculate previous period for growth comparison
    const currentPeriodDays = startDate && endDate
      ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      : 30;

    const previousPeriodEnd = startDate
      ? new Date(startDate.getTime() - 1)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(
      previousPeriodEnd.getTime() - currentPeriodDays * 24 * 60 * 60 * 1000
    );

    // Get previous period totals
    const [prevFinancialIncome, prevFinancialExpense, prevSalesIncome, prevStockExpense] =
      await Promise.all([
        includeIncome
          ? prisma.financialTransaction.aggregate({
              where: {
                type: 'INCOME',
                status: { in: ['COMPLETED', 'APPROVED'] },
                transactionDate: { gte: previousPeriodStart, lte: previousPeriodEnd },
              },
              _sum: { amount: true },
            })
          : Promise.resolve({ _sum: { amount: null } }),
        includeExpense
          ? prisma.financialTransaction.aggregate({
              where: {
                type: 'EXPENSE',
                status: { in: ['COMPLETED', 'APPROVED'] },
                transactionDate: { gte: previousPeriodStart, lte: previousPeriodEnd },
              },
              _sum: { amount: true },
            })
          : Promise.resolve({ _sum: { amount: null } }),
        includeIncome
          ? prisma.salesTransaction.aggregate({
              where: {
                payment_status: { in: SUCCESSFUL_PAYMENT_STATUSES },
                created_at: { gte: previousPeriodStart, lte: previousPeriodEnd },
              },
              _sum: { total_amount: true },
            })
          : Promise.resolve({ _sum: { total_amount: null } }),
        includeExpense
          ? prisma.stockAddition.aggregate({
              where: {
                purchaseDate: { gte: previousPeriodStart, lte: previousPeriodEnd },
              },
              _sum: { totalCost: true },
            })
          : Promise.resolve({ _sum: { totalCost: null } }),
      ]);

    const prevTotalIncome =
      (Number(prevFinancialIncome._sum.amount) || 0) +
      (Number(prevSalesIncome._sum.total_amount) || 0);
    const prevTotalExpenses =
      (Number(prevFinancialExpense._sum.amount) || 0) +
      (Number(prevStockExpense._sum.totalCost) || 0);

    const revenueGrowth =
      prevTotalIncome > 0
        ? ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100
        : totalIncome > 0
          ? 100
          : 0;

    const expenseGrowth =
      prevTotalExpenses > 0
        ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100
        : totalExpenses > 0
          ? 100
          : 0;

    const analyticsData = {
      summary: {
        totalRevenue: totalIncome,
        totalExpenses,
        netProfit,
        totalTransactions: totalTransactionCount,
        averageTransactionValue,
        topPaymentMethod: topPaymentMethod.name || 'Cash',
        revenueGrowth,
        expenseGrowth,
      },
      charts: {
        paymentMethodDistribution,
        dailyTrends: [], // TODO: Implement daily trends aggregation across all sources
      },
      expenseBreakdown,
      topVendors,
      filters: {
        dateFrom: validatedQuery.dateFrom,
        dateTo: validatedQuery.dateTo,
        type: validatedQuery.type,
        paymentMethod: validatedQuery.paymentMethod,
        groupBy: validatedQuery.groupBy,
      },
      dataSources: {
        includeSales: includeIncome,
        includePurchases: includeExpense,
      },
    };

    return createApiResponse.success(
      analyticsData,
      'Analytics data retrieved successfully'
    );
  } catch (error) {
    logger.error('Error fetching analytics data', {
      error: error instanceof Error ? error.message : String(error),
    });
    return createApiResponse.error(
      'Failed to fetch analytics data',
      500,
      error
    );
  } finally {
    if (process.env.NODE_ENV === 'production') {
      await prisma.$disconnect();
    }
  }
});
