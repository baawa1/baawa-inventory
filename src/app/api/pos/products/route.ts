import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { withPOSAuth, AuthenticatedRequest } from '@/lib/api-auth-middleware';
import { createApiResponse } from '@/lib/api-response';
import { PRODUCT_STATUS, ERROR_MESSAGES, API_LIMITS } from '@/lib/constants';

const getPrimaryImageUrl = (images: unknown): string | null => {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return null;
  }

  const firstImage = images[0];
  if (typeof firstImage === 'string') {
    return firstImage;
  }

  if (typeof firstImage === 'object' && firstImage !== null) {
    const imageObj = firstImage as { url?: string };
    return imageObj.url || null;
  }

  return null;
};

async function handleGetProducts(request: AuthenticatedRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '0'); // 0 means fetch all
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const fieldsParam = searchParams.get('fields')?.trim();
    const usePosFields = fieldsParam === 'pos' || (!fieldsParam && limit === 0);

    // Build where clause
    const whereClause: any = {
      status: PRODUCT_STATUS.ACTIVE,
      // Show all active products, including those with 0 stock
      // stock: {
      //   gt: 0, // Only show products with stock
      // },
    };

    if (category) {
      whereClause.category = {
        name: {
          contains: category,
          mode: 'insensitive',
        },
      };
    }

    if (brand) {
      whereClause.brand = {
        name: {
          contains: brand,
          mode: 'insensitive',
        },
      };
    }

    // Calculate pagination (skip pagination if limit is 0)
    const skip = limit > 0 ? (page - 1) * limit : 0;
    const take =
      limit > 0 ? Math.min(limit, API_LIMITS.MAX_PAGE_SIZE) : undefined;

    let etag: string | null = null;
    if (limit === 0 && usePosFields) {
      const aggregate = await prisma.product.aggregate({
        where: whereClause,
        _count: { _all: true },
        _max: { updatedAt: true },
      });

      const total = aggregate._count._all ?? 0;
      const updatedAt = aggregate._max.updatedAt
        ? aggregate._max.updatedAt.toISOString()
        : '0';

      etag = `W/"pos-products:${total}:${updatedAt}"`;

      const ifNoneMatch = request.headers.get('if-none-match');
      if (ifNoneMatch && ifNoneMatch === etag) {
        const notModified = new NextResponse(null, { status: 304 });
        notModified.headers.set('ETag', etag);
        notModified.headers.set(
          'Cache-Control',
          'private, max-age=0, must-revalidate'
        );
        return notModified;
      }
    }

    let products:
      | Prisma.ProductGetPayload<{
          select: {
            id: true;
            name: true;
            sku: true;
            price: true;
            stock: true;
            images: true;
            updatedAt: true;
            category: { select: { name: true } };
            brand: { select: { name: true } };
          };
        }>[]
      | Prisma.ProductGetPayload<{
          include: {
            category: { select: { id: true; name: true } };
            brand: { select: { id: true; name: true } };
          };
        }>[];

    if (usePosFields) {
      products = await prisma.product.findMany({
        where: whereClause,
        orderBy: [{ name: 'asc' }, { createdAt: 'desc' }],
        skip,
        take,
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
          stock: true,
          images: true,
          updatedAt: true,
          category: {
            select: {
              name: true,
            },
          },
          brand: {
            select: {
              name: true,
            },
          },
        },
      });
    } else {
      products = await prisma.product.findMany({
        where: whereClause,
        orderBy: [{ name: 'asc' }, { createdAt: 'desc' }],
        skip,
        take,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          brand: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    }

    // Format response
    const formattedProducts = products.map(product => {
      if (usePosFields) {
        const posProduct = product as Prisma.ProductGetPayload<{
          select: {
            id: true;
            name: true;
            sku: true;
            price: true;
            stock: true;
            images: true;
            updatedAt: true;
            category: { select: { name: true } };
            brand: { select: { name: true } };
          };
        }>;

        return {
          id: posProduct.id,
          name: posProduct.name,
          sku: posProduct.sku,
          price: posProduct.price,
          stock: posProduct.stock,
          categoryName: posProduct.category?.name || 'Uncategorized',
          brandName: posProduct.brand?.name || 'No Brand',
          primaryImageUrl: getPrimaryImageUrl(posProduct.images),
          updatedAt: posProduct.updatedAt ?? null,
        };
      }

      const fullProduct = product as Prisma.ProductGetPayload<{
        include: {
          category: { select: { id: true; name: true } };
          brand: { select: { id: true; name: true } };
        };
      }>;

      return {
        id: fullProduct.id,
        name: fullProduct.name,
        sku: fullProduct.sku,
        price: fullProduct.price,
        stock: fullProduct.stock,
        status: fullProduct.status,
        category: fullProduct.category?.name || 'Uncategorized',
        brand: fullProduct.brand?.name || 'No Brand',
        description: fullProduct.description,
        images: fullProduct.images,
      };
    });

    // Return products directly if no pagination requested
    if (limit === 0) {
      const response = createApiResponse.success(
        formattedProducts,
        'Products retrieved successfully'
      );

      if (etag) {
        response.headers.set('ETag', etag);
        response.headers.set(
          'Cache-Control',
          'private, max-age=0, must-revalidate'
        );
      }

      return response;
    }

    const totalCount = await prisma.product.count({ where: whereClause });

    return createApiResponse.successWithPagination(
      formattedProducts,
      {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1,
      },
      'Products retrieved successfully'
    );
  } catch (error) {
    console.error('Error fetching products:', error);
    return createApiResponse.internalError(ERROR_MESSAGES.INTERNAL_ERROR);
  }
}

export const GET = withPOSAuth(handleGetProducts);
