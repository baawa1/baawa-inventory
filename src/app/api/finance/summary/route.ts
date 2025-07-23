import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/lib/db";
import { getFinancialSummary, calculatePercentageChange } from "@/lib/utils/finance";
import { USER_ROLES, hasRole } from "@/lib/auth/roles";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRole(session.user.role, [USER_ROLES.ADMIN, USER_ROLES.MANAGER])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month"; // month, quarter, year
    const compareWith = searchParams.get("compareWith") || "previous"; // previous, lastYear

    // Calculate date ranges
    const now = new Date();
    let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date;

    switch (period) {
      case "month":
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        currentStart = new Date(now.getFullYear(), quarter * 3, 1);
        currentEnd = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        previousStart = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
        previousEnd = new Date(now.getFullYear(), quarter * 3, 0);
        break;
      case "year":
        currentStart = new Date(now.getFullYear(), 0, 1);
        currentEnd = new Date(now.getFullYear(), 11, 31);
        previousStart = new Date(now.getFullYear() - 1, 0, 1);
        previousEnd = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        throw new Error("Invalid period");
    }

    // Fetch current period transactions
    const currentTransactions = await prisma.financialTransaction.findMany({
      where: {
        transactionDate: {
          gte: currentStart,
          lte: currentEnd,
        },
        status: "COMPLETED",
      },
      include: {
        category: true,
      },
    });

    // Fetch previous period transactions for comparison
    const previousTransactions = await prisma.financialTransaction.findMany({
      where: {
        transactionDate: {
          gte: previousStart,
          lte: previousEnd,
        },
        status: "COMPLETED",
      },
      include: {
        category: true,
      },
    });

    // Calculate summaries
    const currentSummary = getFinancialSummary(currentTransactions);
    const previousSummary = getFinancialSummary(previousTransactions);

    // Calculate changes
    const incomeChange = calculatePercentageChange(
      currentSummary.totalIncome,
      previousSummary.totalIncome
    );
    const expenseChange = calculatePercentageChange(
      currentSummary.totalExpense,
      previousSummary.totalExpense
    );
    const netChange = calculatePercentageChange(
      currentSummary.netAmount,
      previousSummary.netAmount
    );

    // Category breakdown
    const categoryBreakdown = currentTransactions.reduce((acc, transaction) => {
      const categoryName = transaction.category.name;
      const amount = Number(transaction.amount);
      
      if (!acc[categoryName]) {
        acc[categoryName] = {
          name: categoryName,
          type: transaction.type,
          amount: 0,
          count: 0,
        };
      }
      
      acc[categoryName].amount += amount;
      acc[categoryName].count += 1;
      
      return acc;
    }, {} as Record<string, any>);

    // Recent transactions (last 10)
    const recentTransactions = await prisma.financialTransaction.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        createdByUser: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    // Pending transactions count
    const pendingCount = await prisma.financialTransaction.count({
      where: { status: "PENDING" },
    });

    const summary = {
      period: {
        type: period,
        start: currentStart.toISOString(),
        end: currentEnd.toISOString(),
      },
      current: currentSummary,
      previous: previousSummary,
      changes: {
        income: incomeChange,
        expense: expenseChange,
        net: netChange,
      },
      categoryBreakdown: Object.values(categoryBreakdown),
      recentTransactions,
      pendingCount,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Error fetching financial summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial summary" },
      { status: 500 }
    );
  }
}