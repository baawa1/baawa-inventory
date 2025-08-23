import {
  withAuth,
  withPermission,
  AuthenticatedRequest,
} from '@/lib/api-middleware';
import { handleApiError } from '@/lib/api-error-handler-new';
import { createApiResponse } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { USER_ROLES } from '@/lib/auth/roles';
import { Prisma } from '@prisma/client';
import { createBrandSchema } from '@/lib/validations/brand';

// GET /api/brands - List all brands
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Build where clause
    const where: Prisma.BrandWhereInput = {};

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build order by clause
    const orderBy: Prisma.BrandOrderByWithRelationInput = {};
    if (sortBy === 'name') {
      orderBy.name = sortOrder as 'asc' | 'desc';
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder as 'asc' | 'desc';
    } else if (sortBy === 'updatedAt') {
      orderBy.updatedAt = sortOrder as 'asc' | 'desc';
    } else if (sortBy === 'productCount') {
      // For productCount, we'll sort after fetching since it's a computed field
      orderBy.name = 'asc'; // Default ordering, will be overridden
    } else {
      orderBy.name = 'asc';
    }

    // Get brands with pagination
    const [brands, totalCount] = await Promise.all([
      prisma.brand.findMany({
        where,
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.brand.count({ where }),
    ]);

    // Transform brands to include product count
    const transformedBrands = brands.map(brand => ({
      id: brand.id,
      name: brand.name,
      description: brand.description,
      website: brand.website,

      isActive: brand.isActive,
      productCount: brand._count.products,
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    }));

    // Sort by productCount if requested
    if (sortBy === 'productCount') {
      transformedBrands.sort((a, b) => {
        if (sortOrder === 'asc') {
          return a.productCount - b.productCount;
        } else {
          return b.productCount - a.productCount;
        }
      });
    }

    const totalPages = Math.ceil(totalCount / limit);

    return createApiResponse.successWithPagination(
      transformedBrands,
      {
        page: page,
        limit: limit,
        totalPages: totalPages,
        total: totalCount,
      },
      `Retrieved ${transformedBrands.length} brands`
    );
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/brands - Create new brand
export const POST = withPermission(
  [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const validatedData = createBrandSchema.parse(body);

      // Check if brand with the same name already exists (case-insensitive)
      const existingBrand = await prisma.brand.findFirst({
        where: {
          name: {
            equals: validatedData.name,
            mode: 'insensitive',
          },
        },
      });

      if (existingBrand) {
        return createApiResponse.error(
          'Brand with this name already exists',
          409
        );
      }

      // Create the brand
      const newBrand = await prisma.brand.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          website: validatedData.website,

          isActive: validatedData.isActive ?? true,
        },
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      });

      // Transform the response
      const transformedBrand = {
        id: newBrand.id,
        name: newBrand.name,
        description: newBrand.description,
        website: newBrand.website,

        isActive: newBrand.isActive,
        productCount: newBrand._count.products,
        createdAt: newBrand.createdAt,
        updatedAt: newBrand.updatedAt,
      };

      return createApiResponse.success(
        transformedBrand,
        'Brand created successfully',
        201
      );
    } catch (error) {
      return handleApiError(error);
    }
  }
);
