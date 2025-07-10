import { auth } from "../../../../../auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  supplierIdSchema,
  updateSupplierSchema,
} from "@/lib/validations/supplier";

// GET /api/suppliers/[id] - Get a specific supplier
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params first, then validate supplier ID
    const resolvedParams = await params;
    const { id } = supplierIdSchema.parse(resolvedParams);

    const supplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // Transform database field names to frontend field names
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
      notes: supplier.notes,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
    };

    return NextResponse.json({ data: transformedSupplier });
  } catch (error) {
    console.error("Error in GET /api/suppliers/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/suppliers/[id] - Update a supplier
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
          name: validatedData.name,
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

    // Prepare update data - map frontend field names to database field names
    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.contactPerson !== undefined)
      updateData.contactPerson = validatedData.contactPerson;
    if (validatedData.email !== undefined)
      updateData.email = validatedData.email;
    if (validatedData.phone !== undefined)
      updateData.phone = validatedData.phone;
    if (validatedData.address !== undefined)
      updateData.address = validatedData.address;
    if (validatedData.city !== undefined) updateData.city = validatedData.city;
    if (validatedData.state !== undefined)
      updateData.state = validatedData.state;
    if (validatedData.country !== undefined)
      updateData.country = validatedData.country;
    if (validatedData.postalCode !== undefined)
      updateData.postalCode = validatedData.postalCode;
    if (validatedData.taxNumber !== undefined)
      updateData.taxNumber = validatedData.taxNumber;
    if (validatedData.paymentTerms !== undefined)
      updateData.paymentTerms = validatedData.paymentTerms;
    if (validatedData.creditLimit !== undefined)
      updateData.creditLimit = validatedData.creditLimit;
    if (validatedData.isActive !== undefined)
      updateData.isActive = validatedData.isActive;
    if (validatedData.notes !== undefined)
      updateData.notes = validatedData.notes;

    // Update the supplier
    const supplier = await prisma.supplier.update({
      where: { id },
      data: updateData,
    });

    // Transform database field names to frontend field names
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
      notes: supplier.notes,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
    };

    return NextResponse.json({ data: transformedSupplier });
  } catch (error) {
    console.error("Error in PUT /api/suppliers/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/suppliers/[id] - Delete or deactivate a supplier
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params first, then validate supplier ID
    const resolvedParams = await params;
    const { id } = supplierIdSchema.parse(resolvedParams);

    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get("hard") === "true";

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

    if (hardDelete) {
      // Check for related records that would prevent deletion
      const products = await prisma.product.findFirst({
        where: { supplierId: id },
        select: { id: true },
      });

      if (products) {
        return NextResponse.json(
          {
            error:
              "Cannot delete supplier with existing products. Use deactivation instead.",
          },
          { status: 409 }
        );
      }

      // Hard delete
      await prisma.supplier.delete({
        where: { id },
      });

      return NextResponse.json({
        message: "Supplier deleted successfully",
      });
    } else {
      // Soft delete (deactivate)
      const supplier = await prisma.supplier.update({
        where: { id },
        data: { isActive: false },
        select: { id: true, name: true, isActive: true },
      });

      return NextResponse.json({
        data: supplier,
        message: "Supplier deactivated successfully",
      });
    }
  } catch (error) {
    console.error("Error in DELETE /api/suppliers/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/suppliers/[id] - Update supplier status or other fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
        data: supplier,
        message: `Supplier ${action} successfully`,
      });
    }

    // Handle other patch operations (can be extended later)
    return NextResponse.json(
      { error: "Invalid patch operation" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in PATCH /api/suppliers/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
