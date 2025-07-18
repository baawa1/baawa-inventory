import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Validation schema for brand creation
const BrandCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  image: z.string().max(500).optional(),
  website: z.string().url().optional(),
  isActive: z.boolean().default(true),
});

// GET /api/brands - List all brands
export async function GET(request: NextRequest) {
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

    // Build where clause
    const where: any = {};

    if (isActive !== null && isActive !== "") {
      where.isActive = isActive === "true";
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.brand.count({ where });

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const brands = await prisma.brand.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        website: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    // Transform the response
    const transformedBrands = brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
      description: brand.description,
      image: brand.image,
      website: brand.website,
      isActive: brand.isActive,
      productCount: brand._count.products,
      createdAt: brand.createdAt?.toISOString(),
      updatedAt: brand.updatedAt?.toISOString(),
    }));

    return NextResponse.json({
      data: transformedBrands,
      pagination: {
        page: page,
        limit: limit,
        totalPages: totalPages,
        total: totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching brands:", error);
    return NextResponse.json(
      { error: "Failed to fetch brands" },
      { status: 500 }
    );
  }
}

// POST /api/brands - Create new brand
export async function POST(request: NextRequest) {
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
        { error: "Account not approved" },
        { status: 403 }
      );
    }

    // Check permissions - only admins and managers can create brands
    if (!["ADMIN", "MANAGER"].includes(session.user.role as string)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = BrandCreateSchema.parse(body);

    // Check if brand name already exists
    const existingBrand = await prisma.brand.findFirst({
      where: {
        name: {
          equals: validatedData.name,
          mode: "insensitive",
        },
      },
    });

    if (existingBrand) {
      return NextResponse.json(
        { error: "Brand with this name already exists" },
        { status: 400 }
      );
    }

    // Create the brand
    const brand = await prisma.brand.create({
      data: validatedData,
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        website: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Brand created successfully",
        data: {
          id: brand.id,
          name: brand.name,
          description: brand.description,
          image: brand.image,
          website: brand.website,
          isActive: brand.isActive,
          productCount: 0,
          createdAt: brand.createdAt?.toISOString(),
          updatedAt: brand.updatedAt?.toISOString(),
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

    console.error("Error creating brand:", error);
    return NextResponse.json(
      { error: "Failed to create brand" },
      { status: 500 }
    );
  }
}
