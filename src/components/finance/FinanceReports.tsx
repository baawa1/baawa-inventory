"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import {
  ArrowLeft,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface FinanceReportsProps {
  user: any;
}

export function FinanceReports({ user: _user }: FinanceReportsProps) {
  const router = useRouter();
  const [selectedReport, setSelectedReport] = useState("FINANCIAL_SUMMARY");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const reportTypes = [
    {
      value: "FINANCIAL_SUMMARY",
      label: "Financial Summary",
      icon: DollarSign,
    },
    { value: "SALES_REPORT", label: "Sales Report", icon: ShoppingCart },
    { value: "PURCHASE_REPORT", label: "Purchase Report", icon: Package },
    { value: "INCOME_REPORT", label: "Income Report", icon: TrendingUp },
    { value: "EXPENSE_REPORT", label: "Expense Report", icon: TrendingDown },
    { value: "CASH_FLOW", label: "Cash Flow", icon: TrendingUp },
  ];

  // Mock data - replace with actual API calls
  const mockFinancialSummary = {
    totalSales: 2500000,
    totalPurchases: 1800000,
    totalIncome: 2800000,
    totalExpenses: 1200000,
    netProfit: 1600000,
    grossProfit: 700000,
  };

  const mockSalesData = [
    { month: "Jan", amount: 450000 },
    { month: "Feb", amount: 520000 },
    { month: "Mar", amount: 480000 },
    { month: "Apr", amount: 550000 },
    { month: "May", amount: 600000 },
    { month: "Jun", amount: 580000 },
  ];

  const mockPurchaseData = [
    { month: "Jan", amount: 320000 },
    { month: "Feb", amount: 380000 },
    { month: "Mar", amount: 350000 },
    { month: "Apr", amount: 420000 },
    { month: "May", amount: 450000 },
    { month: "Jun", amount: 430000 },
  ];

  const mockIncomeData = [
    { source: "Sales Revenue", amount: 2500000 },
    { source: "Loan", amount: 200000 },
    { source: "Service Fees", amount: 80000 },
    { source: "Other", amount: 20000 },
  ];

  const mockExpenseData = [
    { type: "Supplies", amount: 400000 },
    { type: "Salaries", amount: 300000 },
    { type: "Rent", amount: 200000 },
    { type: "Utilities", amount: 150000 },
    { type: "Marketing", amount: 100000 },
    { type: "Other", amount: 50000 },
  ];

  const generateReport = () => {
    // Implement report generation logic
    console.log("Generating report:", { selectedReport, startDate, endDate });
  };

  const downloadReport = () => {
    // Implement report download logic
    console.log("Downloading report");
  };

  const renderFinancialSummary = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(mockFinancialSummary.totalSales)}
          </div>
          <p className="text-xs text-muted-foreground">
            +20.1% from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(mockFinancialSummary.totalPurchases)}
          </div>
          <p className="text-xs text-muted-foreground">
            +15.3% from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(mockFinancialSummary.totalIncome)}
          </div>
          <p className="text-xs text-muted-foreground">
            +18.2% from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(mockFinancialSummary.totalExpenses)}
          </div>
          <p className="text-xs text-muted-foreground">+8.1% from last month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(mockFinancialSummary.grossProfit)}
          </div>
          <p className="text-xs text-muted-foreground">
            +25.4% from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(mockFinancialSummary.netProfit)}
          </div>
          <p className="text-xs text-muted-foreground">
            +22.7% from last month
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderSalesReport = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sales Trend</CardTitle>
          <CardDescription>Monthly sales performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockSalesData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="font-medium">{item.month}</span>
                <span className="text-lg font-bold">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPurchaseReport = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Purchase Trend</CardTitle>
          <CardDescription>Monthly purchase performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockPurchaseData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="font-medium">{item.month}</span>
                <span className="text-lg font-bold">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderIncomeReport = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Income Breakdown</CardTitle>
          <CardDescription>Income by source</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockIncomeData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="font-medium">{item.source}</span>
                <span className="text-lg font-bold">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderExpenseReport = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Expense Breakdown</CardTitle>
          <CardDescription>Expenses by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockExpenseData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="font-medium">{item.type}</span>
                <span className="text-lg font-bold">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCashFlow = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Statement</CardTitle>
          <CardDescription>Cash flow overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Operating Cash Flow</span>
              <span className="text-lg font-bold text-green-600">
                +{formatCurrency(1600000)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Investing Cash Flow</span>
              <span className="text-lg font-bold text-red-600">
                -{formatCurrency(300000)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Financing Cash Flow</span>
              <span className="text-lg font-bold text-green-600">
                +{formatCurrency(200000)}
              </span>
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="font-bold">Net Cash Flow</span>
                <span className="text-xl font-bold text-green-600">
                  +{formatCurrency(1500000)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderReportContent = () => {
    switch (selectedReport) {
      case "FINANCIAL_SUMMARY":
        return renderFinancialSummary();
      case "SALES_REPORT":
        return renderSalesReport();
      case "PURCHASE_REPORT":
        return renderPurchaseReport();
      case "INCOME_REPORT":
        return renderIncomeReport();
      case "EXPENSE_REPORT":
        return renderExpenseReport();
      case "CASH_FLOW":
        return renderCashFlow();
      default:
        return renderFinancialSummary();
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/finance")}
          className="mb-4 px-4 lg:px-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Finance
        </Button>
        <PageHeader
          title="Financial Reports"
          description="Comprehensive financial reports and analytics"
        />
      </div>

      {/* Report Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>Select report type and date range</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center">
                        <type.icon className="mr-2 h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <Button onClick={generateReport}>
              <Calendar className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
            <Button variant="outline" onClick={downloadReport}>
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <div className="space-y-6">{renderReportContent()}</div>
    </div>
  );
}
