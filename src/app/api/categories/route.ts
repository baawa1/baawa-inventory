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

// Validation schema for category creation
const CategoryCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  image: z.string().min(1, "Category image is required").max(500),
  isActive: z.boolean().default(true),
  parentId: z.number().optional(),
});

// Validation schema for category update (for future use)
const _CategoryUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  parentId: z.number().optional(),
});

// GET /api/categories - List all categories
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
    const where: any = {};

    if (isActive !== null) {
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
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get categories with pagination
    const [categories, totalCount] = await Promise.all([
      prisma.category.findMany({
        where,
        include: {
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
          children: {
            select: {
              id: true,
              name: true,
              isActive: true,
            },
          },
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
      prisma.category.count({ where }),
    ]);

    // Transform categories to include product count
    const transformedCategories = categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      image: category.image,
      isActive: category.isActive,
      parentId: category.parentId,
      parent: category.parent,
      children: category.children,
      productCount: category._count.products,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      data: transformedCategories,
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

// POST /api/categories - Create new category
export const POST = withPermission(
  [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const validatedData = CategoryCreateSchema.parse(body);

      // If parentId is provided, verify the parent category exists
      if (validatedData.parentId) {
        const parentExists = await prisma.category.findUnique({
          where: { id: validatedData.parentId },
        });

        if (!parentExists) {
          return NextResponse.json(
            { error: "Parent category not found" },
            { status: 404 }
          );
        }
      }

      // Check if category with the same name already exists (case-insensitive)
      const existingCategory = await prisma.category.findFirst({
        where: {
          name: {
            equals: validatedData.name,
            mode: "insensitive",
          },
        },
      });

      if (existingCategory) {
        return NextResponse.json(
          { error: "Category with this name already exists" },
          { status: 409 }
        );
      }

      // Create the category
      const newCategory = await prisma.category.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          image: validatedData.image,
          isActive: validatedData.isActive,
          parentId: validatedData.parentId,
        },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              products: true,
            },
          },
        },
      });

      // Transform the response to include product count
      const transformedCategory = {
        id: newCategory.id,
        name: newCategory.name,
        description: newCategory.description,
        image: newCategory.image,
        isActive: newCategory.isActive,
        parentId: newCategory.parentId,
        parent: newCategory.parent,
        productCount: newCategory._count.products,
        createdAt: newCategory.createdAt,
        updatedAt: newCategory.updatedAt,
      };

      return NextResponse.json(
        {
          message: "Category created successfully",
          data: transformedCategory,
        },
        { status: 201 }
      );
    } catch (error) {
      return handleApiError(error);
    }
  }
);
