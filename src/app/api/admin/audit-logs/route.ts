import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { withPermission, AuthenticatedRequest } from '@/lib/api-middleware';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  userId: z.string().trim().max(20).optional(),
  action: z.string().trim().max(100).optional(),
  search: z.string().trim().max(200).optional(),
  from: z.string().trim().max(32).optional(),
  to: z.string().trim().max(32).optional(),
  sortBy: z
    .enum(['created_at', 'action', 'table_name', 'user_id'])
    .default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const STRICT_INTEGER_PATTERN = /^\d+$/;

class AuditLogQueryError extends Error {}

function parseStrictIntegerFilter(
  value: string | undefined,
  fieldName: string
): number | undefined {
  if (!value) {
    return undefined;
  }

  if (!STRICT_INTEGER_PATTERN.test(value)) {
    throw new AuditLogQueryError(`Invalid ${fieldName} filter`);
  }

  return Number.parseInt(value, 10);
}

function parseDateBoundary(value: string, boundary: 'start' | 'end'): Date {
  const normalizedValue = value.includes('T')
    ? value
    : `${value}${boundary === 'start' ? 'T00:00:00.000Z' : 'T23:59:59.999Z'}`;
  const parsedDate = new Date(normalizedValue);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new AuditLogQueryError(`Invalid date value: ${value}`);
  }

  return parsedDate;
}

export const GET = withPermission(
  ['ADMIN'],
  async function (request: AuthenticatedRequest) {
    try {
      const query = auditLogQuerySchema.parse(
        Object.fromEntries(new URL(request.url).searchParams.entries())
      );
      const {
        page,
        limit,
        userId,
        action,
        search,
        from,
        to,
        sortBy,
        sortOrder,
      } = query;

      const filters: Prisma.AuditLogWhereInput[] = [];
      const parsedUserId = parseStrictIntegerFilter(userId, 'userId');

      if (typeof parsedUserId === 'number') {
        filters.push({ user_id: parsedUserId });
      }

      if (action) {
        filters.push({
          action: {
            contains: action,
            mode: 'insensitive',
          },
        });
      }

      if (from || to) {
        const createdAtFilter: Prisma.DateTimeNullableFilter<'AuditLog'> = {};
        let fromDate: Date | undefined;
        let toDate: Date | undefined;

        if (from) {
          fromDate = parseDateBoundary(from, 'start');
          createdAtFilter.gte = fromDate;
        }

        if (to) {
          toDate = parseDateBoundary(to, 'end');
          createdAtFilter.lte = toDate;
        }

        if (fromDate && toDate && fromDate > toDate) {
          throw new AuditLogQueryError(
            'Invalid date range: from must be before or equal to to'
          );
        }

        filters.push({
          created_at: createdAtFilter,
        });
      }

      if (search) {
        const searchFilters: Prisma.AuditLogWhereInput[] = [
          {
            action: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            table_name: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            user_agent: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            ip_address: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            users: {
              is: {
                OR: [
                  {
                    email: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                  {
                    firstName: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                  {
                    lastName: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                ],
              },
            },
          },
        ];

        if (STRICT_INTEGER_PATTERN.test(search)) {
          const numericSearch = Number.parseInt(search, 10);
          searchFilters.push({ record_id: numericSearch });
          searchFilters.push({ user_id: numericSearch });
        }

        filters.push({ OR: searchFilters });
      }

      const where: Prisma.AuditLogWhereInput =
        filters.length > 0 ? { AND: filters } : {};
      const orderBy: Prisma.AuditLogOrderByWithRelationInput = {
        [sortBy]: sortOrder,
      };
      const skip = (page - 1) * limit;

      const [logs, totalCount] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            users: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.auditLog.count({ where }),
      ]);

      return NextResponse.json({
        logs,
        totalPages: Math.max(1, Math.ceil(totalCount / limit)),
        totalCount,
        currentPage: page,
      });
    } catch (error) {
      if (error instanceof z.ZodError || error instanceof AuditLogQueryError) {
        return NextResponse.json(
          {
            error:
              error instanceof AuditLogQueryError
                ? error.message
                : 'Invalid query parameters',
          },
          { status: 400 }
        );
      }

      logger.error('Failed to fetch audit logs', {
        error: error instanceof Error ? error.message : String(error),
        userId: request.user.id,
      });

      return NextResponse.json(
        { error: 'Failed to fetch audit logs' },
        { status: 500 }
      );
    }
  }
);
