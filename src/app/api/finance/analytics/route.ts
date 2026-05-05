import { format, startOfMonth, startOfWeek } from 'date-fns';
import { withAuth, type AuthenticatedRequest } from '@/lib/api-middleware';
import { createApiResponse } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { hasPermission } from '@/lib/auth/roles';
import {
  buildFinanceRange,
  getFinanceAggregate,
  getPreviousFinanceRange,
  getReceivablesSnapshot,
  type FinanceGroupBy,
  type NormalizedFinanceTransaction,
} from '@/lib/finance/ledger';
import {
  buildCanonicalFinanceTrends,
  buildOperatingRevenueBySource,
  summarizeCanonicalFinanceAggregate,
} from '@/lib/finance/metrics';
import {
  addFinanceDateRangeIssue,
  getZodErrorMessage,
  nullableOptionalFinanceDateInputSchema,
} from '@/lib/finance/query-validation';
import { EXPENSE_TYPE_LABELS } from '@/lib/constants/finance';

const analyticsQuerySchema = z
  .object({
    dateFrom: nullableOptionalFinanceDateInputSchema,
    dateTo: nullableOptionalFinanceDateInputSchema,
    type: z.enum(['all', 'income', 'expense']).optional().default('all'),
    paymentMethod: z.string().nullable().optional(),
    groupBy: z.enum(['day', 'week', 'month']).optional().default('day'),
  })
  .superRefine((value, ctx) => {
    addFinanceDateRangeIssue(value.dateFrom, value.dateTo, ctx, ['dateTo']);
  });

function percentageChange(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return ((current - previous) / previous) * 100;
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getTrendKey(date: Date, groupBy: FinanceGroupBy) {
  if (groupBy === 'month') {
    return format(startOfMonth(date), 'yyyy-MM-dd');
  }

  if (groupBy === 'week') {
    return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  }

  return format(date, 'yyyy-MM-dd');
}

function buildCashMovementTrends(
  transactions: NormalizedFinanceTransaction[],
  groupBy: FinanceGroupBy
) {
  const trendMap = new Map<
    string,
    {
      cashReceived: number;
      cashSpent: number;
      customerCollections: number;
      manualIncomeCollections: number;
      ownerFunding: number;
      stockPurchases: number;
      operatingExpensePayments: number;
      netCashMovement: number;
    }
  >();

  transactions.forEach(transaction => {
    const key = getTrendKey(transaction.date, groupBy);
    const current = trendMap.get(key) || {
      cashReceived: 0,
      cashSpent: 0,
      customerCollections: 0,
      manualIncomeCollections: 0,
      ownerFunding: 0,
      stockPurchases: 0,
      operatingExpensePayments: 0,
      netCashMovement: 0,
    };

    current.cashReceived += transaction.cashIn;
    current.cashSpent += transaction.cashOut;
    current.netCashMovement += transaction.netCashImpact;

    if (transaction.source === 'POS') {
      current.customerCollections += transaction.cashIn;
    }

    if (transaction.eventType === 'MANUAL_OPERATING_INCOME') {
      current.manualIncomeCollections += transaction.cashIn;
    }

    if (transaction.eventType === 'OWNER_FUNDING_IN') {
      current.ownerFunding += transaction.cashIn;
    }

    if (transaction.eventType === 'STOCK_PURCHASE') {
      current.stockPurchases += transaction.cashOut;
    }

    if (transaction.eventType === 'MANUAL_OPERATING_EXPENSE') {
      current.operatingExpensePayments += transaction.cashOut;
    }

    trendMap.set(key, current);
  });

  return Array.from(trendMap.entries())
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([period, values]) => ({
      period,
      cashReceived: roundCurrency(values.cashReceived),
      cashSpent: roundCurrency(values.cashSpent),
      customerCollections: roundCurrency(values.customerCollections),
      manualIncomeCollections: roundCurrency(values.manualIncomeCollections),
      ownerFunding: roundCurrency(values.ownerFunding),
      stockPurchases: roundCurrency(values.stockPurchases),
      operatingExpensePayments: roundCurrency(values.operatingExpensePayments),
      netCashMovement: roundCurrency(values.netCashMovement),
    }));
}

function calculateHealthScore(
  profitMargin: number,
  netCashMovement: number,
  operatingExpenseRatio: number
) {
  let score = 50;

  if (profitMargin > 20) score += 25;
  else if (profitMargin > 10) score += 15;
  else if (profitMargin > 0) score += 5;
  else score -= 10;

  if (netCashMovement > 0) score += 20;
  else if (netCashMovement < 0) score -= 10;

  if (operatingExpenseRatio < 60) score += 15;
  else if (operatingExpenseRatio < 80) score += 5;
  else if (operatingExpenseRatio > 100) score -= 15;

  return Math.max(0, Math.min(100, score));
}

function getHealthStatus(score: number): 'healthy' | 'monitor' | 'at-risk' {
  if (score >= 75) {
    return 'healthy';
  }

  if (score >= 50) {
    return 'monitor';
  }

  return 'at-risk';
}

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    if (!hasPermission(request.user.role, 'FINANCIAL_ANALYTICS')) {
      return createApiResponse.forbidden(
        'Insufficient permissions to access financial analytics'
      );
    }

    const { searchParams } = new URL(request.url);
    const validatedQuery = analyticsQuerySchema.parse({
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      type: searchParams.get('type') || 'all',
      paymentMethod: searchParams.get('paymentMethod') || undefined,
      groupBy: searchParams.get('groupBy') || 'day',
    });

    const currentRange = buildFinanceRange(
      validatedQuery.dateFrom,
      validatedQuery.dateTo,
      'month'
    );
    const previousRange = getPreviousFinanceRange(currentRange);

    const filters = {
      startDate: currentRange.startDate,
      endDate: currentRange.endDate,
      type: validatedQuery.type,
      paymentMethod:
        validatedQuery.paymentMethod &&
        validatedQuery.paymentMethod !== 'all'
          ? validatedQuery.paymentMethod
          : undefined,
    };

    const previousFilters = {
      startDate: previousRange.startDate,
      endDate: previousRange.endDate,
      type: validatedQuery.type,
      paymentMethod:
        validatedQuery.paymentMethod &&
        validatedQuery.paymentMethod !== 'all'
          ? validatedQuery.paymentMethod
          : undefined,
    };

    const [currentAggregate, previousAggregate, receivablesSnapshot] =
      await Promise.all([
        getFinanceAggregate(filters, {
          groupBy: validatedQuery.groupBy,
        }),
        getFinanceAggregate(previousFilters),
        getReceivablesSnapshot({
          asOfDate: currentRange.endDate,
        }),
      ]);

    const currentMetrics = summarizeCanonicalFinanceAggregate(currentAggregate);
    const previousMetrics = summarizeCanonicalFinanceAggregate(previousAggregate);
    const tradingTrends = buildCanonicalFinanceTrends(
      currentAggregate.transactions,
      validatedQuery.groupBy
    ).map(item => ({
      period: item.date,
      revenue: roundCurrency(item.revenue),
      costOfGoodsSold: roundCurrency(item.costOfGoodsSold),
      grossProfit: roundCurrency(item.grossProfit),
      operatingExpenses: roundCurrency(item.operatingExpenses),
      netProfit: roundCurrency(item.netProfit),
      transactions: item.transactions,
    }));
    const cashTrends = buildCashMovementTrends(
      currentAggregate.transactions,
      validatedQuery.groupBy
    );

    const profitMargin =
      currentMetrics.operatingRevenue > 0
        ? (currentMetrics.netProfit / currentMetrics.operatingRevenue) * 100
        : 0;
    const operatingExpenseRatio =
      currentMetrics.operatingRevenue > 0
        ? (currentMetrics.operatingExpenses / currentMetrics.operatingRevenue) *
          100
        : 0;
    const healthScore = calculateHealthScore(
      profitMargin,
      currentAggregate.cashMovement.netCashMovement,
      operatingExpenseRatio
    );

    const aging = {
      '0-30': { count: 0, amount: 0 },
      '31-60': { count: 0, amount: 0 },
      '61-90': { count: 0, amount: 0 },
      '90+': { count: 0, amount: 0 },
    };

    receivablesSnapshot.receivables.forEach(receivable => {
      aging[receivable.agingBucket].count += 1;
      aging[receivable.agingBucket].amount = roundCurrency(
        aging[receivable.agingBucket].amount + receivable.outstandingAmount
      );
    });

    const topDebtors = receivablesSnapshot.receivables
      .reduce<
        Array<{
          customerName: string;
          totalOwed: number;
          transactionCount: number;
        }>
      >((accumulator, receivable) => {
        const customerName = receivable.customer?.name || 'Walk-in Customer';
        const existing = accumulator.find(item => item.customerName === customerName);

        if (existing) {
          existing.totalOwed = roundCurrency(
            existing.totalOwed + receivable.outstandingAmount
          );
          existing.transactionCount += 1;
          return accumulator;
        }

        accumulator.push({
          customerName,
          totalOwed: roundCurrency(receivable.outstandingAmount),
          transactionCount: 1,
        });
        return accumulator;
      }, [])
      .sort((left, right) => right.totalOwed - left.totalOwed)
      .slice(0, 5);

    const analyticsData = {
      overview: {
        trading: currentAggregate.trading,
        cashMovement: currentAggregate.cashMovement,
        businessPosition: currentAggregate.businessPosition,
        activity: {
          totalTransactions: currentAggregate.summary.totalTransactions,
          averageTransactionValue: roundCurrency(
            currentAggregate.summary.averageTransactionValue
          ),
          topPaymentMethod: currentAggregate.summary.topPaymentMethod,
          revenueGrowth: roundCurrency(
            percentageChange(
              currentMetrics.operatingRevenue,
              previousMetrics.operatingRevenue
            )
          ),
          expenseGrowth: roundCurrency(
            percentageChange(
              currentMetrics.totalExpenses,
              previousMetrics.totalExpenses
            )
          ),
          netProfitGrowth: roundCurrency(
            percentageChange(currentMetrics.netProfit, previousMetrics.netProfit)
          ),
          netCashGrowth: roundCurrency(
            percentageChange(
              currentAggregate.cashMovement.netCashMovement,
              previousAggregate.cashMovement.netCashMovement
            )
          ),
        },
      },
      tradingTrends,
      cashTrends,
      revenueBySource: buildOperatingRevenueBySource(
        currentAggregate.transactions
      ),
      expenseBreakdown: Object.entries(currentAggregate.expenseBreakdown)
        .map(([category, amount]) => ({
          category,
          label:
            category === 'COST_OF_GOODS_SOLD'
              ? 'Cost Of Goods Sold'
              : EXPENSE_TYPE_LABELS[category as keyof typeof EXPENSE_TYPE_LABELS] ||
                category,
          amount: roundCurrency(amount),
        }))
        .sort((left, right) => right.amount - left.amount),
      receivables: {
        summary: {
          totalOutstanding: receivablesSnapshot.summary.totalOutstanding,
          totalTransactions: receivablesSnapshot.summary.totalTransactions,
          averageDaysOutstanding:
            receivablesSnapshot.summary.averageDaysOutstanding,
          customersWithBalances:
            receivablesSnapshot.summary.customersWithBalances,
        },
        aging,
        topDebtors,
      },
      health: {
        profitMargin: roundCurrency(profitMargin),
        operatingExpenseRatio: roundCurrency(operatingExpenseRatio),
        averageTransactionValue: roundCurrency(
          currentAggregate.summary.averageTransactionValue
        ),
        estimatedCashPosition: roundCurrency(
          currentAggregate.cashMovement.netCashMovement
        ),
        healthScore,
        status: getHealthStatus(healthScore),
      },
      methodology: currentAggregate.methodology,
      filters: {
        dateFrom: currentRange.startDate.toISOString(),
        dateTo: currentRange.endDate.toISOString(),
        type: validatedQuery.type,
        paymentMethod:
          validatedQuery.paymentMethod &&
          validatedQuery.paymentMethod !== 'all'
            ? validatedQuery.paymentMethod
            : undefined,
        groupBy: validatedQuery.groupBy,
      },
    };

    return createApiResponse.success(
      analyticsData,
      'Financial analytics retrieved successfully'
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiResponse.validationError(
        getZodErrorMessage(error, 'Invalid analytics query'),
        error.issues
      );
    }

    logger.error('Error fetching financial analytics', {
      error: error instanceof Error ? error.message : String(error),
      userId: request.user?.id,
    });
    return createApiResponse.internalError(
      'Failed to fetch financial analytics'
    );
  }
});
