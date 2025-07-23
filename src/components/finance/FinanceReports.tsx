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
  Calendar,
  Download,
} from "lucide-react";
import { useFinanceSummary } from "@/hooks/api/useFinanceSummary";
import { AppUser } from "@/types/user";

interface FinanceReportsProps {
  user: AppUser;
}

export function FinanceReports({ user: _user }: FinanceReportsProps) {
  const { data: summary, error, isLoading } = useFinanceSummary();

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <p className="text-muted-foreground">Loading finance reports...</p>
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
            Failed to load finance reports. Please try again.
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
  const yearToDate = summary?.yearToDate || {
    income: 0,
    expenses: 0,
    netIncome: 0,
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return "₦0";
    return `₦${amount.toLocaleString()}`;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Finance Reports</h1>
          <p className="text-muted-foreground">
            Financial reports and analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Income (YTD)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(yearToDate.income)}
            </div>
            <p className="text-xs text-muted-foreground">
              Current month: {formatCurrency(currentMonth.income)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses (YTD)
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(yearToDate.expenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              Current month: {formatCurrency(currentMonth.expenses)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Net Profit (YTD)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${yearToDate.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(yearToDate.netIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              Current month: {formatCurrency(currentMonth.netIncome)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Income vs Expenses
            </CardTitle>
            <CardDescription>Monthly comparison report</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Compare income and expenses over time to identify trends and
              patterns.
            </p>
            <Button variant="outline" className="w-full">
              <Calendar className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Profit & Loss
            </CardTitle>
            <CardDescription>Comprehensive P&L statement</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Detailed profit and loss analysis with period comparisons.
            </p>
            <Button variant="outline" className="w-full">
              <DollarSign className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Cash Flow
            </CardTitle>
            <CardDescription>Cash flow analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Track cash inflows and outflows to manage liquidity effectively.
            </p>
            <Button variant="outline" className="w-full">
              <TrendingUp className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tax Report */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Tax Report
            </CardTitle>
            <CardDescription>Tax preparation summary</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Generate tax-ready reports for income and expense documentation.
            </p>
            <Button variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
