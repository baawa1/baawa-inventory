import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";

// GET /api/products/low-stock - Get products with low stock
export const GET = withAuth(
  async (request: AuthenticatedRequest): Promise<NextResponse> => {
    try {
      const { searchParams } = new URL(request.url);
      const threshold = parseInt(searchParams.get("threshold") || "10");
      const limit = parseInt(searchParams.get("limit") || "50");
      const page = parseInt(searchParams.get("page") || "1");

      const offset = (page - 1) * limit;

      // Get products where stock is below the threshold
      const products = await prisma.product.findMany({
        where: {
          AND: [{ isArchived: false }, { stock: { lte: threshold } }],
        },
        include: {
          category: { select: { name: true } },
          brand: { select: { name: true } },
          supplier: { select: { name: true } },
        },
        orderBy: [{ stock: "asc" }, { name: "asc" }],
        take: limit,
        skip: offset,
      });

      // Get total count for pagination
      const totalCount = await prisma.product.count({
        where: {
          AND: [{ isArchived: false }, { stock: { lte: threshold } }],
        },
      });

      return NextResponse.json({
        data: products,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
        meta: {
          threshold,
          count: products.length,
        },
      });
    } catch (error) {
      console.error("Error fetching low stock products:", error);
      return NextResponse.json(
        { error: "Failed to fetch low stock products" },
        { status: 500 }
      );
    }
  }
);
