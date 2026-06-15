import { prisma } from '@/lib/db';
import { z } from 'zod';
import { withPOSAuth, AuthenticatedRequest } from '@/lib/api-auth-middleware';
import { PRODUCT_STATUS, API_LIMITS, ERROR_MESSAGES } from '@/lib/constants';
import { createApiResponse } from '@/lib/api-response';

// Validation schema for search parameters
const searchParamsSchema = z.object({
  search: z.string().min(1, 'Search term is required'),
  limit: z
    .string()
    .optional()
    .default(API_LIMITS.PRODUCT_SEARCH_LIMIT.toString()),
  status: z.string().optional().default(PRODUCT_STATUS.ACTIVE),
  category: z.string().optional(),
  brand: z.string().optional(),
});

async function handleSearchProducts(request: AuthenticatedRequest) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const validatedParams = searchParamsSchema.parse({
      search: searchParams.get('search'),
      limit: searchParams.get('limit') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      category: searchParams.get('category') || undefined,
      brand: searchParams.get('brand') || undefined,
    });

    const { search, limit, status, category, brand } = validatedParams;
    const limitNum = parseInt(limit, 10);
    const take =
      limitNum > 0 ? Math.min(limitNum, API_LIMITS.MAX_PAGE_SIZE) : undefined;

    // Build search conditions
    const searchConditions = {
      AND: [
        {
          status: status as
            | 'ACTIVE'
            | 'INACTIVE'
            | 'DISCONTINUED',
        },
        {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
            {
              sku: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
            {
              category: {
                name: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
            },
            {
              brand: {
                name: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
            },
          ],
        },
        ...(category
          ? [
              {
                category: {
                  name: {
                    contains: category,
                    mode: 'insensitive' as const,
                  },
                },
              },
            ]
          : []),
        ...(brand
          ? [
              {
                brand: {
                  name: {
                    contains: brand,
                    mode: 'insensitive' as const,
                  },
                },
              },
            ]
          : []),
      ],
    };

    // Search products
    const products = await prisma.product.findMany({
      where: searchConditions,
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
      orderBy: [
        { stock: 'desc' }, // Show in-stock products first
        { name: 'asc' },
      ],
      take,
    });

    // Format response data
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: undefined,
      price: product.price,
      stock: product.stock,
      status: product.status,
      categoryName: product.category?.name || 'Uncategorized',
      brandName: product.brand?.name || 'No Brand',
      description: product.description,
      images: product.images,
      primaryImageUrl: Array.isArray(product.images)
        ? typeof product.images[0] === 'string'
          ? product.images[0]
          : (product.images[0] as { url?: string } | undefined)?.url || null
        : null,
      updatedAt: product.updatedAt,
    }));

    return createApiResponse.success(
      {
        products: formattedProducts,
        total: formattedProducts.length,
        searchTerm: search,
      },
      `Found ${formattedProducts.length} products matching "${search}"`
    );
  } catch (error) {
    console.error('Error searching products for POS:', error);

    if (error instanceof z.ZodError) {
      return createApiResponse.validationError(
        ERROR_MESSAGES.VALIDATION_ERROR,
        error.errors
      );
    }

    return createApiResponse.internalError(ERROR_MESSAGES.INTERNAL_ERROR);
  }
}

export const GET = withPOSAuth(handleSearchProducts);
