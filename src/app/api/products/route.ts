import {
  withAuth,
  withPermission,
  AuthenticatedRequest,
} from '@/lib/api-middleware';
import { handleApiError } from '@/lib/api-error-handler-new';
import { createFreshPrismaClient } from '@/lib/db';
import { createSecureResponse } from '@/lib/security-headers';
import { logger } from '@/lib/logger';
import { hasPermission } from '@/lib/auth/roles';

import { PRODUCT_STATUS } from '@/lib/constants';
import { USER_ROLES } from '@/lib/auth/roles';
import { generateSKU } from '@/lib/utils/product-utils';

// Import the form validation schema
import { createProductSchema } from '@/lib/validations/product';

// Force Node.js runtime to ensure database connectivity and NextAuth compatibility
export const runtime = 'nodejs';
import type {
  ProductFilters,
  ProductWhereClause,
  ProductIncludeClause,
  ProductWithIncludes,
  ProductUpdateData,
  PaginatedResponse,
  ApiResponse,
} from '@/types/api';

// Use the same validation schema as the form
const ProductCreateSchema = createProductSchema;

// GET /api/products - List products with filtering
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  const prisma = createFreshPrismaClient();
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const categoryId =
      searchParams.get('categoryId') || searchParams.get('category');
    const brandId = searchParams.get('brandId') || searchParams.get('brand');
    const supplierId = searchParams.get('supplierId');
    const lowStock = searchParams.get('lowStock') === 'true';
    const status = searchParams.get('status') || PRODUCT_STATUS.ACTIVE;
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const includeSync = searchParams.get('includeSync') === 'true';

    // Build where clause
    const where: any = {
      isArchived: false,
    };

    // Apply filters
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }

    if (brandId) {
      where.brandId = parseInt(brandId);
    }

    if (supplierId) {
      where.supplierId = parseInt(supplierId);
    }

    // For low stock filtering, we'll handle this after the query
    // since Prisma doesn't support field-to-field comparison in where clause

    if (status && status !== 'all') {
      if (status === PRODUCT_STATUS.ACTIVE) {
        where.status = PRODUCT_STATUS.ACTIVE;
      } else if (status === PRODUCT_STATUS.INACTIVE) {
        where.status = PRODUCT_STATUS.INACTIVE;
      }
    }

    // Build order by clause
    const orderBy: any = {};
    if (sortBy === 'price' || sortBy === 'cost') {
      orderBy[sortBy] = sortOrder;
    } else if (sortBy === 'stock') {
      orderBy.stock = sortOrder;
    } else if (sortBy === 'category') {
      orderBy.category = { name: sortOrder };
    } else if (sortBy === 'brand') {
      orderBy.brand = { name: sortOrder };
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build include clause
    const include: ProductIncludeClause = {
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
      supplier: {
        select: {
          id: true,
          name: true,
        },
      },
    };

    // Conditionally include content sync data
    if (includeSync) {
      (include as any).content_sync = {
        select: {
          id: true,
          sync_status: true,
          last_sync_at: true,
          sync_errors: true,
          webhook_url: true,
          created_at: true,
          updated_at: true,
        },
      };
    }

    // Execute query with relations
    let products, totalCount;

    if (lowStock) {
      // For low stock, we need to fetch all products and filter in memory
      // since Prisma doesn't support field-to-field comparison in where clause
      const allProducts = await prisma.product.findMany({
        where,
        include,
        orderBy,
      });

      const lowStockProducts = allProducts.filter(
        product => product.stock <= (product.minStock || 0)
      );

      totalCount = lowStockProducts.length;

      // Apply pagination after filtering
      const startIndex = (page - 1) * limit;
      products = lowStockProducts.slice(startIndex, startIndex + limit);
    } else {
      // Normal query with pagination
      const [normalProducts, normalTotalCount] = await Promise.all([
        prisma.product.findMany({
          where,
          include,
          orderBy,
          skip,
          take: limit,
        }),
        prisma.product.count({ where }),
      ]);
      products = normalProducts;
      totalCount = normalTotalCount;
    }

    // Check user permissions for different data types
    const canViewCost = hasPermission(request.user.role, 'PRODUCT_COST_READ');
    const canViewPrice = hasPermission(request.user.role, 'PRODUCT_PRICE_READ');

    // Transform response with role-based field filtering
    const transformedProducts = products.map(product => {
      const baseProduct = {
        id: product.id,
        name: product.name,
        sku: product.sku,
        description: product.description,
        stock: product.stock,
        minStock: product.minStock,
        status: product.status,
        isArchived: product.isArchived,
        images: product.images,
        tags: product.tags,
        category: product.category,
        brand: product.brand,
        supplier: product.supplier,
        categoryId: product.categoryId,
        brandId: product.brandId,
        supplierId: product.supplierId,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        wordpress_id: (product as any).wordpress_id ?? null,
        ...(includeSync && { content_sync: (product as any).content_sync }),
      } as any;

      // Always include price field - Manager needs to see selling prices
      baseProduct.price = product.price;

      // Conditionally add cost-sensitive fields based on permissions
      if (canViewCost) {
        baseProduct.cost = product.cost;
        // Calculate profit margin if both cost and price are available (user can already see cost if we're here)
        if (product.cost && product.price) {
          baseProduct.profitMargin = (
            ((Number(product.price) - Number(product.cost)) /
              Number(product.price)) *
            100
          ).toFixed(2);
        }
      }

      return baseProduct;
    });

    return createSecureResponse(
      {
        success: true,
        message: `Retrieved ${transformedProducts.length} products`,
        data: transformedProducts,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPreviousPage: page > 1,
        },
      },
      200
    );
  } catch (error) {
    return handleApiError(error);
  } finally {
    if (process.env.NODE_ENV === 'production') {
      await prisma.$disconnect();
    }
  }
});

// POST /api/products - Create new product
export const POST = withPermission(
  [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  async (request: AuthenticatedRequest) => {
    const prisma = createFreshPrismaClient();
    try {
      const body = await request.json();

      // Validate input data
      const validatedData = ProductCreateSchema.parse(body);

      // Check permissions for price fields
      const canSetCost = hasPermission(request.user.role, 'PRODUCT_COST_READ');
      const canSetPrice = hasPermission(
        request.user.role,
        'PRODUCT_PRICE_READ'
      );

      if (validatedData.purchasePrice !== undefined && !canSetCost) {
        return createSecureResponse(
          {
            success: false,
            error: 'Insufficient permissions to set product cost price',
          },
          403
        );
      }

      // Manager can set selling prices, so no restriction needed

      // Auto-generate SKU if not provided
      let finalSku = validatedData.sku;
      if (!finalSku) {
        // Fetch category and brand names for SKU generation
        let categoryName: string | undefined;
        let brandName: string | undefined;

        if (validatedData.categoryId) {
          const category = await prisma.category.findUnique({
            where: { id: validatedData.categoryId },
            select: { name: true },
          });
          categoryName = category?.name;
        }

        if (validatedData.brandId) {
          const brand = await prisma.brand.findUnique({
            where: { id: validatedData.brandId },
            select: { name: true },
          });
          brandName = brand?.name;
        }

        // Generate unique SKU with retry logic
        let attempts = 0;
        const maxAttempts = 10;

        do {
          finalSku = generateSKU(validatedData.name, categoryName, brandName);
          attempts++;

          // Check if SKU already exists
          const existingSKU = await prisma.product.findUnique({
            where: { sku: finalSku },
            select: { id: true },
          });

          if (!existingSKU) break;
        } while (attempts < maxAttempts);

        if (attempts >= maxAttempts) {
          return createSecureResponse(
            {
              success: false,
              message: 'Failed to generate unique SKU after multiple attempts',
              code: 'INTERNAL_ERROR',
            },
            500
          );
        }
      } else {
        // Check if provided SKU already exists
        const existingSKU = await prisma.product.findUnique({
          where: { sku: finalSku },
        });

        if (existingSKU) {
          return createSecureResponse(
            {
              success: false,
              message: 'Product with this SKU already exists',
              code: 'CONFLICT',
            },
            409
          );
        }
      }


      // Verify category exists
      if (validatedData.categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: validatedData.categoryId },
        });

        if (!category) {
          return createSecureResponse(
            {
              success: false,
              message: 'Category not found',
              code: 'NOT_FOUND',
            },
            404
          );
        }
      }

      // Verify brand exists
      if (validatedData.brandId) {
        const brand = await prisma.brand.findUnique({
          where: { id: validatedData.brandId },
        });

        if (!brand) {
          return createSecureResponse(
            {
              success: false,
              message: 'Brand not found',
              code: 'NOT_FOUND',
            },
            404
          );
        }
      }

      // Verify supplier exists
      if (validatedData.supplierId) {
        const supplier = await prisma.supplier.findUnique({
          where: { id: validatedData.supplierId },
        });

        if (!supplier) {
          return createSecureResponse(
            {
              success: false,
              message: 'Supplier not found',
              code: 'NOT_FOUND',
            },
            404
          );
        }
      }

      // Create the product
      // Prepare product data with conditional price fields
      const productData: any = {
        name: validatedData.name,
        sku: finalSku,
        description: validatedData.description,
        stock: validatedData.currentStock || 0,
        minStock: validatedData.minimumStock || 0,
        status: validatedData.status,
        tags: validatedData.tags || [],
        images: validatedData.images || [],
        categoryId: validatedData.categoryId,
        brandId: validatedData.brandId,
        supplierId: validatedData.supplierId,
        wordpress_id: validatedData.wordpress_id,
      };

      // Handle price field - required in database schema
      // Manager can set selling prices, so use the provided value or 0 as default
      productData.price = validatedData.sellingPrice || 0;

      // Handle cost field - required in database schema
      if (canSetCost && validatedData.purchasePrice !== undefined) {
        productData.cost = validatedData.purchasePrice;
      } else {
        // Set cost to 0 if user doesn't have permission or doesn't provide it
        productData.cost = 0;
      }

      const newProduct = await prisma.product.create({
        data: productData,
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
          supplier: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return createSecureResponse(
        {
          success: true,
          message: 'Product created successfully',
          data: newProduct,
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
