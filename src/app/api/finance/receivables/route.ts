import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth/roles';
import { createApiResponse } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { normalizePaymentMethodForStorage } from '@/lib/utils/payment-methods';

// Payment statuses that indicate money is still owed
const UNPAID_STATUSES = ['PENDING', 'PARTIAL', 'pending', 'partial'];

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    if (!hasPermission(request.user.role, 'FINANCE_TRANSACTIONS_READ')) {
      return createApiResponse.forbidden(
        'Insufficient permissions to view accounts receivable'
      );
    }

    const { searchParams } = new URL(request.url);
    const agingDays = parseInt(searchParams.get('agingDays') || '90');

    const now = new Date();
    const cutoffDate = new Date(now.getTime() - agingDays * 24 * 60 * 60 * 1000);

    // Get all unpaid/partial sales transactions
    const unpaidSales = await prisma.salesTransaction.findMany({
      where: {
        payment_status: { in: UNPAID_STATUSES },
        created_at: { gte: cutoffDate },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        transaction_payments: {
          select: {
            amount: true,
            payment_date: true,
            payment_method: true,
          },
        },
        split_payments: {
          select: {
            amount: true,
            payment_method: true,
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    // Calculate amounts and aging
    const receivables = unpaidSales.map(sale => {
      const totalAmount = Number(sale.total_amount);
      const ledgerPaidAmount = sale.transaction_payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      const splitPaidAmount = sale.split_payments.reduce(
        (sum, payment) => {
          const method = normalizePaymentMethodForStorage(
            payment.payment_method
          );
          if (method === 'debt') {
            return sum;
          }
          return sum + Number(payment.amount);
        },
        0
      );
      const paidAmount = ledgerPaidAmount + splitPaidAmount;
      const outstandingAmount = totalAmount - paidAmount;
      const saleDate = new Date(sale.created_at!);
      const daysOutstanding = Math.floor(
        (now.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      let agingBucket: '0-30' | '31-60' | '61-90' | '90+';
      if (daysOutstanding <= 30) agingBucket = '0-30';
      else if (daysOutstanding <= 60) agingBucket = '31-60';
      else if (daysOutstanding <= 90) agingBucket = '61-90';
      else agingBucket = '90+';

      return {
        id: sale.id,
        transactionNumber: sale.transaction_number,
        customer: sale.customer || { name: 'Walk-in Customer' },
        saleDate: sale.created_at,
        totalAmount,
        paidAmount,
        outstandingAmount,
        daysOutstanding,
        agingBucket,
        paymentStatus: sale.payment_status,
        createdBy: sale.users,
        payments: sale.transaction_payments,
      };
    });

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

    // Calculate totals
    const totalOutstanding = receivables.reduce(
      (sum, r) => sum + r.outstandingAmount,
      0
    );
    const totalTransactions = receivables.length;

    // Get top debtors
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

    // Calculate average days outstanding
    const avgDaysOutstanding =
      receivables.length > 0
        ? receivables.reduce((sum, r) => sum + r.daysOutstanding, 0) /
          receivables.length
        : 0;

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
          averageDaysOutstanding: Math.round(avgDaysOutstanding),
          estimatedCollectable:
            Math.round(totalOutstanding * collectionProbability * 100) / 100,
          collectionProbability: Math.round(collectionProbability * 100),
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
    console.error('Error fetching accounts receivable:', error);
    return createApiResponse.internalError('Failed to fetch accounts receivable');
  }
});
