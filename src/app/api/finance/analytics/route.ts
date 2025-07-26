import { prisma } from "@/lib/db";
import { withAuth, AuthenticatedRequest } from "@/lib/api-middleware";
import { createApiResponse } from "@/lib/api-response";
import { z } from "zod";

const analyticsQuerySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  type: z.enum(["all", "income", "expense"]).optional().default("all"),
  paymentMethod: z.string().optional(),
  groupBy: z.enum(["day", "week", "month"]).optional().default("day"),
});

// GET /api/finance/analytics - Get financial analytics data
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      dateFrom: searchParams.get("dateFrom"),
      dateTo: searchParams.get("dateTo"),
      type: searchParams.get("type") || "all",
      paymentMethod: searchParams.get("paymentMethod"),
      groupBy: searchParams.get("groupBy") || "day",
    };

    const validatedQuery = analyticsQuerySchema.parse(queryParams);

    // Build where clause for date filtering
    const where: any = {};
    if (validatedQuery.dateFrom || validatedQuery.dateTo) {
      where.created_at = {};
      if (validatedQuery.dateFrom) {
        where.created_at.gte = new Date(validatedQuery.dateFrom);
      }
      if (validatedQuery.dateTo) {
        where.created_at.lte = new Date(validatedQuery.dateTo + "T23:59:59");
      }
    }

    // Add payment method filter
    if (
      validatedQuery.paymentMethod &&
      validatedQuery.paymentMethod !== "all"
    ) {
      where.payment_method = validatedQuery.paymentMethod;
    }

    // Get transaction statistics
    const [
      totalRevenue,
      totalExpenses,
      totalTransactions,
      averageTransactionValue,
      paymentMethodStats,
      dailyStats,
    ] = await Promise.all([
      // Total revenue (sales transactions)
      prisma.salesTransaction.aggregate({
        where: {
          ...where,
          transaction_type: "sale",
        },
        _sum: {
          total_amount: true,
        },
      }),

      // Total expenses (expense transactions)
      prisma.salesTransaction.aggregate({
        where: {
          ...where,
          transaction_type: "expense",
        },
        _sum: {
          total_amount: true,
        },
      }),

      // Total transaction count
      prisma.salesTransaction.count({
        where,
      }),

      // Average transaction value
      prisma.salesTransaction.aggregate({
        where,
        _avg: {
          total_amount: true,
        },
      }),

      // Payment method distribution
      prisma.salesTransaction.groupBy({
        by: ["payment_method"],
        where,
        _count: {
          payment_method: true,
        },
        _sum: {
          total_amount: true,
        },
      }),

      // Daily statistics for charts
      prisma.salesTransaction.groupBy({
        by: ["created_at"],
        where,
        _sum: {
          total_amount: true,
        },
        _count: {
          id: true,
        },
        orderBy: {
          created_at: "asc",
        },
      }),
    ]);

    // Calculate net profit
    const revenue = Number(totalRevenue._sum.total_amount) || 0;
    const expenses = Number(totalExpenses._sum.total_amount) || 0;
    const netProfit = revenue - expenses;

    // Process payment method stats
    const paymentMethodData = paymentMethodStats.map((stat) => ({
      name: stat.payment_method,
      value: stat._count.payment_method,
      amount: stat._sum.total_amount || 0,
    }));

    // Process daily stats for charts
    const chartData = dailyStats.map((stat) => ({
      date: stat.created_at?.toISOString().split("T")[0] || "",
      revenue: Number(stat._sum.total_amount) || 0,
      transactions: stat._count.id,
    }));

    // Get top payment method
    const topPaymentMethod = paymentMethodData.reduce((prev, current) =>
      prev.value > current.value ? prev : current
    );

    // Calculate growth percentages (mock data for now)
    const revenueGrowth = 12.5; // Mock growth percentage
    const expenseGrowth = 8.2; // Mock growth percentage

    const analyticsData = {
      summary: {
        totalRevenue: revenue,
        totalExpenses: expenses,
        netProfit,
        totalTransactions,
        averageTransactionValue:
          Number(averageTransactionValue._avg.total_amount) || 0,
        topPaymentMethod: topPaymentMethod?.name || "Cash",
        revenueGrowth,
        expenseGrowth,
      },
      charts: {
        paymentMethodDistribution: paymentMethodData,
        dailyTrends: chartData,
      },
      filters: {
        dateFrom: validatedQuery.dateFrom,
        dateTo: validatedQuery.dateTo,
        type: validatedQuery.type,
        paymentMethod: validatedQuery.paymentMethod,
        groupBy: validatedQuery.groupBy,
      },
    };

    return createApiResponse.success(
      analyticsData,
      "Analytics data retrieved successfully"
    );
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return createApiResponse.error(
      "Failed to fetch analytics data",
      500,
      error
    );
  }
});
