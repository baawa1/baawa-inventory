import { NextResponse } from 'next/server';
import { withPermission, AuthenticatedRequest } from '@/lib/api-middleware';
import { handleApiError } from '@/lib/api-error-handler-new';
import { prisma } from '@/lib/db';
import { USER_ROLES } from '@/lib/auth/roles';

export const GET = withPermission(
  [USER_ROLES.ADMIN],
  async (request: AuthenticatedRequest) => {
    try {
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1', 10);
      const limit = parseInt(url.searchParams.get('limit') || '20', 10);
      const userId = url.searchParams.get('userId');
      const action = url.searchParams.get('action');
      const success = url.searchParams.get('success');
      const from = url.searchParams.get('from');
      const to = url.searchParams.get('to');

      const where: any = {};
      if (userId) where.user_id = parseInt(userId, 10);
      if (action) where.action = action;
      if (success !== null && success !== undefined)
        where.success = success === 'true';
      if (from || to) {
        where.created_at = {};
        if (from) where.created_at.gte = new Date(from);
        if (to) where.created_at.lte = new Date(to);
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            action: true,
            user_id: true,
            users: { select: { email: true, firstName: true, lastName: true } },
            table_name: true,
            record_id: true,
            ip_address: true,
            user_agent: true,
            created_at: true,
            old_values: true,
            new_values: true,
          },
        }),
        prisma.auditLog.count({ where }),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          logs,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page < Math.ceil(total / limit),
            hasPreviousPage: page > 1,
          },
        },
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);
