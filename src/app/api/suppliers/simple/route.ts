import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { canViewLowStock } from '@/lib/auth/roles';
import { createApiResponse } from '@/lib/api-response';
import { prisma } from '@/lib/db';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    // Check if user has required permissions
    if (!canViewLowStock(request.user.role)) {
      return createApiResponse.forbidden('Insufficient permissions');
    }

    const suppliers = await prisma.supplier.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return createApiResponse.success(
      suppliers || [],
      'Suppliers retrieved successfully'
    );
  } catch (error) {
    console.error('Error in suppliers API:', error);
    return createApiResponse.internalError('Internal server error');
  }
});
