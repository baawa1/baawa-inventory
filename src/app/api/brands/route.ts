import { NextResponse } from "next/server";
import {
  withAuth,
  withPermission,
  AuthenticatedRequest,
} from "@/lib/api-middleware";
import { handleApiError } from "@/lib/api-error-handler";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { USER_ROLES } from "@/lib/auth/roles";
import { Prisma } from "@prisma/client";

// Validation schema for brand creation
const BrandCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  image: z.string().max(500).optional(),
  website: z.string().url().optional(),
  isActive: z.boolean().default(true),
});

// GET /api/brands - List all brands
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    // Build where clause
    const where: Prisma.BrandWhereInput = {};

    if (isActive !== null && isActive !== "") {
      where.isActive = isActive === "true";
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build order by clause
    const orderBy: Prisma.BrandOrderByWithRelationInput = {};
    if (
      sortBy === "name" ||
      sortBy === "description" ||
      sortBy === "isActive" ||
      sortBy === "createdAt" ||
      sortBy === "updatedAt"
    ) {
      orderBy[sortBy] = sortOrder as Prisma.SortOrder;
    } else {
      orderBy.name = "asc"; // Default fallback
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
    const transformedBrands = brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
      description: brand.description,
      image: brand.image,
      website: brand.website,
      isActive: brand.isActive,
      productCount: brand._count.products,
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      data: transformedBrands,
      pagination: {
        page: page,
        limit: limit,
        totalPages: totalPages,
        total: totalCount,
      },
    });
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
      const validatedData = BrandCreateSchema.parse(body);

      // Check if brand name already exists
      const existingBrand = await prisma.brand.findFirst({
        where: {
          name: {
            equals: validatedData.name,
            mode: "insensitive",
          },
        },
      });

      if (existingBrand) {
        return NextResponse.json(
          { error: "Brand with this name already exists" },
          { status: 409 }
        );
      }

      // Create the brand
      const newBrand = await prisma.brand.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          image: validatedData.image,
          website: validatedData.website,
          isActive: validatedData.isActive,
        },
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      });

      // Transform the response to include product count
      const transformedBrand = {
        id: newBrand.id,
        name: newBrand.name,
        description: newBrand.description,
        image: newBrand.image,
        website: newBrand.website,
        isActive: newBrand.isActive,
        productCount: newBrand._count.products,
        createdAt: newBrand.createdAt,
        updatedAt: newBrand.updatedAt,
      };

      return NextResponse.json(
        {
          message: "Brand created successfully",
          data: transformedBrand,
        },
        { status: 201 }
      );
    } catch (error) {
      return handleApiError(error);
    }
  }
);
