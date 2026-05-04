import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth/roles';
import { createApiResponse } from '@/lib/api-response';
import {
  buildFinanceRange,
  getManualFinanceOverlapEntries,
} from '@/lib/finance/aggregation';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    if (!hasPermission(request.user.role, 'FINANCIAL_REPORTS')) {
      return createApiResponse.forbidden(
        'Insufficient permissions to view overlap audit'
      );
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const range = buildFinanceRange(
      startDateParam ? new Date(startDateParam) : undefined,
      endDateParam ? new Date(endDateParam) : undefined,
      'year'
    );

    if (
      isNaN(range.startDate.getTime()) ||
      isNaN(range.endDate.getTime()) ||
      range.startDate > range.endDate
    ) {
      return createApiResponse.validationError('Invalid overlap audit date range');
    }

    const entries = await getManualFinanceOverlapEntries(range);
    const totalFlaggedAmount = entries.reduce(
      (sum, entry) => sum + entry.amount,
      0
    );

    const summary = entries.reduce<Record<string, { count: number; amount: number }>>(
      (accumulator, entry) => {
        const current = accumulator[entry.category] || { count: 0, amount: 0 };
        accumulator[entry.category] = {
          count: current.count + 1,
          amount: current.amount + entry.amount,
        };
        return accumulator;
      },
      {}
    );

    return createApiResponse.success({
      dateRange: {
        startDate: range.startDate.toISOString(),
        endDate: range.endDate.toISOString(),
      },
      summary: {
        totalFlaggedEntries: entries.length,
        totalFlaggedAmount,
        categories: summary,
      },
      entries,
    });
  } catch (error) {
    console.error('Error generating finance overlap audit:', error);
    return createApiResponse.internalError('Failed to generate overlap audit');
  }
});
