import { withAuth, AuthenticatedRequest } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";
import { createApiResponse } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { AuditLogAction } from "@/types/audit";
import { z } from "zod";

const rejectTransactionSchema = z.object({
  reason: z.string().min(1, "Rejection reason is required"),
});

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
        return createApiResponse.validationError("Invalid transaction ID");
      }

      // Check if user has permission to reject (ADMIN or MANAGER)
      if (!["ADMIN", "MANAGER"].includes(request.user.role)) {
        return createApiResponse.forbidden(
          "Insufficient permissions to reject transactions"
        );
      }

      // Parse request body
      const body = await request.json();
      const { reason: _reason } = rejectTransactionSchema.parse(body);

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
        return createApiResponse.notFound("Financial transaction not found");
      }

      // Check if transaction is already rejected
      if (transaction.status === "REJECTED") {
        return createApiResponse.validationError(
          "Transaction is already rejected"
        );
      }

      // Check if transaction is cancelled
      if (transaction.status === "CANCELLED") {
        return createApiResponse.validationError(
          "Cannot reject a cancelled transaction"
        );
      }

      // Update transaction status
      const updatedTransaction = await prisma.financialTransaction.update({
        where: { id: transactionId },
        data: {
          status: "REJECTED",
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
        action: AuditLogAction.SALE_VOIDED, // Using existing action for now
        tableName: "financial_transactions",
        recordId: transactionId,
        oldValues: transaction,
        newValues: updatedTransaction,
      });

      return createApiResponse.success(
        updatedTransaction,
        "Transaction rejected successfully"
      );
    } catch (error) {
      console.error("Error rejecting financial transaction:", error);
      if (error instanceof z.ZodError) {
        return createApiResponse.validationError("Invalid request data");
      }
      return createApiResponse.internalError("Failed to reject transaction");
    }
  }
);
