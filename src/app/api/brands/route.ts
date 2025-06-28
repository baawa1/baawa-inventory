import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { brandQuerySchema, createBrandSchema } from "@/lib/validations/brand";

// GET /api/brands - List brands with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Check if this is a legacy request for product brands (dropdown)
    const legacy = searchParams.get("legacy") === "true";

    if (legacy) {
      // Legacy functionality: Get unique brands from products for dropdowns
      try {
        // Get brands through product relations (since products reference brandId)
        const brands = await prisma.brand.findMany({
          where: {
            isActive: true,
            products: {
              some: {
                isArchived: false,
              },
            },
          },
          select: {
            name: true,
          },
          orderBy: {
            name: "asc",
          },
        });

        if (brands.length > 0) {
          const uniqueBrands = brands.map((brand) => brand.name).sort();

          return NextResponse.json({
            success: true,
            brands: uniqueBrands,
          });
        }
      } catch (brandError) {
        // If there's an error, fall back to all brands
        console.log("Falling back to all brands:", brandError);
      }

      // Fallback: Get all brands from the brands table
      const brandData = await prisma.brand.findMany({
        where: {
          isActive: true,
        },
        select: {
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      });

      const uniqueBrands = brandData.map((brand) => brand.name).sort();

      return NextResponse.json({
        success: true,
        brands: uniqueBrands,
      });
    }

    // Convert search params to proper types for validation
    const queryParams = {
      search: searchParams.get("search") || undefined,
      isActive: searchParams.get("isActive")
        ? searchParams.get("isActive") === "true"
        : undefined,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : 10,
      offset: searchParams.get("offset")
        ? parseInt(searchParams.get("offset")!)
        : 0,
      sortBy: searchParams.get("sortBy") || "name",
      sortOrder: searchParams.get("sortOrder") || "asc",
    };

    // Validate query parameters
    const validatedQuery = brandQuerySchema.parse(queryParams);
    const {
      limit = 10,
      offset = 0,
      search,
      isActive,
      sortBy = "name",
      sortOrder = "asc",
    } = validatedQuery;

    // Build where clause for Prisma
    const where: any = {};

    // Apply filters
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === "createdAt") {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === "updatedAt") {
      orderBy.updatedAt = sortOrder;
    } else {
      orderBy.name = sortOrder;
    }

    // Execute queries in parallel for better performance
    const [brands, count] = await Promise.all([
      prisma.brand.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
      }),
      prisma.brand.count({ where }),
    ]);

    const page = Math.floor(offset / limit) + 1;

    return NextResponse.json({
      success: true,
      data: brands,
      pagination: {
        page,
        limit,
        offset,
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Brands API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/brands - Create a new brand
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createBrandSchema.parse(body);

    // Check if brand name already exists
    const existingBrand = await prisma.brand.findUnique({
      where: { name: validatedData.name },
      select: { id: true },
    });

    if (existingBrand) {
      return NextResponse.json(
        { error: "Brand name already exists" },
        { status: 400 }
      );
    }

    // Create the brand with Prisma
    const brand = await prisma.brand.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        website: validatedData.website,
        isActive: validatedData.is_active ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      brand,
    });
  } catch (error) {
    console.error("Create brand API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
