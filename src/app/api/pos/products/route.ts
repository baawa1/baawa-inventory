import { prisma } from '@/lib/db';
import { withPOSAuth, AuthenticatedRequest } from '@/lib/api-auth-middleware';
import { createApiResponse } from '@/lib/api-response';
import { PRODUCT_STATUS, ERROR_MESSAGES, API_LIMITS } from '@/lib/constants';

async function handleGetProducts(request: AuthenticatedRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '0'); // 0 means fetch all
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');

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

    // Fetch products
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
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
        orderBy: [{ name: 'asc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    // Format response
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      price: product.price,
      stock: product.stock,
      status: product.status,
      category: product.category?.name || 'Uncategorized',
      brand: product.brand?.name || 'No Brand',
      description: product.description,
      images: product.images,
    }));

    // Return products directly if no pagination requested
    if (limit === 0) {
      return createApiResponse.success(
        formattedProducts,
        'Products retrieved successfully'
      );
    }

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
