"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useFinanceSummary } from "@/hooks/api/useFinanceSummary";
import { AppUser } from "@/types/user";
import { TransactionList } from "./TransactionList";

interface FinanceOverviewProps {
  user: AppUser;
}

export function FinanceOverview({ user: _user }: FinanceOverviewProps) {
  const router = useRouter();
  const { data: summary, error, isLoading } = useFinanceSummary();

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <p className="text-muted-foreground">Loading finance data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <p className="text-red-600">
            Failed to load finance data. Please try again.
          </p>
        </div>
      </div>
    );
  }

  const currentMonth = summary?.currentMonth || {
    income: 0,
    expenses: 0,
    netIncome: 0,
  };
  const previousMonth = summary?.previousMonth || {
    income: 0,
    expenses: 0,
    netIncome: 0,
  };
  const yearToDate = summary?.yearToDate || {
    income: 0,
    expenses: 0,
    netIncome: 0,
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return "₦0";
    return `₦${amount.toLocaleString()}`;
  };

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Finance Overview</h1>
          <p className="text-muted-foreground">
            Overview of your business finances
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push("/finance/income/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Income
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/finance/expenses/new")}
          >
            <Receipt className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Month Income
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentMonth.income)}
            </div>
            <p className="text-xs text-muted-foreground">
              {getPercentageChange(currentMonth.income, previousMonth.income) >=
              0
                ? "+"
                : ""}
              {getPercentageChange(
                currentMonth.income,
                previousMonth.income
              ).toFixed(1)}
              % from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Month Expenses
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentMonth.expenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              {getPercentageChange(
                currentMonth.expenses,
                previousMonth.expenses
              ) >= 0
                ? "+"
                : ""}
              {getPercentageChange(
                currentMonth.expenses,
                previousMonth.expenses
              ).toFixed(1)}
              % from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${currentMonth.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(currentMonth.netIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              {getPercentageChange(
                currentMonth.netIncome,
                previousMonth.netIncome
              ) >= 0
                ? "+"
                : ""}
              {getPercentageChange(
                currentMonth.netIncome,
                previousMonth.netIncome
              ).toFixed(1)}
              % from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Year to Date Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Year to Date Summary</CardTitle>
          <CardDescription>
            Financial performance for the current year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(yearToDate.income)}
              </div>
              <p className="text-sm text-muted-foreground">Total Income</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(yearToDate.expenses)}
              </div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
            </div>
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${yearToDate.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatCurrency(yearToDate.netIncome)}
              </div>
              <p className="text-sm text-muted-foreground">Net Income</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Transactions Table */}
      <TransactionList user={_user} />
    </div>
  );
}
