import { withAuth, AuthenticatedRequest } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";
import { updateTransactionSchema } from "@/lib/validations/finance";
import { createApiResponse } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { AuditLogAction } from "@/types/audit";

// GET /api/finance/transactions/[id] - Get specific financial transaction
export const GET = withAuth(
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await params;
      const transactionId = parseInt(id);

      if (isNaN(transactionId)) {
        return createApiResponse.internalError("Invalid transaction ID");
      }

      const transaction = await prisma.financialTransaction.findUnique({
        where: { id: transactionId },
        include: {
          category: true,
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
        return createApiResponse.internalError(
          "Financial transaction not found"
        );
      }

      return createApiResponse.success(transaction);
    } catch (error) {
      console.error("Error fetching financial transaction:", error);
      return createApiResponse.internalError("Failed to fetch transaction");
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
      const { id } = await params;
      const transactionId = parseInt(id);
      const body = await request.json();

      if (isNaN(transactionId)) {
        return createApiResponse.internalError("Invalid transaction ID");
      }

      // Get existing transaction for audit log
      const existingTransaction = await prisma.financialTransaction.findUnique({
        where: { id: transactionId },
        include: {
          category: true,
          expenseDetails: true,
          incomeDetails: true,
        },
      });

      if (!existingTransaction) {
        return createApiResponse.internalError(
          "Financial transaction not found"
        );
      }

      const validatedData = updateTransactionSchema.parse(body);

      // Use Prisma transaction to ensure data consistency
      await prisma.$transaction(async (tx) => {
        // Update the main transaction
        await tx.financialTransaction.update({
          where: { id: transactionId },
          data: {
            type: validatedData.type,
            categoryId: validatedData.categoryId,
            amount: validatedData.amount,
            currency: validatedData.currency,
            description: validatedData.description,
            transactionDate: validatedData.transactionDate,
            status: validatedData.status,
            referenceNumber: validatedData.referenceNumber,
          },
        });

        // Update expense details if provided
        if (
          validatedData.expenseDetails &&
          existingTransaction.expenseDetails
        ) {
          await tx.expenseDetail.update({
            where: { transactionId },
            data: {
              expenseType: validatedData.expenseDetails.expenseType,
              vendorName: validatedData.expenseDetails.vendorName,
              vendorContact: validatedData.expenseDetails.vendorContact,
              taxAmount: validatedData.expenseDetails.taxAmount,
              taxRate: validatedData.expenseDetails.taxRate,
              receiptUrl: validatedData.expenseDetails.receiptUrl,
              notes: validatedData.expenseDetails.notes,
            },
          });
        }

        // Update income details if provided
        if (validatedData.incomeDetails && existingTransaction.incomeDetails) {
          await tx.incomeDetail.update({
            where: { transactionId },
            data: {
              incomeSource: validatedData.incomeDetails.incomeSource,
              payerName: validatedData.incomeDetails.payerName,
              payerContact: validatedData.incomeDetails.payerContact,
              taxWithheld: validatedData.incomeDetails.taxWithheld,
              taxRate: validatedData.incomeDetails.taxRate,
              receiptUrl: validatedData.incomeDetails.receiptUrl,
              notes: validatedData.incomeDetails.notes,
            },
          });
        }
      });

      // Get complete updated transaction
      const completeTransaction = await prisma.financialTransaction.findUnique({
        where: { id: transactionId },
        include: {
          category: true,
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

      // Create audit log
      await createAuditLog({
        userId: parseInt(request.user.id),
        action: AuditLogAction.SALE_UPDATED,
        tableName: "financial_transactions",
        recordId: transactionId,
        oldValues: existingTransaction,
        newValues: completeTransaction,
      });

      return createApiResponse.success(
        completeTransaction,
        "Transaction updated successfully"
      );
    } catch (error) {
      console.error("Error updating financial transaction:", error);
      return createApiResponse.internalError("Failed to update transaction");
    }
  },
  {
    roles: ["ADMIN", "MANAGER"],
    permission: "FINANCE_TRANSACTIONS",
  }
);

// DELETE /api/finance/transactions/[id] - Delete financial transaction
export const DELETE = withAuth(
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await params;
      const transactionId = parseInt(id);

      if (isNaN(transactionId)) {
        return createApiResponse.internalError("Invalid transaction ID");
      }

      // Get existing transaction for audit log
      const existingTransaction = await prisma.financialTransaction.findUnique({
        where: { id: transactionId },
        include: {
          category: true,
          expenseDetails: true,
          incomeDetails: true,
        },
      });

      if (!existingTransaction) {
        return createApiResponse.internalError(
          "Financial transaction not found"
        );
      }

      // Delete the transaction (cascade will handle related records)
      await prisma.financialTransaction.delete({
        where: { id: transactionId },
      });

      // Create audit log
      await createAuditLog({
        userId: parseInt(request.user.id),
        action: AuditLogAction.SALE_DELETED,
        tableName: "financial_transactions",
        recordId: transactionId,
        oldValues: existingTransaction,
      });

      return createApiResponse.success(
        null,
        "Transaction deleted successfully"
      );
    } catch (error) {
      console.error("Error deleting financial transaction:", error);
      return createApiResponse.internalError("Failed to delete transaction");
    }
  },
  {
    roles: ["ADMIN"],
    permission: "FINANCE_TRANSACTIONS",
  }
);
