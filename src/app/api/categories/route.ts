import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { USER_STATUS } from "@/lib/constants";
import { USER_ROLES, hasRole } from "@/lib/auth/roles";

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
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user.status !== USER_STATUS.APPROVED) {
      return NextResponse.json(
        { error: "Account not approved" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = searchParams.get("sortOrder") || "asc";
    const parentId = searchParams.get("parentId");
    const includeChildren = searchParams.get("includeChildren") === "true";

    // Build where clause
    const where: any = {};

    if (isActive !== null && isActive !== "") {
      where.isActive = isActive === "true";
    }

    if (parentId !== null && parentId !== "") {
      if (parentId === "null" || parentId === "0") {
        where.parentId = null; // Top-level categories only
      } else if (parentId === "subcategories") {
        where.parentId = { not: null }; // Subcategories only (has parent)
      } else {
        where.parentId = parseInt(parentId);
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.category.count({ where });

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const categories = await prisma.category.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        parentId: true,
        parent: includeChildren
          ? {
              select: {
                id: true,
                name: true,
              },
            }
          : false,
        children: includeChildren
          ? {
              select: {
                id: true,
                name: true,
                isActive: true,
                _count: {
                  select: {
                    products: true,
                  },
                },
              },
              where: { isActive: true },
            }
          : false,
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    // Transform the response
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
      subcategoryCount: category._count.children,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    }));

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
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user.status !== USER_STATUS.APPROVED) {
      return NextResponse.json(
        { error: "Account not approved" },
        { status: 403 }
      );
    }

    // Check permissions - only admins and managers can create categories
    if (!hasRole(session.user.role, [USER_ROLES.ADMIN, USER_ROLES.MANAGER])) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = CategoryCreateSchema.parse(body);

    // If parentId is provided, verify the parent category exists
    if (validatedData.parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: validatedData.parentId },
      });

      if (!parentCategory) {
        return NextResponse.json(
          { error: "Parent category not found" },
          { status: 400 }
        );
      }

      // Check if parent category is active
      if (!parentCategory.isActive) {
        return NextResponse.json(
          { error: "Cannot create subcategory under inactive parent category" },
          { status: 400 }
        );
      }
    }

    // Check if category name already exists under the same parent
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: validatedData.name,
          mode: "insensitive",
        },
        parentId: validatedData.parentId || null,
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Category with this name already exists at this level" },
        { status: 400 }
      );
    }

    // Create the category
    const category = await prisma.category.create({
      data: validatedData,
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        isActive: true,
        parentId: true,
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Category created successfully",
        data: {
          id: category.id,
          name: category.name,
          description: category.description,
          isActive: category.isActive,
          parentId: category.parentId,
          parent: category.parent,
          productCount: category._count.products,
          subcategoryCount: category._count.children,
          createdAt: category.createdAt.toISOString(),
          updatedAt: category.updatedAt.toISOString(),
        },
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

    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
