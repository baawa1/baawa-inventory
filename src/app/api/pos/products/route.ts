import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check user status and role (POS requires at least STAFF role)
    const user = session.user;
    if (!["APPROVED", "VERIFIED"].includes(user.status)) {
      return NextResponse.json(
        { error: "Account not approved" },
        { status: 403 }
      );
    }

    if (!["ADMIN", "MANAGER", "STAFF"].includes(user.role || "")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "0"); // 0 means fetch all
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");

    // Build where clause
    const whereClause: any = {
      status: "active",
      stock: {
        gt: 0, // Only show products with stock
      },
    };

    if (category) {
      whereClause.category = {
        name: {
          contains: category,
          mode: "insensitive",
        },
      };
    }

    if (brand) {
      whereClause.brand = {
        name: {
          contains: brand,
          mode: "insensitive",
        },
      };
    }

    // Calculate pagination (skip pagination if limit is 0)
    const skip = limit > 0 ? (page - 1) * limit : 0;
    const take = limit > 0 ? limit : undefined;

    // Fetch products
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          brand: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ name: "asc" }, { createdAt: "desc" }],
        skip,
        take,
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    // Format response
    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      price: product.price,
      stock: product.stock,
      status: product.status,
      category: product.category?.name || "Uncategorized",
      brand: product.brand?.name || "No Brand",
      description: product.description,
    }));

    // Return products directly if no pagination requested
    if (limit === 0) {
      return NextResponse.json(formattedProducts);
    }

    return NextResponse.json({
      products: formattedProducts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
