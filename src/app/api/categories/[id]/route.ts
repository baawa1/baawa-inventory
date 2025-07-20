import { NextResponse } from "next/server";
import {
  withAuth,
  withPermission,
  AuthenticatedRequest,
} from "@/lib/api-middleware";
import { handleApiError } from "@/lib/api-error-handler";
import { prisma } from "@/lib/db";
import { USER_ROLES } from "@/lib/auth/roles";
import { z } from "zod";

const CategoryUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  image: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
  parentId: z.number().optional(),
});

// GET /api/categories/[id] - Get category by ID
export const GET = withAuth(
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
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

      // Transform the response
      const transformedCategory = {
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
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      };

      return NextResponse.json({
        success: true,
        data: transformedCategory,
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);

// PUT /api/categories/[id] - Update category
export const PUT = withPermission(
  [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await params;
      const categoryId = parseInt(id);
      const body = await request.json();
      const validatedData = CategoryUpdateSchema.parse(body);

      if (isNaN(categoryId)) {
        return NextResponse.json(
          { error: "Invalid category ID" },
          { status: 400 }
        );
      }

      // Check if category exists
      const existingCategory = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true, name: true, parentId: true },
      });

      if (!existingCategory) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }

      // If parentId is being updated, verify the new parent exists
      if (validatedData.parentId !== undefined) {
        if (validatedData.parentId === categoryId) {
          return NextResponse.json(
            { error: "Category cannot be its own parent" },
            { status: 400 }
          );
        }

        if (validatedData.parentId !== null) {
          const parentCategory = await prisma.category.findUnique({
            where: { id: validatedData.parentId },
            select: { id: true, isActive: true },
          });

          if (!parentCategory) {
            return NextResponse.json(
              { error: "Parent category not found" },
              { status: 404 }
            );
          }

          if (!parentCategory.isActive) {
            return NextResponse.json(
              { error: "Cannot set inactive category as parent" },
              { status: 400 }
            );
          }
        }
      }

      // Check if the new name conflicts with existing categories at the same level
      if (validatedData.name && validatedData.name !== existingCategory.name) {
        const parentId =
          validatedData.parentId !== undefined
            ? validatedData.parentId
            : existingCategory.parentId;

        const nameConflict = await prisma.category.findFirst({
          where: {
            name: {
              equals: validatedData.name,
              mode: "insensitive",
            },
            parentId: parentId,
            id: { not: categoryId },
          },
        });

        if (nameConflict) {
          return NextResponse.json(
            { error: "Category with this name already exists at this level" },
            { status: 409 }
          );
        }
      }

      // Update the category
      const updatedCategory = await prisma.category.update({
        where: { id: categoryId },
        data: validatedData,
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

      // Transform the response
      const transformedCategory = {
        id: updatedCategory.id,
        name: updatedCategory.name,
        description: updatedCategory.description,
        image: updatedCategory.image,
        isActive: updatedCategory.isActive,
        parentId: updatedCategory.parentId,
        parent: updatedCategory.parent,
        children: updatedCategory.children,
        productCount: updatedCategory._count.products,
        subcategoryCount: updatedCategory._count.children,
        createdAt: updatedCategory.createdAt,
        updatedAt: updatedCategory.updatedAt,
      };

      return NextResponse.json({
        success: true,
        message: "Category updated successfully",
        data: transformedCategory,
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);

// DELETE /api/categories/[id] - Delete category
export const DELETE = withPermission(
  [USER_ROLES.ADMIN],
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
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
        success: true,
        message: "Category deleted successfully",
        data: { id: categoryId, name: existingCategory.name },
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);
