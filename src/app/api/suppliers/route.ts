import {
  withAuth,
  withPermission,
  AuthenticatedRequest,
} from '@/lib/api-middleware';
import { prisma } from '@/lib/db';
import { USER_ROLES } from '@/lib/auth/roles';
import {
  createSupplierSchema,
  supplierQuerySchema,
} from '@/lib/validations/supplier';
import { handleApiError, createApiResponse } from '@/lib/api-error-handler-new';
import { Prisma } from '@prisma/client';

// GET /api/suppliers - List suppliers with optional filtering and pagination
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);

    // Convert search params to proper types for validation
    const queryParams = {
      page: Math.max(parseInt(searchParams.get('page') || '1'), 1),
      limit: Math.min(parseInt(searchParams.get('limit') || '10'), 100),
      search: searchParams.get('search') || undefined,
      isActive: searchParams.get('isActive')
        ? searchParams.get('isActive') === 'true'
        : undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    };

    // Validate query parameters
    const validatedQuery = supplierQuerySchema.parse(queryParams);
    const { page, limit, search, isActive, sortBy, sortOrder } = validatedQuery;

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build where clause for Prisma
    const where: Prisma.SupplierWhereInput = {};

    // Apply filters
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Build orderBy clause - handle nested fields
    const orderBy: Prisma.SupplierOrderByWithRelationInput = {};
    if (sortBy === 'productCount') {
      // Handle special case for product count sorting
      orderBy.products = { _count: sortOrder };
    } else {
      orderBy[sortBy as keyof Prisma.SupplierOrderByWithRelationInput] =
        sortOrder;
    }

    // Get suppliers and total count in parallel
    const [suppliers, totalCount] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
        orderBy,
        skip: offset,
        take: limit,
      }),
      prisma.supplier.count({ where }),
    ]);

    // Transform response to include product count
    const transformedSuppliers = suppliers.map(supplier => ({
      id: supplier.id,
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      isActive: supplier.isActive,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
      _count: {
        products: supplier._count.products,
      },
    }));

    return createApiResponse({
      success: true,
      data: transformedSuppliers,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        offset,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/suppliers - Create a new supplier
export const POST = withPermission(
  [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const validatedData = createSupplierSchema.parse(body);

      // Check if supplier with same name already exists
      const existingSupplier = await prisma.supplier.findFirst({
        where: { name: validatedData.name },
        select: { id: true },
      });

      if (existingSupplier) {
        return handleApiError(
          new Error('Supplier with this name already exists'),
          409
        );
      }

      // Create the supplier
      const newSupplier = await prisma.supplier.create({
        data: validatedData,
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      });

      // Transform response
      const transformedSupplier = {
        id: newSupplier.id,
        name: newSupplier.name,
        contactPerson: newSupplier.contactPerson,
        email: newSupplier.email,
        phone: newSupplier.phone,
        address: newSupplier.address,
        isActive: newSupplier.isActive,
        createdAt: newSupplier.createdAt,
        updatedAt: newSupplier.updatedAt,
        _count: {
          products: newSupplier._count.products,
        },
      };

      return createApiResponse(
        {
          success: true,
          message: 'Supplier created successfully',
          data: transformedSupplier,
        },
        201
      );
    } catch (error) {
      return handleApiError(error);
    }
  }
);
