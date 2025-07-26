import { withAuth, AuthenticatedRequest } from "@/lib/api-middleware";
import { handleApiError } from "@/lib/api-error-handler-new";
import { createApiResponse } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { PAYMENT_STATUS } from "@/lib/constants";

interface SalesOverview {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  topSellingProducts: Array<{
    id: number;
    name: string;
    totalSold: number;
    revenue: number;
  }>;
  salesByPeriod: Array<{
    date: string;
    orders: number;
    grossSales: number;
    returns: number;
    coupons: number;
    netSales: number;
    taxes: number;
    shipping: number;
    totalSales: number;
  }>;
  recentTransactions: Array<{
    id: number;
    transactionNumber: string;
    customerName: string | null;
    totalAmount: number;
    createdAt: string;
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
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "7d";
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

    // Get total sales and orders
    const salesAggregates = await prisma.salesTransaction.aggregate({
      where: {
        created_at: {
          gte: periodStart,
          ...(periodEnd && { lte: periodEnd }),
        },
        payment_status: PAYMENT_STATUS.PAID,
      },
      _sum: {
        total_amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Get unique customers count
    const uniqueCustomers = await prisma.salesTransaction.findMany({
      where: {
        created_at: {
          gte: periodStart,
          ...(periodEnd && { lte: periodEnd }),
        },
        payment_status: PAYMENT_STATUS.PAID,
        customer_email: {
          not: null,
        },
      },
      select: {
        customer_email: true,
      },
      distinct: ["customer_email"],
    });

    // Get top selling products
    const topProducts = await prisma.salesItem.groupBy({
      by: ["product_id"],
      where: {
        sales_transactions: {
          created_at: {
            gte: periodStart,
            ...(periodEnd && { lte: periodEnd }),
          },
          payment_status: PAYMENT_STATUS.PAID,
        },
        product_id: {
          not: null,
        },
      },
      _sum: {
        quantity: true,
        total_price: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 5,
    });

    // Get product details for top products
    const productIds = topProducts
      .map((p: any) => p.product_id)
      .filter(Boolean) as number[];
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Format top selling products
    const topSellingProducts = topProducts.map((item: any) => {
      const product = products.find((p) => p.id === item.product_id);
      return {
        id: item.product_id || 0,
        name: product?.name || "Unknown Product",
        totalSold: item._sum.quantity || 0,
        revenue: Number(item._sum.total_price || 0),
      };
    });

    // Get sales by period (daily breakdown)
    const salesByDay = await prisma.salesTransaction.groupBy({
      by: ["created_at"],
      where: {
        created_at: {
          gte: periodStart,
          ...(periodEnd && { lte: periodEnd }),
        },
        payment_status: PAYMENT_STATUS.PAID,
      },
      _sum: {
        total_amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Group by date and format
    const salesByPeriod = salesByDay.reduce(
      (acc: Record<string, any>, item) => {
        const date = (item.created_at || new Date())
          .toISOString()
          .split("T")[0];
        if (!acc[date]) {
          acc[date] = {
            date,
            orders: 0,
            grossSales: 0,
            returns: 0,
            coupons: 0,
            netSales: 0,
            taxes: 0,
            shipping: 0,
            totalSales: 0,
          };
        }
        const salesAmount = Number(item._sum.total_amount || 0);
        acc[date].orders += item._count.id;
        acc[date].grossSales += salesAmount;
        acc[date].netSales += salesAmount;
        acc[date].totalSales += salesAmount;
        return acc;
      },
      {}
    );

    // Get recent transactions
    const recentTransactions = await prisma.salesTransaction.findMany({
      where: {
        payment_status: PAYMENT_STATUS.PAID,
      },
      select: {
        id: true,
        transaction_number: true,
        customer_name: true,
        total_amount: true,
        created_at: true,
      },
      orderBy: {
        created_at: "desc",
      },
      take: 10,
    });

    // Calculate metrics
    const totalSales = Number(salesAggregates._sum.total_amount || 0);
    const totalOrders = salesAggregates._count.id;
    const totalCustomers = uniqueCustomers.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    const overview: SalesOverview = {
      totalSales,
      totalOrders,
      totalCustomers,
      averageOrderValue,
      topSellingProducts,
      salesByPeriod: Object.values(salesByPeriod),
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id,
        transactionNumber: t.transaction_number,
        customerName: t.customer_name,
        totalAmount: Number(t.total_amount),
        createdAt: (t.created_at || new Date()).toISOString(),
      })),
    };

    return createApiResponse.success(
      {
        ...overview,
        period,
        periodStart: periodStart.toISOString(),
      },
      "POS analytics overview retrieved successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
});
