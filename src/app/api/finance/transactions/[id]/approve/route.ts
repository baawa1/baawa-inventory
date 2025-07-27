import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { prisma } from '@/lib/db';
import { createApiResponse } from '@/lib/api-response';
import { createAuditLog } from '@/lib/audit';
import { AuditLogAction } from '@/types/audit';

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

      // Check if user has permission to approve (ADMIN or MANAGER)
      if (!['ADMIN', 'MANAGER'].includes(request.user.role)) {
        return createApiResponse.forbidden(
          'Insufficient permissions to approve transactions'
        );
      }

      // Get the transaction
      const transaction = await prisma.financialTransaction.findUnique({
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
        return createApiResponse.notFound('Financial transaction not found');
      }

      // Check if transaction is already approved
      if (transaction.status === 'APPROVED') {
        return createApiResponse.validationError(
          'Transaction is already approved'
        );
      }

      // Check if transaction is cancelled or rejected
      if (
        transaction.status === 'CANCELLED' ||
        transaction.status === 'REJECTED'
      ) {
        return createApiResponse.validationError(
          'Cannot approve a cancelled or rejected transaction'
        );
      }

      // Update transaction status
      const updatedTransaction = await prisma.financialTransaction.update({
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

      // Create audit log
      await createAuditLog({
        userId: parseInt(request.user.id),
        action: AuditLogAction.SALE_CREATED, // Using existing action for now
        tableName: 'financial_transactions',
        recordId: transactionId,
        oldValues: transaction,
        newValues: updatedTransaction,
      });

      return createApiResponse.success(
        updatedTransaction,
        'Transaction approved successfully'
      );
    } catch (error) {
      console.error('Error approving financial transaction:', error);
      return createApiResponse.internalError('Failed to approve transaction');
    }
  }
);
