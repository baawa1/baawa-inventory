import {
  withAuth,
  withPermission,
  AuthenticatedRequest,
} from '@/lib/api-middleware';
import { createFreshPrismaClient } from '@/lib/db';
import { USER_ROLES, hasPermission } from '@/lib/auth/roles';
import {
  createSupplierSchema,
  supplierQuerySchema,
} from '@/lib/validations/supplier';
import { handleApiError, createApiResponse } from '@/lib/api-error-handler-new';
import { Prisma } from '@prisma/client';

// GET /api/suppliers - List suppliers with optional filtering and pagination
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  const prisma = createFreshPrismaClient();
  try {
    const { searchParams } = new URL(request.url);

    // Convert search params to proper types for validation
    const queryParams = {
      page: Math.max(parseInt(searchParams.get('page') || '1'), 1),
      limit: Math.min(parseInt(searchParams.get('limit') || '10'), 100),
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    };

    // Validate query parameters
    const validatedQuery = supplierQuerySchema.parse(queryParams);
    const { page, limit, search, sortBy, sortOrder } = validatedQuery;

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


    // Build orderBy clause - handle nested fields
    const orderBy: Prisma.SupplierOrderByWithRelationInput = {};
    if (sortBy === 'productCount') {
      // Handle special case for product count sorting
      orderBy.products = { _count: sortOrder } as any;
    } else {
      (orderBy as any)[sortBy] = sortOrder;
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

    // Check user permissions for supplier data access
    const canViewFullSupplier = hasPermission(
      request.user.role,
      'SUPPLIER_READ'
    );

    // Transform response based on user permissions
    const transformedSuppliers = suppliers.map(supplier => {
      if (canViewFullSupplier) {
        // Admin gets full supplier details
        return {
          id: supplier.id,
          name: supplier.name,
          contactPerson: supplier.contactPerson,
          email: supplier.email,
          phone: supplier.phone,
          address: supplier.address,
          city: supplier.city,
          state: supplier.state,
          website: supplier.website,
          notes: supplier.notes,
          createdAt: supplier.createdAt,
          updatedAt: supplier.updatedAt,
          _count: {
            products: supplier._count.products,
          },
        };
      } else {
        // Manager/Staff get only name and id for selection purposes
        return {
          id: supplier.id,
          name: supplier.name,
        };
      }
    });

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
  } finally {
    if (process.env.NODE_ENV === 'production') {
      await prisma.$disconnect();
    }
  }
});

// POST /api/suppliers - Create a new supplier (Admin only)
export const POST = withPermission(
  [USER_ROLES.ADMIN],
  async (request: AuthenticatedRequest) => {
    const prisma = createFreshPrismaClient();
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
        data: { ...validatedData },
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
        city: newSupplier.city,
        state: newSupplier.state,
        website: newSupplier.website,
        notes: newSupplier.notes,
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
    } finally {
      if (process.env.NODE_ENV === 'production') {
        await prisma.$disconnect();
      }
    }
  }
);
