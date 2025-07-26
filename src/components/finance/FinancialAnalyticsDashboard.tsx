"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconChartLine,
  IconCash,
  IconShoppingCart,
  IconTrendingUp,
  IconRefresh,
  IconDownload,
  IconFilter,
  IconPlus,
} from "@tabler/icons-react";
import { DateRange } from "react-day-picker";
import Link from "next/link";

// Import custom components
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { CustomDateInput } from "@/components/ui/custom-date-input";
import { FinancialCharts } from "./FinancialCharts";
import { TransactionList } from "./TransactionList";
import { SimpleFinancialMetrics } from "./SimpleFinancialMetrics";
import { FinancialReports } from "./FinancialReports";
import { AdvancedAnalytics } from "./AdvancedAnalytics";

// Import hooks
import { useFinancialAnalytics } from "@/hooks/api/useFinancialAnalytics";

interface FinancialAnalyticsDashboardProps {
  user: any;
}

export function FinancialAnalyticsDashboard({
  user,
}: FinancialAnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    to: new Date(),
  });
  const [transactionType, setTransactionType] = useState<string>("all");
  const [paymentMethod, setPaymentMethod] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch financial analytics data
  const {
    data: analyticsData,
    isLoading: isLoadingStats,
    refetch,
  } = useFinancialAnalytics({
    dateRange,
    type: transactionType as "all" | "income" | "expense",
    paymentMethod: paymentMethod !== "all" ? paymentMethod : undefined,
  });

  // Calculate date range filter for API calls
  const dateRangeFilter = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return {};
    return {
      dateFrom: dateRange.from.toISOString().split("T")[0],
      dateTo: dateRange.to.toISOString().split("T")[0],
    };
  }, [dateRange]);

  // Handle date range change
  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    setDateRange(newDateRange);
  };

  // Handle custom date input
  const handleCustomDateRange = (customRange: DateRange | undefined) => {
    setDateRange(customRange);
  };

  // Refresh data
  const handleRefresh = () => {
    refetch();
  };

  // Export data
  const handleExport = () => {
    // Implementation for data export
    console.log("Exporting data...");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Financial Analytics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive financial insights and transaction management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="default" size="sm">
            <Link href="/finance/income/new">
              <IconPlus className="h-4 w-4 mr-2" />
              Add Income
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/finance/expenses/new">
              <IconPlus className="h-4 w-4 mr-2" />
              Add Expense
            </Link>
          </Button>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <IconRefresh className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <IconDownload className="h-4 w-4 mr-2" />
            Export
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range Picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <DateRangePicker
                date={dateRange}
                onDateChange={handleDateRangeChange}
                placeholder="Select date range"
              />
            </div>

            {/* Custom Date Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Custom Range</label>
              <CustomDateInput
                onDateRangeChange={handleCustomDateRange}
                placeholder="e.g., 'Last 7 days'"
              />
            </div>

            {/* Transaction Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Transaction Type</label>
              <Select
                value={transactionType}
                onValueChange={setTransactionType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="pos">POS Machine</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <IconChartLine className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <IconShoppingCart className="h-4 w-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <IconTrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <IconCash className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Financial Metrics */}
          <SimpleFinancialMetrics
            transactionStats={analyticsData?.summary}
            isLoading={isLoadingStats}
            dateRange={dateRange}
          />

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FinancialCharts
              dateRange={dateRange}
              transactionType={transactionType}
              paymentMethod={paymentMethod}
            />
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <TransactionList
            user={user}
            filters={{
              ...dateRangeFilter,
              type: transactionType !== "all" ? transactionType : undefined,
              paymentMethod:
                paymentMethod !== "all" ? paymentMethod : undefined,
            }}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <AdvancedAnalytics
            dateRange={dateRange}
            transactionType={transactionType}
            paymentMethod={paymentMethod}
          />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <FinancialReports
            dateRange={dateRange}
            transactionType={transactionType}
            paymentMethod={paymentMethod}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
