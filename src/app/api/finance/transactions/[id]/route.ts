import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth/roles';
import { prisma } from '@/lib/db';
import { createApiResponse } from '@/lib/api-response';

// GET /api/finance/transactions/[id] - Get specific financial transaction
export const GET = withAuth(
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      // Check if user has permission to read financial transactions
      if (!hasPermission(request.user.role, 'FINANCE_TRANSACTIONS_READ')) {
        return createApiResponse.forbidden(
          'Insufficient permissions to view financial transactions'
        );
      }

      const { id } = await params;
      const transactionId = parseInt(id);

      if (isNaN(transactionId)) {
        return createApiResponse.validationError('Invalid transaction ID');
      }

      // Build where clause based on role
      const whereClause: { id: number; createdBy?: number } = {
        id: transactionId,
      };

      // MANAGER can only see their own transactions
      if (request.user.role === 'MANAGER') {
        whereClause.createdBy = parseInt(request.user.id);
      }

      const transaction = await prisma.financialTransaction.findFirst({
        where: whereClause,
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

      if (!transaction) {
        return createApiResponse.notFound('Financial transaction not found');
      }

      return createApiResponse.success(transaction);
    } catch (error) {
      console.error('Error fetching financial transaction:', error);
      return createApiResponse.internalError('Failed to fetch transaction');
    }
  }
);

// PUT /api/finance/transactions/[id] - Update financial transaction
export const PUT = withAuth(
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      // Check if user has permission to update financial transactions
      if (!hasPermission(request.user.role, 'FINANCE_TRANSACTIONS_CREATE')) {
        return createApiResponse.forbidden(
          'Insufficient permissions to update financial transactions'
        );
      }

      const { id } = await params;
      const transactionId = parseInt(id);

      if (isNaN(transactionId)) {
        return createApiResponse.validationError('Invalid transaction ID');
      }

      const body = await request.json();
      const { updateTransactionSchema } = await import(
        '@/lib/validations/finance'
      );
      const validatedData = updateTransactionSchema.parse(body);

      // Build where clause based on role
      const whereClause: { id: number; createdBy?: number } = {
        id: transactionId,
      };

      // MANAGER can only update their own transactions
      if (request.user.role === 'MANAGER') {
        whereClause.createdBy = parseInt(request.user.id);
      }

      // Get the existing transaction
      const existingTransaction = await prisma.financialTransaction.findFirst({
        where: whereClause,
        include: {
          expenseDetails: true,
          incomeDetails: true,
        },
      });

      if (!existingTransaction) {
        return createApiResponse.notFound('Financial transaction not found');
      }

      // Check if transaction can be updated (not approved/rejected/cancelled)
      if (
        ['APPROVED', 'REJECTED', 'CANCELLED'].includes(
          existingTransaction.status
        )
      ) {
        return createApiResponse.validationError(
          'Cannot update a transaction that is approved, rejected, or cancelled'
        );
      }

      // Use Prisma transaction to ensure data consistency
      const result = await prisma.$transaction(async tx => {
        // Clean up orphaned detail records when type changes
        if (
          validatedData.type &&
          existingTransaction.type !== validatedData.type
        ) {
          if (
            existingTransaction.type === 'EXPENSE' &&
            existingTransaction.expenseDetails
          ) {
            await tx.expenseDetail.delete({
              where: { transactionId },
            });
          }
          if (
            existingTransaction.type === 'INCOME' &&
            existingTransaction.incomeDetails
          ) {
            await tx.incomeDetail.delete({
              where: { transactionId },
            });
          }
        }

        // Update the main transaction
        const transaction = await tx.financialTransaction.update({
          where: { id: transactionId },
          data: {
            type: validatedData.type,
            amount: validatedData.amount,
            description: validatedData.description,
            transactionDate: validatedData.transactionDate
              ? new Date(validatedData.transactionDate)
              : undefined,
            paymentMethod: (validatedData.paymentMethod as any) || null,
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

        // Update expense details if provided
        if (validatedData.type === 'EXPENSE' && validatedData.expenseType) {
          await tx.expenseDetail.upsert({
            where: { transactionId },
            update: {
              expenseType: validatedData.expenseType as any,
              vendorName: validatedData.vendorName,
            },
            create: {
              transactionId,
              expenseType: validatedData.expenseType as any,
              vendorName: validatedData.vendorName,
            },
          });
        }

        // Update income details if provided
        if (validatedData.type === 'INCOME' && validatedData.incomeSource) {
          await tx.incomeDetail.upsert({
            where: { transactionId },
            update: {
              incomeSource: validatedData.incomeSource as any,
              payerName: validatedData.payerName,
            },
            create: {
              transactionId,
              incomeSource: validatedData.incomeSource as any,
              payerName: validatedData.payerName,
            },
          });
        }

        return transaction;
      });

      return createApiResponse.success(
        result,
        'Financial transaction updated successfully'
      );
    } catch (error) {
      console.error('Error updating financial transaction:', error);
      return createApiResponse.internalError('Failed to update transaction');
    }
  }
);

// PATCH /api/finance/transactions/[id] - Update financial transaction (alias for PUT)
export const PATCH = PUT;

// DELETE /api/finance/transactions/[id] - Delete financial transaction (ADMIN only)
export const DELETE = withAuth(
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      // Only ADMIN can delete financial transactions
      if (request.user.role !== 'ADMIN') {
        return createApiResponse.forbidden(
          'Only administrators can delete financial transactions'
        );
      }

      const { id } = await params;
      const transactionId = parseInt(id);

      if (isNaN(transactionId)) {
        return createApiResponse.validationError('Invalid transaction ID');
      }

      // Get the transaction
      const transaction = await prisma.financialTransaction.findUnique({
        where: { id: transactionId },
      });

      if (!transaction) {
        return createApiResponse.notFound('Financial transaction not found');
      }

      // Check if transaction can be deleted (not approved/rejected)
      if (['APPROVED', 'REJECTED'].includes(transaction.status)) {
        return createApiResponse.validationError(
          'Cannot delete a transaction that is approved or rejected'
        );
      }

      // Delete the transaction (cascade will handle related records)
      await prisma.financialTransaction.delete({
        where: { id: transactionId },
      });

      return createApiResponse.success(
        null,
        'Financial transaction deleted successfully'
      );
    } catch (error) {
      console.error('Error deleting financial transaction:', error);
      return createApiResponse.internalError('Failed to delete transaction');
    }
  }
);
