import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { prisma } from '@/lib/db';
import { createApiResponse } from '@/lib/api-response';
import { createAuditLog } from '@/lib/audit';
import { AuditLogAction } from '@/types/audit';
import { z } from 'zod';

const rejectTransactionSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required'),
});

class FinanceRejectionError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

// POST /api/finance/transactions/[id]/reject - Reject financial transaction
export const POST = withAuth(
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await params;
      const transactionId = parseInt(id);

      if (isNaN(transactionId)) {
        return createApiResponse.validationError('Invalid transaction ID');
      }

      // Check if user has permission to reject (ADMIN or MANAGER)
      if (!['ADMIN', 'MANAGER'].includes(request.user.role)) {
        return createApiResponse.forbidden(
          'Insufficient permissions to reject transactions'
        );
      }

      // Parse request body
      const body = await request.json();
      const { reason } = rejectTransactionSchema.parse(body);

      const updatedTransaction = await prisma.$transaction(async tx => {
        const transaction = await tx.financialTransaction.findUnique({
          where: { id: transactionId },
          include: {
            createdByUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            expenseDetails: true,
            incomeDetails: true,
          },
        });

        if (!transaction) {
          throw new FinanceRejectionError(
            404,
            'Financial transaction not found'
          );
        }

        if (transaction.status === 'REJECTED') {
          throw new FinanceRejectionError(
            400,
            'Transaction is already rejected'
          );
        }

        if (transaction.status === 'CANCELLED') {
          throw new FinanceRejectionError(
            400,
            'Cannot reject a cancelled transaction'
          );
        }

        const nextTransaction = await tx.financialTransaction.update({
          where: { id: transactionId },
          data: {
            status: 'REJECTED',
            approvedBy: parseInt(request.user.id),
            approvedAt: new Date(),
            rejectionReason: reason,
          },
          include: {
            createdByUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            approvedByUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            expenseDetails: true,
            incomeDetails: true,
          },
        });

        await createAuditLog({
          tx,
          userId: parseInt(request.user.id),
          action: AuditLogAction.FINANCE_TRANSACTION_REJECTED,
          tableName: 'financial_transactions',
          recordId: transactionId,
          oldValues: transaction,
          newValues: nextTransaction,
        });

        return nextTransaction;
      });

      return createApiResponse.success(
        updatedTransaction,
        'Transaction rejected successfully'
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return createApiResponse.validationError('Invalid request data');
      }

      if (error instanceof FinanceRejectionError) {
        if (error.status === 404) {
          return createApiResponse.notFound(error.message);
        }

        return createApiResponse.validationError(error.message);
      }

      console.error('Error rejecting financial transaction:', error);
      return createApiResponse.internalError('Failed to reject transaction');
    }
  }
);
