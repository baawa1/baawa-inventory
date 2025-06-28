import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  createProductSchema,
  productQuerySchema,
  validateRequest,
} from "@/lib/validations";

// GET /api/products - List products with optional filtering and pagination
export async function GET(request: NextRequest) {
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

    // Category filtering (handle both ID and name)
    if (category) {
      const categoryId = parseInt(category as string);
      if (!isNaN(categoryId)) {
        where.categoryId = categoryId;
      } else {
        // Find category by name first
        const categoryRecord = await prisma.category.findFirst({
          where: { name: category },
          select: { id: true },
        });
        if (categoryRecord) {
          where.categoryId = categoryRecord.id;
        }
      }
    }

    // Brand filtering (handle both ID and name)
    if (brand) {
      const brandId = parseInt(brand as string);
      if (!isNaN(brandId)) {
        where.brandId = brandId;
      } else {
        // Find brand by name first
        const brandRecord = await prisma.brand.findFirst({
          where: { name: brand },
          select: { id: true },
        });
        if (brandRecord) {
          where.brandId = brandRecord.id;
        }
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

    // Calculate pagination
    const skip = (page - 1) * limit;

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
      products = lowStockProducts.slice(skip, skip + limit);
    } else {
      // Normal query execution with pagination
      [products, totalCount] = await Promise.all([
        prisma.product.findMany({
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
          skip,
          take: limit,
        }),
        prisma.product.count({ where }),
      ]);
    }

    return NextResponse.json({
      data: products,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error in GET /api/products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
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
        status: productData.status || "ACTIVE",
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
}
