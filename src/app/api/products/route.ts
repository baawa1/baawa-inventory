import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  createProductSchema,
  productQuerySchema,
  validateRequest,
} from "@/lib/validations";
import { withAuth, AuthenticatedRequest } from "@/lib/api-middleware";
import { withDataRateLimit, withApiRateLimit } from "@/lib/rate-limit";
import { withApiCache, cachePresets } from "@/lib/api-cache";

// GET /api/products - List products with optional filtering and pagination
export const GET = withApiCache(
  withDataRateLimit(
    withAuth(async function (request: AuthenticatedRequest) {
      try {
        const { searchParams } = new URL(request.url);

        // Convert search params to object for validation
        const queryParams = Object.fromEntries(searchParams.entries());

        // Validate query parameters
        const validation = validateRequest(productQuerySchema, queryParams);
        if (!validation.success) {
          return NextResponse.json(
            { error: "Invalid query parameters", details: validation.errors },
            { status: 400 }
          );
        }

        const validatedData = validation.data!;
        const {
          page = 1,
          limit = 10,
          search,
          category,
          brand,
          status,
          supplierId,
          minPrice,
          maxPrice,
          lowStock,
          outOfStock,
          sortBy = "createdAt",
          sortOrder = "desc",
        } = validatedData;

        // Enforce maximum limit as a safety check
        const safeLimit = Math.min(limit, 100);

        // Calculate offset for pagination
        const offset = (page - 1) * safeLimit;

        // Build Prisma where clause
        const where: any = {
          isArchived: false,
        };

        // Handle search with OR conditions
        if (search) {
          where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
            { barcode: { contains: search, mode: "insensitive" } },
          ];
        }

        // Category filtering (prefer ID for performance)
        if (category) {
          const categoryId = parseInt(category as string);
          if (!isNaN(categoryId)) {
            where.categoryId = categoryId;
          } else {
            // Only use name lookup if absolutely necessary
            where.category = {
              name: { equals: category, mode: "insensitive" },
            };
          }
        }

        // Brand filtering (prefer ID for performance)
        if (brand) {
          const brandId = parseInt(brand as string);
          if (!isNaN(brandId)) {
            where.brandId = brandId;
          } else {
            // Only use name lookup if absolutely necessary
            where.brand = {
              name: { equals: brand, mode: "insensitive" },
            };
          }
        }

        // Additional filters
        if (status) {
          where.status = status;
        }

        if (supplierId) {
          where.supplierId = supplierId;
        }

        // Price range filtering
        if (minPrice !== undefined || maxPrice !== undefined) {
          where.price = {};
          if (minPrice !== undefined) where.price.gte = minPrice;
          if (maxPrice !== undefined) where.price.lte = maxPrice;
        }

        // Stock level filtering
        if (outOfStock) {
          where.stock = { lte: 0 };
        }

        // Low stock filtering - products where stock <= minStock
        // Note: Prisma doesn't support column comparisons in where clauses
        // We'll handle this by getting products and filtering after if needed
        let needsLowStockFilter = false;
        if (lowStock) {
          needsLowStockFilter = true;
          // Remove the lowStock from where clause for now
        }

        // Handle sorting
        const orderBy: any = {};
        const sortField = sortBy === "created_at" ? "createdAt" : sortBy;
        orderBy[sortField] = sortOrder;

        // Execute queries - handle low stock filtering differently
        let products;
        let totalCount;

        if (needsLowStockFilter) {
          // For low stock, we need to get all matching products first
          // then filter where stock <= minStock
          const allProducts = await prisma.product.findMany({
            where,
            include: {
              supplier: {
                select: { id: true, name: true, contactPerson: true },
              },
              category: {
                select: { id: true, name: true },
              },
              brand: {
                select: { id: true, name: true },
              },
            },
            orderBy,
          });

          // Filter for low stock products
          const lowStockProducts = allProducts.filter(
            (product) => product.stock <= product.minStock
          );

          // Apply pagination to filtered results
          totalCount = lowStockProducts.length;
          products = lowStockProducts.slice(offset, offset + safeLimit);
        } else {
          // Normal query execution with pagination and optimized includes
          [products, totalCount] = await Promise.all([
            prisma.product.findMany({
              where,
              select: {
                id: true,
                name: true,
                sku: true,
                barcode: true,
                cost: true,
                price: true,
                stock: true,
                minStock: true,
                maxStock: true,
                unit: true,
                status: true,
                images: true,
                createdAt: true,
                updatedAt: true,
                supplier: {
                  select: {
                    id: true,
                    name: true,
                    contactPerson: true,
                  },
                },
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
              orderBy,
              skip: offset,
              take: safeLimit,
            }),
            prisma.product.count({ where }),
          ]);
        }

        // Return paginated response with metadata
        return NextResponse.json({
          data: products,
          pagination: {
            page,
            limit: safeLimit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / safeLimit),
            hasNext: offset + safeLimit < totalCount,
            hasPrev: page > 1,
          },
        });
      } catch (error) {
        console.error("Error in GET /api/products:", error);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
    })
  ),
  cachePresets.products
);

// POST /api/products - Create a new product
export const POST = withApiRateLimit(
  withAuth(async function (request: AuthenticatedRequest) {
    try {
      const body = await request.json();

      // Validate request body
      const validation = validateRequest(createProductSchema, body);
      if (!validation.success) {
        return NextResponse.json(
          { error: "Invalid product data", details: validation.errors },
          { status: 400 }
        );
      }

      const productData = validation.data!;

      // Check if SKU already exists
      const existingProduct = await prisma.product.findUnique({
        where: { sku: productData.sku },
        select: { id: true },
      });

      if (existingProduct) {
        return NextResponse.json(
          { error: "Product with this SKU already exists" },
          { status: 409 }
        );
      }

      // Create the product
      const product = await prisma.product.create({
        data: {
          name: productData.name,
          sku: productData.sku,
          barcode: productData.barcode,
          description: productData.description,
          categoryId: productData.categoryId,
          brandId: productData.brandId,
          cost: productData.purchasePrice,
          price: productData.sellingPrice,
          minStock: productData.minimumStock || 0,
          maxStock: productData.maximumStock,
          stock: productData.currentStock || 0,
          supplierId: productData.supplierId,
          status: (productData.status as any) || "ACTIVE",
          images: productData.imageUrl
            ? [{ url: productData.imageUrl, isPrimary: true }]
            : undefined,
        },
        include: {
          supplier: {
            select: { id: true, name: true },
          },
          category: {
            select: { id: true, name: true },
          },
          brand: {
            select: { id: true, name: true },
          },
        },
      });

      return NextResponse.json({ data: product }, { status: 201 });
    } catch (error) {
      console.error("Error in POST /api/products:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })
);
