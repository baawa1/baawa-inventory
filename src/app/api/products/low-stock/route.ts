import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";

// GET /api/products/low-stock - Get products with low stock
export const GET = withAuth(
  async (request: AuthenticatedRequest): Promise<NextResponse> => {
    try {
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get("limit") || "10");
      const offset = parseInt(searchParams.get("offset") || "0");
      const search = searchParams.get("search") || "";

      // Get all products first, then filter for low stock
      const allProducts = await prisma.product.findMany({
        where: {
          isArchived: false,
        },
        include: {
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
        },
        orderBy: [{ stock: "asc" }, { name: "asc" }],
      });

      // Filter for low stock products
      let allLowStockProducts = allProducts.filter(
        (product) => product.stock === 0 || product.stock <= product.minStock
      );

      // Apply search filter if provided
      if (search) {
        const searchLower = search.toLowerCase();
        allLowStockProducts = allLowStockProducts.filter(
          (product) =>
            product.name.toLowerCase().includes(searchLower) ||
            product.sku.toLowerCase().includes(searchLower) ||
            product.category?.name.toLowerCase().includes(searchLower) ||
            product.brand?.name.toLowerCase().includes(searchLower)
        );
      }

      // Calculate metrics
      const totalValue = allLowStockProducts.reduce(
        (sum, product) => sum + Number(product.stock) * Number(product.cost),
        0
      );

      const criticalStock = allLowStockProducts.filter(
        (product) =>
          product.stock === 0 || product.stock <= product.minStock * 0.5
      ).length;

      const lowStock = allLowStockProducts.filter(
        (product) => product.stock > 0 && product.stock <= product.minStock
      ).length;

      // Get paginated products
      const products = allLowStockProducts.slice(offset, offset + limit);

      // Transform products to match expected format
      const transformedProducts = products.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        stock: product.stock,
        minStock: product.minStock,
        cost: Number(product.cost),
        price: Number(product.price),
        status: product.status,
        category: product.category,
        brand: product.brand,
        supplier: product.supplier,
        createdAt: product.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: product.updatedAt?.toISOString() || new Date().toISOString(),
      }));

      return NextResponse.json({
        products: transformedProducts,
        pagination: {
          total: allLowStockProducts.length,
          limit,
          offset,
          hasMore: offset + limit < allLowStockProducts.length,
        },
        metrics: {
          totalValue,
          criticalStock,
          lowStock,
          totalProducts: allLowStockProducts.length,
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
