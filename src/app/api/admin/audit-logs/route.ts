import { NextResponse } from 'next/server';
import { withPermission, AuthenticatedRequest } from '@/lib/api-middleware';
import { handleApiError } from '@/lib/api-error-handler-new';
import { prisma } from '@/lib/db';
import { USER_ROLES } from '@/lib/auth/roles';
import { AUDIT_ACTIONS_TO_FILTER } from '@/lib/constants/audit';

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

      // Filter to show only meaningful admin activities (exclude login/logout)
      where.action = {
        notIn: AUDIT_ACTIONS_TO_FILTER,
      };

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
        logs,
        totalPages: Math.ceil(total / limit),
        totalCount: total,
        currentPage: page,
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);
