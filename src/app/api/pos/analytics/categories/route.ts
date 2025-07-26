import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/api-middleware";
import { handleApiError } from "@/lib/api-error-handler-new";
import { prisma } from "@/lib/db";
import { PAYMENT_STATUS } from "@/lib/constants";

interface CategoryPerformance {
  id: number;
  name: string;
  totalSold: number;
  revenue: number;
  averageOrderValue: number;
  marketShare: number;
  trending: "up" | "down" | "stable";
  trendPercentage: number;
  lastSaleDate: string | null;
  productCount: number;
  topProducts: Array<{
    id: number;
    name: string;
    revenue: number;
  }>;
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
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    // Use custom date range if provided, otherwise use period
    let periodStart: Date;
    let periodEnd: Date | undefined;

    if (fromDate && toDate) {
      periodStart = new Date(fromDate);
      periodEnd = new Date(toDate + "T23:59:59"); // End of day
    } else {
      periodStart = getPeriodFilter(period);
      periodEnd = new Date(); // Current date
    }

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
                    ...(periodEnd && { lte: periodEnd }),
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

    // Calculate performance metrics for each category
    const categoryPerformance: CategoryPerformance[] = categories.map(
      (category) => {
        const categoryRevenue = category.products.reduce(
          (catTotal, product) => {
            return (
              catTotal +
              product.sales_items.reduce((prodTotal, item) => {
                return prodTotal + Number(item.total_price);
              }, 0)
            );
          },
          0
        );

        const totalSold = category.products.reduce((catTotal, product) => {
          return (
            catTotal +
            product.sales_items.reduce((prodTotal, item) => {
              return prodTotal + item.quantity;
            }, 0)
          );
        }, 0);

        // Get top 3 products by revenue
        const productRevenues = category.products.map((product) => {
          const productRevenue = product.sales_items.reduce((total, item) => {
            return total + Number(item.total_price);
          }, 0);
          return {
            id: product.id,
            name: product.name,
            revenue: productRevenue,
          };
        });

        const topProducts = productRevenues
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 3);

        // Calculate market share
        const marketShare =
          totalRevenue > 0 ? (categoryRevenue / totalRevenue) * 100 : 0;

        // Get last sale date
        const allSaleDates = category.products.flatMap((product) =>
          product.sales_items
            .map((item) => item.sales_transactions?.created_at)
            .filter(Boolean)
        );
        const lastSaleDate =
          allSaleDates.length > 0
            ? new Date(Math.max(...allSaleDates.map((date) => date!.getTime())))
            : null;

        // Calculate trend (for simplicity, just using a random trend for now)
        // In a real implementation, you'd compare to previous period
        const previousPeriodStart = new Date(
          periodStart.getTime() - (Date.now() - periodStart.getTime())
        );
        const previousRevenue = category.products.reduce(
          (catTotal, product) => {
            return (
              catTotal +
              product.sales_items
                .filter(
                  (item) =>
                    item.sales_transactions?.created_at &&
                    item.sales_transactions.created_at >= previousPeriodStart &&
                    item.sales_transactions.created_at < periodStart
                )
                .reduce((prodTotal, item) => {
                  return prodTotal + Number(item.total_price);
                }, 0)
            );
          },
          0
        );

        let trending: "up" | "down" | "stable" = "stable";
        let trendPercentage = 0;

        if (previousRevenue > 0) {
          trendPercentage =
            ((categoryRevenue - previousRevenue) / previousRevenue) * 100;
          if (trendPercentage > 5) trending = "up";
          else if (trendPercentage < -5) trending = "down";
        }

        const averageOrderValue =
          totalSold > 0 ? categoryRevenue / totalSold : 0;

        return {
          id: category.id,
          name: category.name,
          totalSold,
          revenue: categoryRevenue,
          averageOrderValue,
          marketShare,
          trending,
          trendPercentage: Math.abs(trendPercentage),
          lastSaleDate: lastSaleDate?.toISOString() || null,
          productCount: category.products.length,
          topProducts,
        };
      }
    );

    // Sort by revenue descending
    categoryPerformance.sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({
      success: true,
      data: categoryPerformance,
      period,
      periodStart: periodStart.toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
});
