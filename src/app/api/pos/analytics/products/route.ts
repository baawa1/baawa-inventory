import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/api-middleware";
import { handleApiError } from "@/lib/api-error-handler";
import { prisma } from "@/lib/db";
import { PAYMENT_STATUS } from "@/lib/constants";

interface ProductPerformance {
  id: number;
  name: string;
  sku: string;
  category: string | null;
  brand: string | null;
  currentStock: number;
  totalSold: number;
  revenue: number;
  averageOrderValue: number;
  lastSold: string | null;
  trending: "up" | "down" | "stable";
  trendPercentage: number;
}

// Helper function to get date filter based on period
function getPeriodFilter(period: string): Date {
  const now = new Date();
  switch (period) {
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "1y":
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "all";
    const sortBy = searchParams.get("sortBy") || "revenue";

    const periodStart = getPeriodFilter(period);

    // Build where clause for product filtering
    const productWhere: any = {};

    if (search) {
      productWhere.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category !== "all") {
      productWhere.categoryId = parseInt(category);
    }

    // Get products with their sales data
    const products = await prisma.product.findMany({
      where: productWhere,
      include: {
        category: {
          select: { name: true },
        },
        brand: {
          select: { name: true },
        },
        sales_items: {
          where: {
            sales_transactions: {
              created_at: {
                gte: periodStart,
              },
              payment_status: PAYMENT_STATUS.PAID,
            },
          },
          include: {
            sales_transactions: {
              select: {
                created_at: true,
              },
            },
          },
        },
      },
      take: 100, // Limit for performance
    });

    // Transform to performance data
    const productPerformance: ProductPerformance[] = products.map((product) => {
      const salesItems = product.sales_items || [];
      const totalSold = salesItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const revenue = salesItems.reduce(
        (sum, item) => sum + Number(item.total_price),
        0
      );
      const averageOrderValue = totalSold > 0 ? revenue / totalSold : 0;

      // Find last sold date
      const lastSold =
        salesItems.length > 0
          ? salesItems
              .map((item) => item.sales_transactions?.created_at)
              .filter(Boolean)
              .sort(
                (a, b) => new Date(b!).getTime() - new Date(a!).getTime()
              )[0]
          : null;

      // Calculate trend (simplified - compare current period with previous period)
      const halfPeriodStart = new Date(
        periodStart.getTime() + (Date.now() - periodStart.getTime()) / 2
      );

      const recentSales = salesItems.filter(
        (item) =>
          item.sales_transactions?.created_at &&
          new Date(item.sales_transactions.created_at) >= halfPeriodStart
      );

      const olderSales = salesItems.filter(
        (item) =>
          item.sales_transactions?.created_at &&
          new Date(item.sales_transactions.created_at) < halfPeriodStart
      );

      const recentRevenue = recentSales.reduce(
        (sum, item) => sum + Number(item.total_price),
        0
      );
      const olderRevenue = olderSales.reduce(
        (sum, item) => sum + Number(item.total_price),
        0
      );

      let trending: "up" | "down" | "stable" = "stable";
      let trendPercentage = 0;

      if (olderRevenue > 0) {
        const change = ((recentRevenue - olderRevenue) / olderRevenue) * 100;
        trendPercentage = Math.abs(change);

        if (change > 5) trending = "up";
        else if (change < -5) trending = "down";
      } else if (recentRevenue > 0) {
        trending = "up";
        trendPercentage = 100;
      }

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category?.name || null,
        brand: product.brand?.name || null,
        currentStock: product.stock,
        totalSold,
        revenue,
        averageOrderValue,
        lastSold: lastSold?.toISOString() || null,
        trending,
        trendPercentage: Math.round(trendPercentage),
      };
    });

    // Sort by the requested criteria
    productPerformance.sort((a, b) => {
      switch (sortBy) {
        case "revenue":
          return b.revenue - a.revenue;
        case "quantity":
          return b.totalSold - a.totalSold;
        case "name":
          return a.name.localeCompare(b.name);
        case "stock":
          return b.currentStock - a.currentStock;
        case "lastSold":
          if (!a.lastSold && !b.lastSold) return 0;
          if (!a.lastSold) return 1;
          if (!b.lastSold) return -1;
          return (
            new Date(b.lastSold).getTime() - new Date(a.lastSold).getTime()
          );
        default:
          return b.revenue - a.revenue;
      }
    });

    // Calculate summary statistics
    const totalProducts = productPerformance.length;
    const totalRevenue = productPerformance.reduce(
      (sum, p) => sum + p.revenue,
      0
    );
    const totalSold = productPerformance.reduce(
      (sum, p) => sum + p.totalSold,
      0
    );
    const averageRevenue = totalProducts > 0 ? totalRevenue / totalProducts : 0;

    return NextResponse.json({
      success: true,
      data: {
        products: productPerformance,
        summary: {
          totalProducts,
          totalRevenue,
          totalSold,
          averageRevenue,
        },
        period,
        periodStart: periodStart.toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
});
