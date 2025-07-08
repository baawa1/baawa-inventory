import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/auth/roles";
import {
  updateCategorySchema,
  categoryIdSchema,
} from "@/lib/validations/category";

// GET /api/categories/[id] - Get single category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to view categories
    if (!hasPermission(session.user.role, "INVENTORY_READ")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const validatedId = categoryIdSchema.parse({ id });

    const category = await prisma.category.findUnique({
      where: { id: validatedId.id },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Transform to match expected format (Prisma already returns camelCase)
    const transformedCategory = {
      id: category.id,
      name: category.name,
      description: category.description,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };

    return NextResponse.json(transformedCategory);
  } catch (error) {
    console.error("API error:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
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
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to update categories
    if (!hasPermission(session.user.role, "INVENTORY_WRITE")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const validatedId = categoryIdSchema.parse({ id });

    const body = await request.json();
    const validatedData = updateCategorySchema.parse({
      ...body,
      id: validatedId.id,
    });

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: validatedId.id },
      select: { id: true },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check if name is being changed and doesn't conflict with existing categories
    if (validatedData.name) {
      const nameConflict = await prisma.category.findFirst({
        where: {
          name: validatedData.name,
          id: { not: validatedId.id },
        },
        select: { id: true },
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: "Category with this name already exists" },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined)
      updateData.description = validatedData.description;
    if (validatedData.isActive !== undefined)
      updateData.isActive = validatedData.isActive;

    // Update the category
    const category = await prisma.category.update({
      where: { id: validatedId.id },
      data: updateData,
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

    return NextResponse.json(transformedCategory);
  } catch (error) {
    console.error("API error:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
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
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to delete categories
    if (!hasPermission(session.user.role, "INVENTORY_DELETE")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const validatedId = categoryIdSchema.parse({ id });

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: validatedId.id },
      select: { id: true, name: true },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check if category is being used by any products
    const productsUsing = await prisma.product.findFirst({
      where: {
        categoryId: validatedId.id,
        isArchived: false,
      },
      select: { id: true },
    });

    if (productsUsing) {
      return NextResponse.json(
        {
          error:
            "Cannot delete category that is being used by products. Archive it instead.",
        },
        { status: 400 }
      );
    }

    // Delete the category
    await prisma.category.delete({
      where: { id: validatedId.id },
    });

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("API error:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
