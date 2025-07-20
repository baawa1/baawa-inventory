import { withAuth, AuthenticatedRequest } from "@/lib/api-middleware";
import { createApiResponse } from "@/lib/api-response";
import { prisma } from "@/lib/db";

// GET /api/inventory/stats - Get inventory statistics
export const GET = withAuth(async (_request: AuthenticatedRequest) => {
  try {
    // Get total products
    const totalProducts = await prisma.product.count({
      where: { isArchived: false },
    });

    // Get low stock items (stock <= 10)
    const lowStockItems = await prisma.product.count({
      where: {
        AND: [{ isArchived: false }, { stock: { lte: 10 } }],
      },
    });

    // Get total stock value
    const productsWithValue = await prisma.product.findMany({
      where: { isArchived: false },
      select: {
        stock: true,
        price: true,
      },
    });

    const totalStockValue = productsWithValue.reduce(
      (sum, product) => sum + product.stock * Number(product.price),
      0
    );

    // Get active suppliers
    const activeSuppliers = await prisma.supplier.count({
      where: { isActive: true },
    });

    // Get recent sales (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSales = await prisma.salesTransaction.count({
      where: {
        created_at: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Get stock movement (stock additions in last 7 days)
    const stockMovement = await prisma.stockAddition.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    return createApiResponse.success(
      {
        totalProducts,
        lowStockItems,
        totalStockValue,
        activeSuppliers,
        recentSales,
        stockMovement,
      },
      "Inventory statistics retrieved successfully"
    );
  } catch (error) {
    console.error("Error fetching inventory stats:", error);
    return createApiResponse.internalError("Failed to fetch inventory stats");
  }
});
