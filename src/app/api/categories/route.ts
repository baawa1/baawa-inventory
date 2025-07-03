import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  createCategorySchema,
  categoryQuerySchema,
} from "@/lib/validations/category";
import { handleApiError, createApiResponse } from "@/lib/api-error-handler";

// GET /api/categories - List categories with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return handleApiError(new Error("Unauthorized"), 401);
    }

    // Check if user has permission to view categories
    if (!["ADMIN", "MANAGER", "STAFF"].includes(session.user.role)) {
      return handleApiError(new Error("Insufficient permissions"), 403);
    }

    const { searchParams } = new URL(request.url);

    // Check if this is a legacy request for product categories (dropdown)
    const legacy = searchParams.get("legacy") === "true";

    if (legacy) {
      // Legacy functionality: Get unique categories from products for dropdowns
      try {
        // Get categories through product relations (since products reference categoryId)
        const categories = await prisma.category.findMany({
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

        if (categories.length > 0) {
          const uniqueCategories = categories.map((cat) => cat.name).sort();

          return createApiResponse({
            success: true,
            categories: uniqueCategories,
          });
        }
      } catch (categoryError) {
        console.log("Falling back to all categories:", categoryError);
      }

      // Fallback: Get all categories from the categories table
      const categoryData = await prisma.category.findMany({
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

      const uniqueCategories = categoryData.map((cat) => cat.name).sort();

      return createApiResponse({
        success: true,
        categories: uniqueCategories,
      });
    }

    // New functionality: Full category management
    const queryParams = {
      search: searchParams.get("search") || undefined,
      isActive: searchParams.get("isActive")
        ? searchParams.get("isActive") === "true"
        : undefined,
      limit: Math.min(parseInt(searchParams.get("limit") || "10"), 100),
      offset: Math.max(parseInt(searchParams.get("offset") || "0"), 0),
      sortBy: searchParams.get("sortBy") || "name",
      sortOrder: searchParams.get("sortOrder") || "asc",
    };

    const validatedQuery = categoryQuerySchema.parse(queryParams);

    // Build where clause for Prisma
    const where: any = {};

    // Apply filters
    if (validatedQuery.search) {
      where.name = {
        contains: validatedQuery.search,
        mode: "insensitive",
      };
    }

    if (validatedQuery.isActive !== undefined) {
      where.isActive = validatedQuery.isActive;
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (validatedQuery.sortBy === "createdAt") {
      orderBy.createdAt = validatedQuery.sortOrder;
    } else if (validatedQuery.sortBy === "updatedAt") {
      orderBy.updatedAt = validatedQuery.sortOrder;
    } else {
      orderBy.name = validatedQuery.sortOrder;
    }

    // Execute queries in parallel for better performance
    const [categories, count] = await Promise.all([
      prisma.category.findMany({
        where,
        orderBy,
        skip: validatedQuery.offset,
        take: validatedQuery.limit,
      }),
      prisma.category.count({ where }),
    ]);

    // Transform to camelCase for frontend (Prisma already returns camelCase)
    const transformedCategories = categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));

    return createApiResponse({
      success: true,
      data: transformedCategories,
      pagination: {
        total: count,
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
        page: Math.floor(validatedQuery.offset / validatedQuery.limit) + 1,
        totalPages: Math.ceil(count / validatedQuery.limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return handleApiError(new Error("Unauthorized"), 401);
    }

    // Check if user has permission to create categories
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return handleApiError(new Error("Insufficient permissions"), 403);
    }

    const body = await request.json();
    const validatedData = createCategorySchema.parse(body);

    // Check if category name already exists
    const existingCategory = await prisma.category.findUnique({
      where: { name: validatedData.name },
      select: { id: true },
    });

    if (existingCategory) {
      return handleApiError(
        new Error("Category with this name already exists"),
        400
      );
    }

    // Create the category
    const category = await prisma.category.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        isActive: validatedData.isActive,
      },
    });

    // Transform response to match expected format (Prisma already returns camelCase)
    const transformedCategory = {
      id: category.id,
      name: category.name,
      description: category.description,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };

    return createApiResponse(transformedCategory, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
