import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const CategoryUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  parentId: z.number().optional(),
});

// GET /api/categories/[id] - Get category by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: "Account not active" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const categoryId = parseInt(id);

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: "Invalid category ID" },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        parentId: true,
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
            _count: {
              select: {
                products: true,
              },
            },
          },
          where: { isActive: true },
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        id: category.id,
        name: category.name,
        description: category.description,
        isActive: category.isActive,
        parentId: category.parentId,
        parent: category.parent,
        children: category.children,
        productCount: category._count.products,
        subcategoryCount: category._count.children,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

// PUT /api/categories/[id] - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: "Account not active" },
        { status: 403 }
      );
    }

    // Check permissions - only admins and managers can update categories
    if (!["ADMIN", "MANAGER"].includes(session.user.role as string)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const categoryId = parseInt(id);
    const body = await request.json();
    const validatedData = CategoryUpdateSchema.parse(body);

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // If parentId is being updated, validate it
    if (validatedData.parentId !== undefined) {
      // Prevent circular references
      if (validatedData.parentId === categoryId) {
        return NextResponse.json(
          { error: "Category cannot be its own parent" },
          { status: 400 }
        );
      }

      // If setting a parent, verify it exists and is active
      if (validatedData.parentId !== null) {
        const parentCategory = await prisma.category.findUnique({
          where: { id: validatedData.parentId },
        });

        if (!parentCategory) {
          return NextResponse.json(
            { error: "Parent category not found" },
            { status: 400 }
          );
        }

        if (!parentCategory.isActive) {
          return NextResponse.json(
            { error: "Cannot set parent to inactive category" },
            { status: 400 }
          );
        }

        // Check for circular references in the hierarchy
        let currentParent = parentCategory;
        while (currentParent.parentId) {
          if (currentParent.parentId === categoryId) {
            return NextResponse.json(
              { error: "Circular reference detected in category hierarchy" },
              { status: 400 }
            );
          }
          currentParent = await prisma.category.findUnique({
            where: { id: currentParent.parentId },
          });
          if (!currentParent) break;
        }
      }
    }

    // Check if name already exists under the same parent (if name is being updated)
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const duplicateCategory = await prisma.category.findFirst({
        where: {
          name: {
            equals: validatedData.name,
            mode: "insensitive",
          },
          parentId:
            validatedData.parentId !== undefined
              ? validatedData.parentId
              : existingCategory.parentId,
          id: {
            not: categoryId,
          },
        },
      });

      if (duplicateCategory) {
        return NextResponse.json(
          { error: "Category with this name already exists at this level" },
          { status: 400 }
        );
      }
    }

    // Update the category
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: validatedData,
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        parentId: true,
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
            _count: {
              select: {
                products: true,
              },
            },
          },
          where: { isActive: true },
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Category updated successfully",
      data: {
        id: updatedCategory.id,
        name: updatedCategory.name,
        description: updatedCategory.description,
        isActive: updatedCategory.isActive,
        parentId: updatedCategory.parentId,
        parent: updatedCategory.parent,
        children: updatedCategory.children,
        productCount: updatedCategory._count.products,
        subcategoryCount: updatedCategory._count.children,
        createdAt: updatedCategory.createdAt.toISOString(),
        updatedAt: updatedCategory.updatedAt.toISOString(),
      },
    });
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

    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: "Account not active" },
        { status: 403 }
      );
    }

    // Check permissions - only admins can delete categories
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const categoryId = parseInt(id);

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: "Invalid category ID" },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check if category has products
    if (existingCategory._count.products > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete category with associated products",
          details: `This category has ${existingCategory._count.products} associated products`,
        },
        { status: 400 }
      );
    }

    // Check if category has subcategories
    if (existingCategory._count.children > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete category with subcategories",
          details: `This category has ${existingCategory._count.children} subcategories`,
        },
        { status: 400 }
      );
    }

    // Delete the category
    await prisma.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
