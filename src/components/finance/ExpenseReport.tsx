"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconDownload,
  IconPrinter,
  IconTrendingDown,
  IconCalendar,
  IconRefresh,
  IconCash,
  IconChartBar,
  IconFilter,
} from "@tabler/icons-react";
import { DateRange } from "react-day-picker";
import { formatCurrency } from "@/lib/utils";
import { useFinancialAnalytics } from "@/hooks/api/useFinancialAnalytics";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { AppUser } from "@/types/user";

interface ExpenseReportProps {
  user: AppUser;
}

export function ExpenseReport({ user: _user }: ExpenseReportProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    to: new Date(),
  });
  const [period, setPeriod] = useState("monthly");
  const [expenseCategory, setExpenseCategory] = useState("all");

  const {
    data: analyticsData,
    isLoading,
    refetch,
  } = useFinancialAnalytics({
    dateRange,
    type: "expense",
  });

  const summary = analyticsData?.summary;

  // Calculate expense data
  const expenseData = {
    totalExpenses: summary?.totalExpenses || 0,
    expenseBreakdown: {
      salaries: 80000,
      rent: 25000,
      utilities: 15000,
      marketing: 20000,
      insurance: 10000,
      depreciation: 15000,
      supplies: 12000,
      maintenance: 8000,
      travel: 5000,
      other: 5000,
    },
    vendorExpenses: [
      { vendor: "ABC Supplies", amount: 25000, category: "Supplies" },
      { vendor: "XYZ Services", amount: 18000, category: "Services" },
      { vendor: "Office Rent Co", amount: 25000, category: "Rent" },
      { vendor: "Utility Corp", amount: 15000, category: "Utilities" },
      { vendor: "Marketing Pro", amount: 20000, category: "Marketing" },
    ],
    monthlyTrend: [
      { month: "Jan", amount: 120000 },
      { month: "Feb", amount: 135000 },
      { month: "Mar", amount: 110000 },
      { month: "Apr", amount: 145000 },
      { month: "May", amount: 130000 },
      { month: "Jun", amount: 140000 },
    ],
  };

  const totalExpenses = Object.values(expenseData.expenseBreakdown).reduce(
    (a, b) => a + b,
    0
  );
  const averageExpense = totalExpenses / 6; // 6 months

  const handleExportReport = () => {
    console.log("Exporting expense report...");
  };

  const handlePrintReport = () => {
    console.log("Printing expense report...");
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading expense data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expense Report</h1>
          <p className="text-muted-foreground">
            Comprehensive expense analysis and breakdown
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <IconRefresh className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExportReport} variant="outline" size="sm">
            <IconDownload className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handlePrintReport} variant="outline" size="sm">
            <IconPrinter className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFilter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <DateRangePicker
                date={dateRange}
                onDateChange={setDateRange}
                placeholder="Select date range for expense analysis"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Expense Category</label>
              <Select
                value={expenseCategory}
                onValueChange={setExpenseCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="salaries">Salaries</SelectItem>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="supplies">Supplies</SelectItem>
                  <SelectItem value="services">Services</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <IconTrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(expenseData.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total expenses this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Monthly
            </CardTitle>
            <IconCash className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(averageExpense)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average monthly expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <IconChartBar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">Salaries</div>
            <p className="text-xs text-muted-foreground">
              {(
                (expenseData.expenseBreakdown.salaries / totalExpenses) *
                100
              ).toFixed(1)}
              % of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendors</CardTitle>
            <IconCash className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {expenseData.vendorExpenses.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active vendors this period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expense Breakdown by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconChartBar className="h-5 w-5" />
            Expense Breakdown by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(expenseData.expenseBreakdown).map(
              ([category, amount]) => (
                <div
                  key={category}
                  className="flex justify-between items-center p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium capitalize">{category}</div>
                    <div className="text-sm text-muted-foreground">
                      {((amount / totalExpenses) * 100).toFixed(1)}% of total
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-600">
                      {formatCurrency(amount)}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vendor Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCash className="h-5 w-5" />
            Top Vendor Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {expenseData.vendorExpenses
              .sort((a, b) => b.amount - a.amount)
              .map((vendor, index) => (
                <div
                  key={vendor.vendor}
                  className="flex justify-between items-center p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                    >
                      {index + 1}
                    </Badge>
                    <div>
                      <div className="font-medium">{vendor.vendor}</div>
                      <div className="text-sm text-muted-foreground">
                        {vendor.category}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-600">
                      {formatCurrency(vendor.amount)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {((vendor.amount / totalExpenses) * 100).toFixed(1)}% of
                      total
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconTrendingDown className="h-5 w-5" />
            Monthly Expense Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {expenseData.monthlyTrend.map((month) => (
                <div
                  key={month.month}
                  className="text-center p-4 border rounded-lg"
                >
                  <div className="text-lg font-bold text-red-600">
                    {formatCurrency(month.amount)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {month.month}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {((month.amount / averageExpense) * 100).toFixed(0)}% of avg
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Expense Analysis</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Highest Expense Month:</strong>{" "}
                  {
                    expenseData.monthlyTrend.reduce((max, current) =>
                      current.amount > max.amount ? current : max
                    ).month
                  }{" "}
                  with{" "}
                  {formatCurrency(
                    expenseData.monthlyTrend.reduce((max, current) =>
                      current.amount > max.amount ? current : max
                    ).amount
                  )}
                </p>
                <p>
                  <strong>Lowest Expense Month:</strong>{" "}
                  {
                    expenseData.monthlyTrend.reduce((min, current) =>
                      current.amount < min.amount ? current : min
                    ).month
                  }{" "}
                  with{" "}
                  {formatCurrency(
                    expenseData.monthlyTrend.reduce((min, current) =>
                      current.amount < min.amount ? current : min
                    ).amount
                  )}
                </p>
                <p>
                  <strong>Expense Variance:</strong>{" "}
                  {(
                    ((expenseData.monthlyTrend.reduce((max, current) =>
                      current.amount > max.amount ? current : max
                    ).amount -
                      expenseData.monthlyTrend.reduce((min, current) =>
                        current.amount < min.amount ? current : min
                      ).amount) /
                      averageExpense) *
                    100
                  ).toFixed(1)}
                  % variance from average
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(expenseData.totalExpenses)}
                </div>
                <div className="text-sm text-red-600">Total Expenses</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(averageExpense)}
                </div>
                <div className="text-sm text-orange-600">Monthly Average</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {expenseData.vendorExpenses.length}
                </div>
                <div className="text-sm text-purple-600">Active Vendors</div>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">
                  {Object.keys(expenseData.expenseBreakdown).length}
                </div>
                <div className="text-sm text-indigo-600">Categories</div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">
                Expense Management Insights
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Largest Expense Category:</strong> Salaries at{" "}
                  {formatCurrency(expenseData.expenseBreakdown.salaries)} (
                  {(
                    (expenseData.expenseBreakdown.salaries / totalExpenses) *
                    100
                  ).toFixed(1)}
                  % of total)
                </p>
                <p>
                  <strong>Cost Control Opportunity:</strong> Focus on reducing{" "}
                  {expenseData.expenseBreakdown.marketing >
                  expenseData.expenseBreakdown.utilities
                    ? "marketing"
                    : "utilities"}{" "}
                  expenses which are{" "}
                  {expenseData.expenseBreakdown.marketing >
                  expenseData.expenseBreakdown.utilities
                    ? expenseData.expenseBreakdown.marketing
                    : expenseData.expenseBreakdown.utilities >
                        averageExpense * 0.15
                      ? "above"
                      : "within"}{" "}
                  target range.
                </p>
                <p>
                  <strong>Vendor Management:</strong> Top vendor{" "}
                  {expenseData.vendorExpenses[0]?.vendor} accounts for{" "}
                  {(
                    ((expenseData.vendorExpenses[0]?.amount || 0) /
                      totalExpenses) *
                    100
                  ).toFixed(1)}
                  % of total expenses.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
