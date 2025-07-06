import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { brandQuerySchema, createBrandSchema } from "@/lib/validations/brand";
import { handleApiError, createApiResponse } from "@/lib/api-error-handler";

// GET /api/brands - List brands with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return handleApiError(new Error("Unauthorized"), 401);
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

          return createApiResponse({
            success: true,
            brands: uniqueBrands,
          });
        }
      } catch (brandError) {
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

      return createApiResponse({
        success: true,
        brands: uniqueBrands,
      });
    }

    // Parse query parameters with safe defaults and performance optimization
    const isActiveParam = searchParams.get("isActive");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(parseInt(limitParam), 100) : 50;
    const search = searchParams.get("search");

    // For simple dropdown requests, optimize the query
    if (isActiveParam === "true" && !search && !searchParams.get("offset")) {
      // Optimized query for dropdowns
      const brands = await prisma.brand.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
        take: limit,
      });

      return createApiResponse({
        success: true,
        data: brands,
      });
    }

    // Validate query parameters
    const queryParams: any = {
      search,
      isActive: isActiveParam,
      limit,
      offset: Math.max(parseInt(searchParams.get("offset") || "0"), 0),
      sortBy: searchParams.get("sortBy") || "name",
      sortOrder: searchParams.get("sortOrder") || "asc",
    };

    const validatedQuery = brandQuerySchema.parse(queryParams);
    const { offset = 0, sortBy = "name", sortOrder = "asc" } = validatedQuery;

    // Build where clause for Prisma
    const where: any = {};

    // Apply filters
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (validatedQuery.isActive !== undefined) {
      where.isActive = validatedQuery.isActive;
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

    // Execute queries in parallel for better performance with optimized selects
    const [brands, count] = await Promise.all([
      prisma.brand.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          website: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
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
      prisma.brand.count({ where }),
    ]);

    const page = Math.floor(offset / limit) + 1;

    return createApiResponse({
      success: true,
      data: brands,
      pagination: {
        page,
        limit,
        offset,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/brands - Create a new brand
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return handleApiError(new Error("Unauthorized"), 401);
    }

    // Check permissions
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return handleApiError(new Error("Insufficient permissions"), 403);
    }

    const body = await request.json();
    const validatedData = createBrandSchema.parse(body);

    // Check if brand name already exists
    const existingBrand = await prisma.brand.findUnique({
      where: { name: validatedData.name },
      select: { id: true },
    });

    if (existingBrand) {
      return handleApiError(new Error("Brand name already exists"), 400);
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

    return createApiResponse(
      {
        success: true,
        brand,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
