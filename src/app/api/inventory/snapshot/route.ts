import { NextResponse } from 'next/server';
import {
  withPermission,
  type AuthenticatedRequest,
} from '@/lib/api-middleware';
import { handleApiError } from '@/lib/api-error-handler-new';
import { prisma } from '@/lib/db';
import { USER_ROLES } from '@/lib/auth/roles';
import { Prisma, ProductStatus } from '@prisma/client';

const DEFAULT_PAGE_SIZE = 200;
const MAX_PAGE_SIZE = 1000;

export const GET = withPermission(
  [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  async (request: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(request.url);

      const categoryIdsParam = searchParams.get('categoryIds');
      const statusParam = searchParams.get('status') || 'ACTIVE';
      const includeZeroParam = searchParams.get('includeZero');
      const includeZero = includeZeroParam ? includeZeroParam === 'true' : true;
      const limitParam = searchParams.get('limit');
      const cursorParam = searchParams.get('cursor');

      const limitCandidate = limitParam ? parseInt(limitParam, 10) : undefined;
      const take = Math.min(
        Math.max(limitCandidate || DEFAULT_PAGE_SIZE, 1),
        MAX_PAGE_SIZE
      );

      const categoryIds = categoryIdsParam
        ? categoryIdsParam
            .split(',')
            .map(id => parseInt(id, 10))
            .filter(id => !Number.isNaN(id))
        : [];

      const where: Prisma.ProductWhereInput = {
        isArchived: false,
        isService: false,
      };

      if (statusParam && statusParam !== 'ALL') {
        where.status = statusParam as ProductStatus;
      }

      if (!includeZero) {
        where.stock = { gt: 0 };
      }

      if (categoryIds.length > 0) {
        where.categoryId = { in: categoryIds };
      }

      const baseArgs = {
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { id: 'asc' },
        take: take + 1,
      } satisfies Prisma.ProductFindManyArgs;

      let cursorArgs: Pick<Prisma.ProductFindManyArgs, 'cursor' | 'skip'> = {};
      if (cursorParam) {
        const cursorId = parseInt(cursorParam, 10);
        if (!Number.isNaN(cursorId)) {
          cursorArgs = {
            cursor: { id: cursorId },
            skip: 1,
          };
        }
      }

      type ProductWithCategory = Prisma.ProductGetPayload<typeof baseArgs>;

      const products = (await prisma.product.findMany({
        ...baseArgs,
        ...cursorArgs,
      })) as ProductWithCategory[];

      let nextCursor: number | null = null;
      if (products.length > take) {
        const nextItem = products.pop();
        nextCursor = nextItem?.id ?? null;
      }

      const payload = products.map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        systemCount: product.stock,
        physicalCount: product.stock,
        cost: product.cost ? Number(product.cost) : 0,
        minStock: product.minStock,
        category: product.category
          ? { id: product.category.id, name: product.category.name }
          : null,
      }));

      return NextResponse.json({
        success: true,
        data: payload,
        pagination: {
          limit: take,
          nextCursor,
        },
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);
