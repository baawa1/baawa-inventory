import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Validation schema for search parameters
const searchParamsSchema = z.object({
  search: z.string().min(1, "Search term is required"),
  limit: z.string().optional().default("20"),
  status: z.string().optional().default("active"),
});

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check user status and role (POS requires at least STAFF role)
    const user = session.user;
    if (user.status !== "APPROVED") {
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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const validatedParams = searchParamsSchema.parse({
      search: searchParams.get("search"),
      limit: searchParams.get("limit"),
      status: searchParams.get("status"),
    });

    const { search, limit, status } = validatedParams;
    const limitNum = parseInt(limit);

    // Build search conditions
    const searchConditions = {
      AND: [
        {
          status: status as "active" | "inactive" | "discontinued",
        },
        {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              sku: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              barcode: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              category: {
                name: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
            {
              brand: {
                name: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        },
      ],
    };

    // Search products
    const products = await prisma.product.findMany({
      where: searchConditions,
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
      orderBy: [
        { stock: "desc" }, // Show in-stock products first
        { name: "asc" },
      ],
      take: limitNum,
    });

    // Format response
    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      price: product.price,
      stock: product.stock,
      status: product.status,
      category: product.category,
      brand: product.brand,
      description: product.description,
    }));

    return NextResponse.json({
      products: formattedProducts,
      total: formattedProducts.length,
    });
  } catch (error) {
    console.error("Error searching products for POS:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid parameters", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
