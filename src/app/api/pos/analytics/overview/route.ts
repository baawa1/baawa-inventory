import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
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
    sales: number;
    orders: number;
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
    const period = searchParams.get("period") || "7d";
    const periodStart = getPeriodFilter(period);

    // Get total sales and orders
    const salesAggregates = await prisma.salesTransaction.aggregate({
      where: {
        created_at: {
          gte: periodStart,
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

    const totalSales = Number(salesAggregates._sum.total_amount || 0);
    const totalOrders = salesAggregates._count.id;

    // Get unique customers count
    const uniqueCustomers = await prisma.salesTransaction.groupBy({
      by: ["customer_email"],
      where: {
        created_at: {
          gte: periodStart,
        },
        payment_status: PAYMENT_STATUS.PAID,
        customer_email: {
          not: null,
        },
      },
    });

    const totalCustomers = uniqueCustomers.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Get top selling products
    const topProducts = await prisma.salesItem.groupBy({
      by: ["product_id"],
      where: {
        sales_transactions: {
          created_at: {
            gte: periodStart,
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
          total_price: "desc",
        },
      },
      take: 5,
    });

    // Get product details for top products
    const productIds = topProducts
      .map((p) => p.product_id)
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

    const topSellingProducts = topProducts.map((item) => {
      const product = products.find((p) => p.id === item.product_id);
      return {
        id: item.product_id || 0,
        name: product?.name || "Unknown Product",
        totalSold: item._sum.quantity || 0,
        revenue: Number(item._sum.total_price || 0),
      };
    });

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

    const salesOverview: SalesOverview = {
      totalSales,
      totalOrders,
      totalCustomers,
      averageOrderValue,
      topSellingProducts,
      salesByPeriod: [], // Can be implemented later for charts
      recentTransactions: recentTransactions.map((transaction) => ({
        id: transaction.id,
        transactionNumber: transaction.transaction_number,
        customerName: transaction.customer_name,
        totalAmount: Number(transaction.total_amount),
        createdAt:
          transaction.created_at?.toISOString() || new Date().toISOString(),
      })),
    };

    return NextResponse.json(salesOverview);
  } catch (error) {
    console.error("Error fetching sales overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales overview" },
      { status: 500 }
    );
  }
}
