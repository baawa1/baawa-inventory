import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth/roles';
import { createApiResponse } from '@/lib/api-response';
import { z } from 'zod';
import {
  buildFinanceRange,
  getFinanceAggregate,
  getPreviousFinanceRange,
  getRecentFinanceTransactions,
} from '@/lib/finance/aggregation';
import {
  addFinanceDateRangeIssue,
  getZodErrorMessage,
  optionalFinanceDateInputSchema,
} from '@/lib/finance/query-validation';
import { summarizeCanonicalFinanceAggregate } from '@/lib/finance/metrics';

const summaryQuerySchema = z
  .object({
    startDate: optionalFinanceDateInputSchema,
    endDate: optionalFinanceDateInputSchema,
  })
  .superRefine((value, ctx) => {
    addFinanceDateRangeIssue(value.startDate, value.endDate, ctx);
  });

function mapSummaryBlock(
  metrics: ReturnType<typeof summarizeCanonicalFinanceAggregate>
) {
  return {
    income: metrics.operatingRevenue,
    expenses: metrics.totalExpenses,
    netIncome: metrics.netProfit,
    transactionCount: metrics.totalTransactions,
  };
}

// GET /api/finance/summary - Admin-only finance overview with unified data sources
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    if (!hasPermission(request.user.role, 'FINANCIAL_REPORTS')) {
      return createApiResponse.forbidden(
        'Insufficient permissions to view financial summary'
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const validatedQuery = summaryQuerySchema.parse({
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    });

    const currentRange = buildFinanceRange(
      validatedQuery.startDate,
      validatedQuery.endDate,
      'month'
    );

    const previousRange = getPreviousFinanceRange(currentRange);
    const yearRange = buildFinanceRange(
      new Date(currentRange.endDate.getFullYear(), 0, 1),
      currentRange.endDate,
      'year'
    );

    const [currentMonth, previousMonth, yearToDate, recentTransactions] =
      await Promise.all([
        getFinanceAggregate(currentRange),
        getFinanceAggregate(previousRange),
        getFinanceAggregate(yearRange),
        getRecentFinanceTransactions(10),
      ]);

    const currentMetrics = summarizeCanonicalFinanceAggregate(currentMonth);
    const previousMetrics = summarizeCanonicalFinanceAggregate(previousMonth);
    const yearToDateMetrics = summarizeCanonicalFinanceAggregate(yearToDate);

    return createApiResponse.success({
      currentMonth: mapSummaryBlock(currentMetrics),
      previousMonth: mapSummaryBlock(previousMetrics),
      yearToDate: mapSummaryBlock(yearToDateMetrics),
      recentTransactions: recentTransactions.map(transaction => ({
        id: transaction.id,
        transactionNumber: transaction.transactionNumber,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        transactionDate: transaction.date.toISOString(),
        paymentMethod: transaction.paymentMethod,
        source: transaction.source,
      })),
      dataSources: {
        includeSales: true,
        includePurchases: true,
      },
      dateRange: {
        start: currentRange.startDate.toISOString(),
        end: currentRange.endDate.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiResponse.validationError(
        getZodErrorMessage(error, 'Invalid date parameters'),
        error.issues
      );
    }

    console.error('Error fetching financial summary:', error);
    return createApiResponse.internalError('Failed to fetch financial summary');
  }
});
