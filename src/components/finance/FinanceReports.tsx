"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  FileText,
  Filter,
  Download,
  RefreshCw,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface FinancialData {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  transactionCount: number;
  recentTransactions: any[];
  dataSources?: {
    manualTransactions: number;
    includeSales: boolean;
    includePurchases: boolean;
  };
}

interface IncomeData {
  totalIncome: number;
  incomeBreakdown: Array<{
    source: string;
    amount: number;
    count: number;
  }>;
  transactionCount: number;
}

interface ExpenseData {
  totalExpenses: number;
  expenseBreakdown: Array<{
    type: string;
    amount: number;
    count: number;
  }>;
  transactionCount: number;
}

interface CashFlowData {
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashFlow: number;
  period: {
    startDate: string | null;
    endDate: string | null;
  };
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

export default function FinanceReports() {
  const [reportType, setReportType] = useState("FINANCIAL_SUMMARY");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [includeSales, setIncludeSales] = useState(true);
  const [includePurchases, setIncludePurchases] = useState(true);
  const [data, setData] = useState<
    FinancialData | IncomeData | ExpenseData | CashFlowData | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        type: reportType,
        includeSales: includeSales.toString(),
        includePurchases: includePurchases.toString(),
      });

      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/finance/reports?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch data");
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [reportType, startDate, endDate, includeSales, includePurchases]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = () => {
    // Export functionality will be implemented in a future update
  };

  const renderFinancialSummary = (data: FinancialData) => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.transactionCount} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(data.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.transactionCount} transactions
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
              className={`text-2xl font-bold ${data.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(data.netIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.netIncome >= 0 ? "Profit" : "Loss"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Sources Info */}
      {data.dataSources && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data Sources</CardTitle>
            <CardDescription>
              Financial data includes the following sources:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Manual Transactions: {data.dataSources.manualTransactions}
              </Badge>
              {data.dataSources.includeSales && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <ShoppingCart className="h-3 w-3" />
                  POS Sales
                </Badge>
              )}
              {data.dataSources.includePurchases && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  Inventory Purchases
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Latest financial activities across all sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recentTransactions?.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-full ${
                      transaction.type === "INCOME"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {transaction.type === "INCOME" ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.transactionNumber} •{" "}
                      {new Date(
                        transaction.transactionDate
                      ).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {transaction.source}
                      </Badge>
                      {transaction.incomeSource && (
                        <Badge variant="secondary" className="text-xs">
                          {transaction.incomeSource}
                        </Badge>
                      )}
                      {transaction.expenseType && (
                        <Badge variant="secondary" className="text-xs">
                          {transaction.expenseType}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-bold ${transaction.type === "INCOME" ? "text-green-600" : "text-red-600"}`}
                  >
                    {transaction.type === "INCOME" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.paymentMethod}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderIncomeReport = (data: IncomeData) => (
    <div className="space-y-6">
      {/* Income Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Income Summary</CardTitle>
          <CardDescription>
            Total income: {formatCurrency(data.totalIncome)} from{" "}
            {data.transactionCount} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Income by Source</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.incomeBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ source, percent }) =>
                      `${source} ${((percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {data.incomeBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Income Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.incomeBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="source" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Bar dataKey="amount" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Income Details */}
      <Card>
        <CardHeader>
          <CardTitle>Income Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.incomeBreakdown.map((item) => (
              <div
                key={item.source}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{item.source}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.count} transactions
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    {formatCurrency(item.amount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {((item.amount / data.totalIncome) * 100).toFixed(1)}% of
                    total
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderExpenseReport = (data: ExpenseData) => (
    <div className="space-y-6">
      {/* Expense Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Summary</CardTitle>
          <CardDescription>
            Total expenses: {formatCurrency(data.totalExpenses)} from{" "}
            {data.transactionCount} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Expenses by Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, percent }) =>
                      `${type} ${((percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {data.expenseBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Expense Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.expenseBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Bar dataKey="amount" fill="#ff6b6b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense Details */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.expenseBreakdown.map((item) => (
              <div
                key={item.type}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{item.type}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.count} transactions
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600">
                    {formatCurrency(item.amount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {((item.amount / data.totalExpenses) * 100).toFixed(1)}% of
                    total
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCashFlowReport = (data: CashFlowData) => (
    <div className="space-y-6">
      {/* Cash Flow Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Operating Cash Flow
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${data.operatingCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(data.operatingCashFlow)}
            </div>
            <p className="text-xs text-muted-foreground">From operations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Investing Cash Flow
            </CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${data.investingCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(data.investingCashFlow)}
            </div>
            <p className="text-xs text-muted-foreground">From investments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Financing Cash Flow
            </CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${data.financingCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(data.financingCashFlow)}
            </div>
            <p className="text-xs text-muted-foreground">From financing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${data.netCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(data.netCashFlow)}
            </div>
            <p className="text-xs text-muted-foreground">Total change</p>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Overview</CardTitle>
          <CardDescription>Cash flow breakdown by category</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={[
                {
                  category: "Operating",
                  amount: data.operatingCashFlow,
                  color: data.operatingCashFlow >= 0 ? "#10b981" : "#ef4444",
                },
                {
                  category: "Investing",
                  amount: data.investingCashFlow,
                  color: data.investingCashFlow >= 0 ? "#10b981" : "#ef4444",
                },
                {
                  category: "Financing",
                  amount: data.financingCashFlow,
                  color: data.financingCashFlow >= 0 ? "#10b981" : "#ef4444",
                },
                {
                  category: "Net",
                  amount: data.netCashFlow,
                  color: data.netCashFlow >= 0 ? "#10b981" : "#ef4444",
                },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="amount" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive financial analysis with integrated sales and purchase
            data
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={fetchData} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FINANCIAL_SUMMARY">
                    Financial Summary
                  </SelectItem>
                  <SelectItem value="INCOME_REPORT">Income Report</SelectItem>
                  <SelectItem value="EXPENSE_REPORT">Expense Report</SelectItem>
                  <SelectItem value="CASH_FLOW">Cash Flow Report</SelectItem>
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

            <div className="space-y-2">
              <Label>Data Sources</Label>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="include-sales"
                    checked={includeSales}
                    onChange={(e) => setIncludeSales(e.target.checked)}
                  />
                  <Label htmlFor="include-sales" className="text-sm">
                    Include Sales
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="include-purchases"
                    checked={includePurchases}
                    onChange={(e) => setIncludePurchases(e.target.checked)}
                  />
                  <Label htmlFor="include-purchases" className="text-sm">
                    Include Purchases
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span>Loading report data...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-red-600 mb-2">Error loading report</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {data && !loading && (
        <div>
          {reportType === "FINANCIAL_SUMMARY" &&
            renderFinancialSummary(data as FinancialData)}
          {reportType === "INCOME_REPORT" &&
            renderIncomeReport(data as IncomeData)}
          {reportType === "EXPENSE_REPORT" &&
            renderExpenseReport(data as ExpenseData)}
          {reportType === "CASH_FLOW" &&
            renderCashFlowReport(data as CashFlowData)}
        </div>
      )}
    </div>
  );
}
