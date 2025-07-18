import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Import the form validation schema
import { createProductSchema } from "@/lib/validations/product";

// Use the same validation schema as the form
const ProductCreateSchema = createProductSchema;

// GET /api/products - List products with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Account not approved" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId");
    const brandId = searchParams.get("brandId");
    const supplierId = searchParams.get("supplierId");
    const lowStock = searchParams.get("lowStock") === "true";
    const status = searchParams.get("status") || "active";
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    // Build where clause
    const where: any = {
      isArchived: false,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
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

    if (status && status !== "all") {
      where.status = status;
    }

    if (lowStock) {
      // For low stock, we need to find products where stock <= minStock
      // This requires a raw query since Prisma doesn't support column comparisons
      const lowStockProducts = (await prisma.$queryRaw`
        SELECT id FROM products 
        WHERE stock <= min_stock 
        AND is_archived = false
      `) as Array<{ id: number }>;

      where.id = {
        in: lowStockProducts.map((p) => p.id),
      };
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === "stock") {
      orderBy.stock = sortOrder;
    } else if (sortBy === "price") {
      orderBy.price = sortOrder;
    } else if (sortBy === "created" || sortBy === "created_at") {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === "updated" || sortBy === "updated_at") {
      orderBy.updatedAt = sortOrder;
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with relations
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
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
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    // Transform products for response
    const transformedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      sku: product.sku,
      barcode: product.barcode,
      cost: Number(product.cost),
      price: Number(product.price),
      stock: product.stock,
      minStock: product.minStock,
      maxStock: product.maxStock,
      unit: product.unit,
      status: product.status,
      isArchived: product.isArchived,
      createdAt: product.createdAt?.toISOString(),
      updatedAt: product.updatedAt?.toISOString(),
      category: product.category,
      brand: product.brand,
      supplier: product.supplier,
      images: product.images || [], // <-- Add this line
      // Calculated fields
      stockStatus: product.stock <= product.minStock ? "low" : "normal",
      profitMargin: Number(product.price) - Number(product.cost),
      profitMarginPercent:
        Number(product.cost) > 0
          ? ((Number(product.price) - Number(product.cost)) /
              Number(product.cost)) *
            100
          : 0,
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      data: transformedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
      filters: {
        search,
        categoryId,
        brandId,
        supplierId,
        lowStock,
        status,
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Account not approved" },
        { status: 403 }
      );
    }

    // Check permissions
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

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
      return NextResponse.json(
        { error: "Product with this SKU already exists" },
        { status: 400 }
      );
    }

    // Check if barcode already exists (if provided)
    if (validatedData.barcode) {
      const existingBarcode = await prisma.product.findFirst({
        where: { barcode: validatedData.barcode },
      });

      if (existingBarcode) {
        return NextResponse.json(
          { error: "Product with this barcode already exists" },
          { status: 400 }
        );
      }
    }

    // Verify category exists (if provided)
    if (validatedData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: validatedData.categoryId },
      });

      if (!category) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }
    }

    // Verify brand exists (if provided)
    if (validatedData.brandId) {
      const brand = await prisma.brand.findUnique({
        where: { id: validatedData.brandId },
      });

      if (!brand) {
        return NextResponse.json({ error: "Brand not found" }, { status: 404 });
      }
    }

    // Verify supplier exists (if provided)
    if (validatedData.supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: validatedData.supplierId },
      });

      if (!supplier) {
        return NextResponse.json(
          { error: "Supplier not found" },
          { status: 404 }
        );
      }
    }

    // Transform validated data to match Prisma schema
    const productData = {
      name: validatedData.name,
      description: validatedData.description,
      sku: validatedData.sku,
      barcode: validatedData.barcode,
      cost: validatedData.purchasePrice,
      price: validatedData.sellingPrice,
      stock: validatedData.currentStock,
      minStock: validatedData.minimumStock,
      maxStock: validatedData.maximumStock,
      unit: validatedData.unit || "piece",
      supplierId: validatedData.supplierId,
      categoryId: validatedData.categoryId,
      brandId: validatedData.brandId,
      status: validatedData.status,
      // Handle additional fields that might be present
      weight: validatedData.weight,
      dimensions: validatedData.dimensions,
      color: validatedData.color,
      size: validatedData.size,
      material: validatedData.material,
      tags: validatedData.tags,
      salePrice: validatedData.salePrice,
      saleStartDate: validatedData.saleStartDate,
      saleEndDate: validatedData.saleEndDate,
      metaTitle: validatedData.metaTitle,
      metaDescription: validatedData.metaDescription,
      seoKeywords: validatedData.seoKeywords,
      isFeatured: validatedData.isFeatured,
      sortOrder: validatedData.sortOrder,
    };

    // Create the product
    const product = await prisma.product.create({
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

    // Transform response
    const transformedProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      sku: product.sku,
      barcode: product.barcode,
      cost: Number(product.cost),
      price: Number(product.price),
      stock: product.stock,
      minStock: product.minStock,
      maxStock: product.maxStock,
      unit: product.unit,
      status: product.status,
      createdAt: product.createdAt?.toISOString(),
      updatedAt: product.updatedAt?.toISOString(),
      category: product.category,
      brand: product.brand,
      supplier: product.supplier,
    };

    return NextResponse.json(
      {
        message: "Product created successfully",
        data: transformedProduct,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
