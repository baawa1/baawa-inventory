import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { prisma } from "@/lib/db";

interface CategoryPerformance {
  id: number;
  name: string;
  productCount: number;
  totalSold: number;
  revenue: number;
  averageOrderValue: number;
  marketShare: number;
  trending: "up" | "down" | "stable";
  trendPercentage: number;
  topProduct: {
    name: string;
    revenue: number;
  } | null;
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
    const periodStart = getPeriodFilter(period);

    // Get all categories with their products and sales data
    const categories = await prisma.category.findMany({
      include: {
        products: {
          include: {
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
        },
      },
    });

    // Calculate total revenue across all categories for market share
    const totalRevenue = categories.reduce((total, category) => {
      const categoryRevenue = category.products.reduce((catTotal, product) => {
        return (
          catTotal +
          product.sales_items.reduce((prodTotal, item) => {
            return prodTotal + Number(item.total_price);
          }, 0)
        );
      }, 0);
      return total + categoryRevenue;
    }, 0);

    // Transform the data into performance metrics
    const categoryPerformance: CategoryPerformance[] = categories
      .map((category) => {
        const productCount = category.products.length;

        // Calculate totals for this category
        let totalSold = 0;
        let revenue = 0;
        let totalTransactions = 0;
        const productRevenues: {
          productId: number;
          name: string;
          revenue: number;
        }[] = [];

        category.products.forEach((product) => {
          let productRevenue = 0;
          let productSold = 0;

          product.sales_items.forEach((item) => {
            productSold += item.quantity;
            productRevenue += Number(item.total_price);
            totalTransactions += 1;
          });

          totalSold += productSold;
          revenue += productRevenue;

          if (productRevenue > 0) {
            productRevenues.push({
              productId: product.id,
              name: product.name,
              revenue: productRevenue,
            });
          }
        });

        // Find top product by revenue
        const topProduct =
          productRevenues.length > 0
            ? productRevenues.sort((a, b) => b.revenue - a.revenue)[0]
            : null;

        const averageOrderValue =
          totalTransactions > 0 ? revenue / totalTransactions : 0;
        const marketShare =
          totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;

        // Calculate trend (simplified - comparing to previous period)
        const previousPeriodStart = new Date(
          periodStart.getTime() - (Date.now() - periodStart.getTime())
        );
        let previousRevenue = 0;

        category.products.forEach((product) => {
          product.sales_items.forEach((item) => {
            const saleDate = item.sales_transactions?.created_at;
            if (
              saleDate &&
              saleDate >= previousPeriodStart &&
              saleDate < periodStart
            ) {
              previousRevenue += Number(item.total_price);
            }
          });
        });

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
          id: category.id,
          name: category.name,
          productCount,
          totalSold,
          revenue,
          averageOrderValue,
          marketShare,
          trending,
          trendPercentage,
          topProduct: topProduct
            ? {
                name: topProduct.name,
                revenue: topProduct.revenue,
              }
            : null,
        };
      })
      .filter((category) => category.productCount > 0); // Only include categories with products

    return NextResponse.json(categoryPerformance);
  } catch (error) {
    console.error("Error fetching category performance:", error);
    return NextResponse.json(
      { error: "Failed to fetch category performance" },
      { status: 500 }
    );
  }
}
