import {
  withAuth,
  withPermission,
  AuthenticatedRequest,
} from "@/lib/api-middleware";
import { handleApiError } from "@/lib/api-error-handler";
import { createApiResponse } from "@/lib/api-response";
import { prisma } from "@/lib/db";

import { PRODUCT_STATUS } from "@/lib/constants";
import { USER_ROLES } from "@/lib/auth/roles";

// Import the form validation schema
import { createProductSchema } from "@/lib/validations/product";

// Use the same validation schema as the form
const ProductCreateSchema = createProductSchema;

// GET /api/products - List products with filtering
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const categoryId =
      searchParams.get("categoryId") || searchParams.get("category");
    const brandId = searchParams.get("brandId") || searchParams.get("brand");
    const supplierId = searchParams.get("supplierId");
    const lowStock = searchParams.get("lowStock") === "true";
    const status = searchParams.get("status") || PRODUCT_STATUS.ACTIVE;
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = searchParams.get("sortOrder") || "asc";
    const includeSync = searchParams.get("includeSync") === "true";

    // Build where clause
    const where: any = {
      isArchived: false,
    };

    // Apply filters
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
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

    if (lowStock) {
      where.stock = { lte: prisma.product.fields.minStock };
    }

    if (status && status !== "all") {
      if (status === PRODUCT_STATUS.ACTIVE) {
        where.isActive = true;
      } else if (status === PRODUCT_STATUS.INACTIVE) {
        where.isActive = false;
      }
    }

    // Build order by clause
    const orderBy: any = {};
    if (sortBy === "price" || sortBy === "cost") {
      orderBy[sortBy] = sortOrder;
    } else if (sortBy === "stock") {
      orderBy.stock = sortOrder;
    } else if (sortBy === "category") {
      orderBy.category = { name: sortOrder };
    } else if (sortBy === "brand") {
      orderBy.brand = { name: sortOrder };
    } else if (sortBy === "createdAt") {
      orderBy.createdAt = sortOrder;
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build include clause
    const include: any = {
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
    };

    // Conditionally include content sync data
    if (includeSync) {
      include.content_sync = {
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
    console.log("🔍 Executing query with:", {
      where,
      include,
      orderBy,
      skip,
      take: limit,
    });

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    console.log(
      `✅ Found ${products.length} products out of ${totalCount} total`
    );

    // Transform response
    const transformedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      description: product.description,
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      minStock: product.minStock,
      maxStock: product.maxStock,
      isActive: product.isActive,
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
      ...(includeSync && { content_sync: product.content_sync }),
    }));

    return createApiResponse.successWithPagination(
      transformedProducts,
      {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1,
      },
      `Retrieved ${transformedProducts.length} products`
    );
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/products - Create new product
export const POST = withPermission(
  [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      console.log("Received product data:", body);

      // Validate input data
      const validatedData = ProductCreateSchema.parse(body);
      console.log("Validated product data:", validatedData);

      // Check if SKU already exists
      const existingSKU = await prisma.product.findUnique({
        where: { sku: validatedData.sku },
      });

      if (existingSKU) {
        return createApiResponse.conflict(
          "Product with this SKU already exists"
        );
      }

      // Check if barcode already exists (if provided)
      if (validatedData.barcode) {
        const existingBarcode = await prisma.product.findFirst({
          where: { barcode: validatedData.barcode },
        });

        if (existingBarcode) {
          return createApiResponse.conflict(
            "Product with this barcode already exists"
          );
        }
      }

      // Verify category exists
      if (validatedData.categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: validatedData.categoryId },
        });

        if (!category) {
          return createApiResponse.notFound("Category");
        }
      }

      // Verify brand exists
      if (validatedData.brandId) {
        const brand = await prisma.brand.findUnique({
          where: { id: validatedData.brandId },
        });

        if (!brand) {
          return createApiResponse.notFound("Brand");
        }
      }

      // Verify supplier exists
      if (validatedData.supplierId) {
        const supplier = await prisma.supplier.findUnique({
          where: { id: validatedData.supplierId },
        });

        if (!supplier) {
          return createApiResponse.notFound("Supplier");
        }
      }

      // Create the product
      const newProduct = await prisma.product.create({
        data: {
          name: validatedData.name,
          sku: validatedData.sku,
          barcode: validatedData.barcode,
          description: validatedData.description,
          price: validatedData.sellingPrice,
          cost: validatedData.purchasePrice,
          stock: validatedData.currentStock || 0,
          minStock: validatedData.minimumStock || 0,
          maxStock: validatedData.maximumStock || 1000,
          unit: validatedData.unit || "piece",
          status: validatedData.status,
          weight: validatedData.weight,
          dimensions: validatedData.dimensions,
          color: validatedData.color,
          size: validatedData.size,
          material: validatedData.material,
          tags: validatedData.tags || [],
          images: validatedData.imageUrl ? [validatedData.imageUrl] : [],
          categoryId: validatedData.categoryId,
          brandId: validatedData.brandId,
          supplierId: validatedData.supplierId,
        },
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

      console.log("✅ Product created successfully:", newProduct);

      return createApiResponse.success(
        newProduct,
        "Product created successfully",
        201
      );
    } catch (error) {
      return handleApiError(error);
    }
  }
);
