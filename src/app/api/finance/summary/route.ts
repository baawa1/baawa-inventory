import { withAuth, AuthenticatedRequest } from "@/lib/api-middleware";
import { createApiResponse } from "@/lib/api-response";

// GET /api/finance/summary - Get financial summary statistics
export const GET = withAuth(async (_request: AuthenticatedRequest) => {
  try {
    // For now, return mock data until we resolve the Prisma client issues
    const summary = {
      currentMonth: {
        income: 0,
        expenses: 0,
        netIncome: 0,
      },
      previousMonth: {
        income: 0,
        expenses: 0,
        netIncome: 0,
      },
      yearToDate: {
        income: 0,
        expenses: 0,
        netIncome: 0,
      },
      topCategories: {
        income: [],
        expenses: [],
      },
      recentTransactions: [],
    };

    return createApiResponse.success(summary);
  } catch (error) {
    console.error("Error fetching financial summary:", error);
    return createApiResponse.internalError("Failed to fetch financial summary");
  }
});
