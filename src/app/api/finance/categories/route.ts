import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/lib/db";
import { financialCategorySchema } from "@/lib/validations/finance";
import { USER_ROLES, hasRole } from "@/lib/auth/roles";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions - only admin, manager, and staff can access
    if (!hasRole(session.user.role, [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const isActive = searchParams.get("isActive");

    const where: any = {};
    if (type) where.type = type;
    if (isActive !== null && isActive !== undefined) where.isActive = isActive === "true";

    const categories = await prisma.financialCategory.findMany({
      where,
      include: {
        children: true,
        parent: true,
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching financial categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions - only admin and manager can create categories
    if (!hasRole(session.user.role, [USER_ROLES.ADMIN, USER_ROLES.MANAGER])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = financialCategorySchema.parse(body);

    // Check if category with same name and type already exists
    const existingCategory = await prisma.financialCategory.findFirst({
      where: {
        name: validatedData.name,
        type: validatedData.type,
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Category with this name and type already exists" },
        { status: 400 }
      );
    }

    const category = await prisma.financialCategory.create({
      data: validatedData,
      include: {
        children: true,
        parent: true,
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating financial category:", error);
    
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}