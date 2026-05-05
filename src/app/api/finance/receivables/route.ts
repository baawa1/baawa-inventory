import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth/roles';
import { createApiResponse } from '@/lib/api-response';
import { z } from 'zod';
import { getReceivablesSnapshot } from '@/lib/finance/ledger';
import {
  buildPositiveIntegerQuerySchema,
  getZodErrorMessage,
} from '@/lib/finance/query-validation';

const receivablesQuerySchema = z.object({
  agingDays: buildPositiveIntegerQuerySchema('Aging days', 90, { max: 3650 }),
});

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    if (!hasPermission(request.user.role, 'FINANCIAL_REPORTS')) {
      return createApiResponse.forbidden(
        'Insufficient permissions to view accounts receivable'
      );
    }

    const { searchParams } = new URL(request.url);
    const { agingDays } = receivablesQuerySchema.parse({
      agingDays: searchParams.get('agingDays') || undefined,
    });

    const now = new Date();
    const cutoffDate = new Date(now.getTime() - agingDays * 24 * 60 * 60 * 1000);
    const snapshot = await getReceivablesSnapshot({
      asOfDate: now,
      agingStartDate: cutoffDate,
    });
    const receivables = snapshot.receivables;

    // Calculate aging summary
    const agingSummary = {
      '0-30': { count: 0, amount: 0 },
      '31-60': { count: 0, amount: 0 },
      '61-90': { count: 0, amount: 0 },
      '90+': { count: 0, amount: 0 },
    };

    receivables.forEach(r => {
      agingSummary[r.agingBucket].count++;
      agingSummary[r.agingBucket].amount += r.outstandingAmount;
    });

    const totalOutstanding = snapshot.summary.totalOutstanding;
    const totalTransactions = snapshot.summary.totalTransactions;

    const customerDebt = new Map<
      string,
      { customer: { name?: string | null; id?: number }; totalOwed: number; transactionCount: number }
    >();

    receivables.forEach(r => {
      const customerData = r.customer as { name?: string | null; id?: number };
      const customerId = customerData?.id?.toString() || 'walk-in';
      const existing = customerDebt.get(customerId) || {
        customer: customerData,
        totalOwed: 0,
        transactionCount: 0,
      };
      existing.totalOwed += r.outstandingAmount;
      existing.transactionCount++;
      customerDebt.set(customerId, existing);
    });

    const topDebtors = Array.from(customerDebt.values())
      .sort((a, b) => b.totalOwed - a.totalOwed)
      .slice(0, 10);

    // Estimate collection probability based on aging
    const collectionProbability =
      totalOutstanding > 0
        ? (agingSummary['0-30'].amount * 0.95 +
            agingSummary['31-60'].amount * 0.8 +
            agingSummary['61-90'].amount * 0.6 +
            agingSummary['90+'].amount * 0.3) /
          totalOutstanding
        : 1;

    return createApiResponse.success(
      {
        receivables: receivables.slice(0, 100), // Limit response size
        summary: {
          totalOutstanding: Math.round(totalOutstanding * 100) / 100,
          totalTransactions,
          averageDaysOutstanding: snapshot.summary.averageDaysOutstanding,
          estimatedCollectable:
            Math.round(totalOutstanding * collectionProbability * 100) / 100,
          collectionProbability: Math.round(collectionProbability * 100),
          customersWithBalances: snapshot.summary.customersWithBalances,
        },
        aging: agingSummary,
        topDebtors,
        dateRange: {
          from: cutoffDate.toISOString(),
          to: now.toISOString(),
        },
      },
      'Accounts receivable data retrieved successfully'
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiResponse.validationError(
        getZodErrorMessage(error, 'Invalid receivables query'),
        error.issues
      );
    }

    console.error('Error fetching accounts receivable:', error);
    return createApiResponse.internalError('Failed to fetch accounts receivable');
  }
});
