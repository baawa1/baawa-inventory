import { withAuth, AuthenticatedRequest } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";
import { createApiResponse } from "@/lib/api-response";

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
// Temporarily disabled due to schema changes
export const PUT = withAuth(
  async (
    _request: AuthenticatedRequest,
    { params: _params }: { params: Promise<{ id: string }> }
  ) => {
    return createApiResponse.internalError(
      "Update functionality temporarily disabled"
    );
  }
);

// DELETE /api/finance/transactions/[id] - Delete financial transaction
// Temporarily disabled due to schema changes
export const DELETE = withAuth(
  async (
    _request: AuthenticatedRequest,
    { params: _params }: { params: Promise<{ id: string }> }
  ) => {
    return createApiResponse.internalError(
      "Delete functionality temporarily disabled"
    );
  }
);
