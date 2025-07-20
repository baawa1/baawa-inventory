import { NextResponse } from "next/server";
import {
  withAuth,
  withPermission,
  AuthenticatedRequest,
} from "@/lib/api-middleware";
import { handleApiError } from "@/lib/api-error-handler";
import { prisma } from "@/lib/db";
import { USER_ROLES } from "@/lib/auth/roles";
import {
  supplierIdSchema,
  updateSupplierSchema,
} from "@/lib/validations/supplier";

// GET /api/suppliers/[id] - Get a specific supplier
export const GET = withAuth(
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      // Await params first, then validate supplier ID
      const resolvedParams = await params;
      const { id } = supplierIdSchema.parse(resolvedParams);

      const supplier = await prisma.supplier.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      });

      if (!supplier) {
        return NextResponse.json(
          { error: "Supplier not found" },
          { status: 404 }
        );
      }

      // Transform response to include product count
      const transformedSupplier = {
        id: supplier.id,
        name: supplier.name,
        contactPerson: supplier.contactPerson,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        city: supplier.city,
        state: supplier.state,
        country: supplier.country,
        postalCode: supplier.postalCode,
        taxId: supplier.taxNumber,
        paymentTerms: supplier.paymentTerms,
        creditLimit: supplier.creditLimit,
        isActive: supplier.isActive,
        productCount: supplier._count.products,
        createdAt: supplier.createdAt,
        updatedAt: supplier.updatedAt,
      };

      return NextResponse.json({
        success: true,
        data: transformedSupplier,
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);

// PUT /api/suppliers/[id] - Update a supplier
export const PUT = withPermission(
  [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      // Await params first, then validate supplier ID
      const resolvedParams = await params;
      const { id } = supplierIdSchema.parse(resolvedParams);

      const body = await request.json();
      const validatedData = updateSupplierSchema.parse(body);

      // Check if supplier exists
      const existingSupplier = await prisma.supplier.findUnique({
        where: { id },
        select: { id: true, name: true },
      });

      if (!existingSupplier) {
        return NextResponse.json(
          { error: "Supplier not found" },
          { status: 404 }
        );
      }

      // If name is being updated, check for conflicts
      if (validatedData.name && validatedData.name !== existingSupplier.name) {
        const conflictSupplier = await prisma.supplier.findFirst({
          where: {
            name: {
              equals: validatedData.name,
              mode: "insensitive",
            },
            id: { not: id },
          },
          select: { id: true },
        });

        if (conflictSupplier) {
          return NextResponse.json(
            { error: "Supplier with this name already exists" },
            { status: 409 }
          );
        }
      }

      // Update the supplier
      const updatedSupplier = await prisma.supplier.update({
        where: { id },
        data: {
          name: validatedData.name,
          contactPerson: validatedData.contactPerson,
          email: validatedData.email,
          phone: validatedData.phone,
          address: validatedData.address,
          city: validatedData.city,
          state: validatedData.state,
          country: validatedData.country,
          postalCode: validatedData.postalCode,
          taxNumber: validatedData.taxNumber,
          paymentTerms: validatedData.paymentTerms,
          creditLimit: validatedData.creditLimit,
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

      // Transform response
      const transformedSupplier = {
        id: updatedSupplier.id,
        name: updatedSupplier.name,
        contactPerson: updatedSupplier.contactPerson,
        email: updatedSupplier.email,
        phone: updatedSupplier.phone,
        address: updatedSupplier.address,
        city: updatedSupplier.city,
        state: updatedSupplier.state,
        country: updatedSupplier.country,
        postalCode: updatedSupplier.postalCode,
        taxId: updatedSupplier.taxNumber,
        paymentTerms: updatedSupplier.paymentTerms,
        creditLimit: updatedSupplier.creditLimit,
        isActive: updatedSupplier.isActive,
        productCount: updatedSupplier._count.products,
        createdAt: updatedSupplier.createdAt,
        updatedAt: updatedSupplier.updatedAt,
      };

      return NextResponse.json({
        success: true,
        message: "Supplier updated successfully",
        data: transformedSupplier,
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);

// DELETE /api/suppliers/[id] - Delete a supplier
export const DELETE = withPermission(
  [USER_ROLES.ADMIN],
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      // Await params first, then validate supplier ID
      const resolvedParams = await params;
      const { id } = supplierIdSchema.parse(resolvedParams);

      // Check if supplier exists
      const existingSupplier = await prisma.supplier.findUnique({
        where: { id },
        select: { id: true, name: true },
      });

      if (!existingSupplier) {
        return NextResponse.json(
          { error: "Supplier not found" },
          { status: 404 }
        );
      }

      // Check if supplier has associated products
      const productsCount = await prisma.product.count({
        where: { supplierId: id },
      });

      if (productsCount > 0) {
        return NextResponse.json(
          {
            error: "Cannot delete supplier with associated products",
            details: `This supplier has ${productsCount} products associated with it`,
          },
          { status: 400 }
        );
      }

      // Delete the supplier
      await prisma.supplier.delete({
        where: { id },
      });

      return NextResponse.json({
        success: true,
        message: "Supplier deleted successfully",
        data: { id, name: existingSupplier.name },
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);

// PATCH /api/suppliers/[id] - Update supplier status or other fields
export const PATCH = withPermission(
  [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      // Await params first, then validate supplier ID
      const resolvedParams = await params;
      const { id } = supplierIdSchema.parse(resolvedParams);

      // Parse request body
      const body = await request.json();

      // Check if this is a status update (reactivation/deactivation)
      if (body.hasOwnProperty("isActive")) {
        const supplier = await prisma.supplier.update({
          where: { id },
          data: { isActive: body.isActive },
          select: { id: true, name: true, isActive: true },
        });

        const action = body.isActive ? "reactivated" : "deactivated";
        return NextResponse.json({
          success: true,
          message: `Supplier ${action} successfully`,
          data: supplier,
        });
      }

      // Handle other patch operations (can be extended later)
      return NextResponse.json(
        { error: "Invalid patch operation" },
        { status: 400 }
      );
    } catch (error) {
      return handleApiError(error);
    }
  }
);
