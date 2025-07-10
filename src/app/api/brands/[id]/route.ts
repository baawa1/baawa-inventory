import { auth } from "../../../../../auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { brandIdSchema, updateBrandSchema } from "@/lib/validations/brand";

// GET /api/brands/[id] - Get a specific brand
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params first, then validate brand ID
    const resolvedParams = await params;
    const { id } = brandIdSchema.parse(resolvedParams);

    const brand = await prisma.brand.findUnique({
      where: { id },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      brand,
    });
  } catch (error) {
    console.error("Get brand API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/brands/[id] - Update a specific brand
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params first, then validate brand ID
    const resolvedParams = await params;
    const { id } = brandIdSchema.parse(resolvedParams);

    const body = await request.json();
    const validatedData = updateBrandSchema.parse({ ...body, id });

    // Check if brand exists
    const existingBrand = await prisma.brand.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingBrand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Check if name is already taken by another brand
    if (validatedData.name) {
      const nameCheck = await prisma.brand.findFirst({
        where: {
          name: validatedData.name,
          id: { not: id },
        },
        select: { id: true },
      });

      if (nameCheck) {
        return NextResponse.json(
          { error: "Brand name already exists" },
          { status: 400 }
        );
      }
    }

    // Prepare update data - remove id and handle field mapping
    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined)
      updateData.description = validatedData.description;
    if (validatedData.website !== undefined)
      updateData.website = validatedData.website;
    if (validatedData.is_active !== undefined)
      updateData.isActive = validatedData.is_active;

    // Update the brand
    const brand = await prisma.brand.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      brand,
    });
  } catch (error) {
    console.error("Update brand API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/brands/[id] - Delete a specific brand
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params first, then validate brand ID
    const resolvedParams = await params;
    const { id } = brandIdSchema.parse(resolvedParams);

    // Check if brand exists
    const existingBrand = await prisma.brand.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingBrand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Check if brand is being used by products
    const products = await prisma.product.findFirst({
      where: { brandId: id },
      select: { id: true },
    });

    if (products) {
      return NextResponse.json(
        { error: "Cannot delete brand that is being used by products" },
        { status: 400 }
      );
    }

    // Delete the brand
    await prisma.brand.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Brand deleted successfully",
    });
  } catch (error) {
    console.error("Delete brand API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
