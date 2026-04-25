import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { prisma } from '@/lib/db';
import { createApiResponse } from '@/lib/api-response';
import { createAuditLog } from '@/lib/audit';
import { AuditLogAction } from '@/types/audit';

class FinanceApprovalError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

// POST /api/finance/transactions/[id]/approve - Approve financial transaction
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

      // Check if user has permission to approve (ADMIN only)
      if (request.user.role !== 'ADMIN') {
        return createApiResponse.forbidden(
          'Only administrators can approve financial transactions'
        );
      }

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
          throw new FinanceApprovalError(
            404,
            'Financial transaction not found'
          );
        }

        if (transaction.status === 'APPROVED') {
          throw new FinanceApprovalError(
            400,
            'Transaction is already approved'
          );
        }

        if (
          transaction.status === 'CANCELLED' ||
          transaction.status === 'REJECTED'
        ) {
          throw new FinanceApprovalError(
            400,
            'Cannot approve a cancelled or rejected transaction'
          );
        }

        const nextTransaction = await tx.financialTransaction.update({
          where: { id: transactionId },
          data: {
            status: 'APPROVED',
            approvedBy: parseInt(request.user.id),
            approvedAt: new Date(),
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
          action: AuditLogAction.FINANCE_TRANSACTION_APPROVED,
          tableName: 'financial_transactions',
          recordId: transactionId,
          oldValues: transaction,
          newValues: nextTransaction,
        });

        return nextTransaction;
      });

      return createApiResponse.success(
        updatedTransaction,
        'Transaction approved successfully'
      );
    } catch (error) {
      if (error instanceof FinanceApprovalError) {
        if (error.status === 404) {
          return createApiResponse.notFound(error.message);
        }

        return createApiResponse.validationError(error.message);
      }

      console.error('Error approving financial transaction:', error);
      return createApiResponse.internalError('Failed to approve transaction');
    }
  }
);
