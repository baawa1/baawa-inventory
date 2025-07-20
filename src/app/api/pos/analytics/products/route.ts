import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { prisma } from "@/lib/db";

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

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to view analytics
    if (!["ADMIN", "MANAGER", "STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
              payment_status: "paid",
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
    });

    // Transform the data into performance metrics
    const productPerformance: ProductPerformance[] = products.map((product) => {
      const salesItems = product.sales_items;
      const totalSold = salesItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const revenue = salesItems.reduce(
        (sum, item) => sum + Number(item.total_price),
        0
      );
      const averageOrderValue =
        salesItems.length > 0 ? revenue / salesItems.length : 0;

      // Get the most recent sale date
      const saleDates = salesItems
        .map((item) => item.sales_transactions?.created_at)
        .filter(Boolean)
        .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime());

      const lastSold =
        saleDates.length > 0 ? saleDates[0]!.toISOString() : null;

      // Calculate trend (simplified - comparing to previous period)
      const previousPeriodStart = new Date(
        periodStart.getTime() - (Date.now() - periodStart.getTime())
      );
      const previousSalesItems = product.sales_items.filter((item) => {
        const saleDate = item.sales_transactions?.created_at;
        return (
          saleDate && saleDate >= previousPeriodStart && saleDate < periodStart
        );
      });

      const previousRevenue = previousSalesItems.reduce(
        (sum, item) => sum + Number(item.total_price),
        0
      );
      let trending: "up" | "down" | "stable" = "stable";
      let trendPercentage = 0;

      if (previousRevenue > 0) {
        const change = ((revenue - previousRevenue) / previousRevenue) * 100;
        trendPercentage = Math.abs(Math.round(change));
        if (change > 5) trending = "up";
        else if (change < -5) trending = "down";
      } else if (revenue > 0) {
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
        lastSold,
        trending,
        trendPercentage,
      };
    });

    // Sort the results
    productPerformance.sort((a, b) => {
      switch (sortBy) {
        case "revenue":
          return b.revenue - a.revenue;
        case "totalSold":
          return b.totalSold - a.totalSold;
        case "averageOrderValue":
          return b.averageOrderValue - a.averageOrderValue;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return b.revenue - a.revenue;
      }
    });

    return NextResponse.json(productPerformance);
  } catch (error) {
    console.error("Error fetching product performance:", error);
    return NextResponse.json(
      { error: "Failed to fetch product performance" },
      { status: 500 }
    );
  }
}
