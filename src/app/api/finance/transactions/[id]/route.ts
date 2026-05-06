import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth/roles';
import { prisma } from '@/lib/db';
import { createApiResponse } from '@/lib/api-response';
import { createAuditLog } from '@/lib/audit';
import { AuditLogAction } from '@/types/audit';
import { z } from 'zod';
import {
  attachFinancialTransactionNames,
  isFinancialTransactionMutable,
} from '@/lib/finance/transaction-access';

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
        return createApiResponse.notFound('Financial transaction');
      }

      return createApiResponse.success(
        attachFinancialTransactionNames(transaction)
      );
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

      const whereClause: { id: number; createdBy?: number } = {
        id: transactionId,
      };

      if (validatedData.id !== transactionId) {
        return createApiResponse.validationError(
          'Transaction ID mismatch'
        );
      }

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
        return createApiResponse.notFound('Financial transaction');
      }

      const effectiveType = validatedData.type ?? existingTransaction.type;

      // Current workflow only treats mutable manual states as editable.
      if (!isFinancialTransactionMutable(existingTransaction.status)) {
        return createApiResponse.validationError(
          'Cannot update a transaction that is no longer editable'
        );
      }

      const nextPaymentMethod =
        validatedData.paymentMethod === undefined
          ? undefined
          : (validatedData.paymentMethod as any);
      const nextExpenseType =
        validatedData.expenseType ?? existingTransaction.expenseDetails?.expenseType;
      const nextVendorName =
        validatedData.vendorName === undefined
          ? existingTransaction.expenseDetails?.vendorName
          : validatedData.vendorName;
      const nextIncomeSource =
        validatedData.incomeSource ?? existingTransaction.incomeDetails?.incomeSource;
      const nextPayerName =
        validatedData.payerName === undefined
          ? existingTransaction.incomeDetails?.payerName
          : validatedData.payerName;

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
        await tx.financialTransaction.update({
          where: { id: transactionId },
          data: {
            type: validatedData.type,
            amount: validatedData.amount,
            description: validatedData.description,
            transactionDate: validatedData.transactionDate
              ? new Date(validatedData.transactionDate)
              : undefined,
            paymentMethod: nextPaymentMethod,
          },
        });

        // Preserve existing detail values during partial updates.
        if (
          effectiveType === 'EXPENSE' &&
          nextExpenseType !== undefined
        ) {
          await tx.expenseDetail.upsert({
            where: { transactionId },
            update: {
              expenseType: nextExpenseType as any,
              vendorName: nextVendorName,
            },
            create: {
              transactionId,
              expenseType: nextExpenseType as any,
              vendorName: nextVendorName,
            },
          });
        }

        if (
          effectiveType === 'INCOME' &&
          nextIncomeSource !== undefined
        ) {
          await tx.incomeDetail.upsert({
            where: { transactionId },
            update: {
              incomeSource: nextIncomeSource as any,
              payerName: nextPayerName,
            },
            create: {
              transactionId,
              incomeSource: nextIncomeSource as any,
              payerName: nextPayerName,
            },
          });
        }

        // Re-fetch the complete transaction with all updated details
        const updatedTransaction = await tx.financialTransaction.findUnique({
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
          action: AuditLogAction.FINANCE_TRANSACTION_UPDATED,
          tableName: 'financial_transactions',
          recordId: transactionId,
          oldValues: existingTransaction,
          newValues: updatedTransaction,
        });

        return updatedTransaction
          ? attachFinancialTransactionNames(updatedTransaction)
          : updatedTransaction;
      });

      return createApiResponse.success(
        result,
        'Financial transaction updated successfully'
      );
    } catch (error) {
      console.error('Error updating financial transaction:', error);
      if (error instanceof z.ZodError) {
        return createApiResponse.validationError(
          'Invalid request data',
          error.errors
        );
      }
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
      if (!hasPermission(request.user.role, 'FINANCE_DELETE')) {
        return createApiResponse.forbidden(
          'Only administrators can delete financial transactions'
        );
      }

      const { id } = await params;
      const body = await request.json().catch(() => ({}));
      const reason =
        typeof body?.reason === 'string' ? body.reason.trim() : '';
      const transactionId = parseInt(id);
      const userId = parseInt(request.user.id);

      if (isNaN(transactionId)) {
        return createApiResponse.validationError('Invalid transaction ID');
      }

      if (!reason) {
        return createApiResponse.validationError('Delete reason is required');
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
        return createApiResponse.notFound('Financial transaction');
      }

      const deletedAt = new Date();

      const deletedTransaction = await prisma.$transaction(async tx => {
        await createAuditLog({
          tx,
          userId,
          action: AuditLogAction.FINANCE_TRANSACTION_DELETED,
          tableName: 'financial_transactions',
          recordId: transactionId,
          oldValues: transaction,
          newValues: {
            deleted: true,
            deletedAt: deletedAt.toISOString(),
            deletedBy: userId,
            reason,
            transactionNumber: transaction.transactionNumber,
            type: transaction.type,
          },
        });

        await tx.financialTransaction.delete({
          where: { id: transactionId },
        });

        return {
          id: transaction.id,
          transactionNumber: transaction.transactionNumber,
          type: transaction.type,
          deletedAt,
          deletedBy: userId,
          reason,
        };
      });

      return createApiResponse.success(
        deletedTransaction,
        'Financial transaction deleted successfully'
      );
    } catch (error) {
      console.error('Error deleting financial transaction:', error);
      return createApiResponse.internalError('Failed to delete transaction');
    }
  }
);
