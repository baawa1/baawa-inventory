import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { createApiResponse } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import {
  clampDashboardRecentTransactionLimit,
  getDashboardInventoryHealth,
  getDashboardQuickActions,
  getDashboardRecentTransactions,
} from '@/lib/dashboard/data';
import type { DashboardOperationsResponse } from '@/types/dashboard';

// GET /api/dashboard/operations - Live operational dashboard data
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const requestedLimit = Number.parseInt(
      searchParams.get('limit') || '',
      10
    );
    const limit = clampDashboardRecentTransactionLimit(requestedLimit);

    const [inventoryHealth, recentTransactions] = await Promise.all([
      getDashboardInventoryHealth(),
      getDashboardRecentTransactions(limit),
    ]);

    const response: DashboardOperationsResponse = {
      inventoryHealth,
      recentTransactions,
      quickActions: getDashboardQuickActions(request.user.role),
    };

    return createApiResponse.success(
      response,
      'Dashboard operations retrieved successfully'
    );
  } catch (error) {
    logger.error('Error fetching dashboard operations', {
      error: error instanceof Error ? error.message : String(error),
      userId: request.user.id,
    });
    return createApiResponse.internalError(
      'Failed to fetch dashboard operations'
    );
  }
});
