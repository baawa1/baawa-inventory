# Finance Manager Improvements Guide

This document outlines all fixes and feature implementations for the Finance Manager module, organized for step-by-step execution.

---

## Table of Contents

1. [Critical Fixes](#1-critical-fixes)
2. [Bug Fixes](#2-bug-fixes)
3. [Feature: Daily Trends Implementation](#3-feature-daily-trends-implementation)
4. [Feature: Financial KPIs Dashboard](#4-feature-financial-kpis-dashboard)
5. [Feature: Profit Margin Dashboard](#5-feature-profit-margin-dashboard)
6. [Feature: Cash Flow Forecast](#6-feature-cash-flow-forecast)
7. [Feature: Accounts Receivable Integration](#7-feature-accounts-receivable-integration)
8. [Feature: Export Improvements (PDF Reports)](#8-feature-export-improvements-pdf-reports)

---

## 1. Critical Fixes

### 1.1 Add Permission Check to Analytics Endpoint

**Priority:** CRITICAL
**File:** `src/app/api/finance/analytics/route.ts`
**Issue:** Anyone authenticated can access financial analytics data

**Implementation:**

Add permission check after line 18:

```typescript
// After: const prisma = createFreshPrismaClient();
// Add:
if (!hasPermission(request.user.role, 'FINANCIAL_ANALYTICS')) {
  return createApiResponse.forbidden(
    'Insufficient permissions to access financial analytics'
  );
}
```

**Required Import:**
```typescript
import { hasPermission } from '@/lib/auth/roles';
```

---

### 1.2 Sanitize Database Error Messages

**Priority:** HIGH
**File:** `src/app/api/finance/transactions/route.ts`
**Issue:** Internal database error details exposed to users

**Implementation:**

Replace lines 344-348:

```typescript
// Before:
const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
return createApiResponse.internalError(
  `Failed to create transaction in database: ${errorMessage}`
);

// After:
logger.error(`[${requestId}] Database error details`, {
  error: dbError instanceof Error ? dbError.message : 'Unknown database error',
});
return createApiResponse.internalError(
  'Failed to create transaction. Please try again or contact support.'
);
```

Apply same pattern to lines 378-382.

---

### 1.3 Create Finance-Specific Audit Actions

**Priority:** MEDIUM
**File:** `src/types/audit.ts`

**Implementation:**

Add new audit actions to the `AuditLogAction` enum:

```typescript
export enum AuditLogAction {
  // Existing actions...

  // Finance-specific actions
  FINANCE_TRANSACTION_CREATED = 'FINANCE_TRANSACTION_CREATED',
  FINANCE_TRANSACTION_UPDATED = 'FINANCE_TRANSACTION_UPDATED',
  FINANCE_TRANSACTION_DELETED = 'FINANCE_TRANSACTION_DELETED',
  FINANCE_TRANSACTION_APPROVED = 'FINANCE_TRANSACTION_APPROVED',
  FINANCE_TRANSACTION_REJECTED = 'FINANCE_TRANSACTION_REJECTED',
  FINANCE_REPORT_GENERATED = 'FINANCE_REPORT_GENERATED',
}
```

**Update References:**

1. `src/app/api/finance/transactions/route.ts` line 313:
   ```typescript
   action: AuditLogAction.FINANCE_TRANSACTION_CREATED,
   ```

2. `src/app/api/finance/transactions/[id]/approve/route.ts` line 99:
   ```typescript
   action: AuditLogAction.FINANCE_TRANSACTION_APPROVED,
   ```

---

## 2. Bug Fixes

### 2.1 Integrate Sales and Stock Data into Reports Endpoint

**Priority:** HIGH
**File:** `src/app/api/finance/reports/route.ts`
**Issue:** Reports only show manual transactions, missing POS sales and inventory purchases

**Implementation:**

After line 96, add queries for sales and stock data:

```typescript
// Get sales transactions for the period
const salesTransactions = await prisma.salesTransaction.findMany({
  where: {
    created_at: {
      gte: startDate,
      lte: endDate,
    },
    payment_status: { in: SUCCESSFUL_PAYMENT_STATUSES },
  },
  select: {
    id: true,
    total_amount: true,
    payment_method: true,
    created_at: true,
  },
});

// Get stock additions (purchases) for the period
const stockAdditions = await prisma.stockAddition.findMany({
  where: {
    purchaseDate: {
      gte: startDate,
      lte: endDate,
    },
  },
  select: {
    id: true,
    totalCost: true,
    purchaseDate: true,
  },
});

// Calculate totals including all sources
const salesIncome = salesTransactions.reduce(
  (sum, s) => sum + Number(s.total_amount),
  0
);

const purchaseExpenses = stockAdditions.reduce(
  (sum, sa) => sum + Number(sa.totalCost),
  0
);

// Update totalIncome and totalExpenses calculations
const totalIncome = incomeTransactions.reduce(
  (sum, t) => sum + Number(t.amount),
  0
) + salesIncome;

const totalExpenses = expenseTransactions.reduce(
  (sum, t) => sum + Number(t.amount),
  0
) + purchaseExpenses;

// Update costOfGoods to include stock additions
const costOfGoods = expenseTransactions
  .filter(t => t.expenseDetails?.expenseType === 'INVENTORY_PURCHASES')
  .reduce((sum, t) => sum + Number(t.amount), 0) + purchaseExpenses;
```

**Required Import:**
```typescript
import { SUCCESSFUL_PAYMENT_STATUSES } from '@/lib/constants';
```

---

### 2.2 Fix Stale Data in Update Transaction Response

**Priority:** MEDIUM
**File:** `src/app/api/finance/transactions/[id]/route.ts`
**Issue:** Response returns data before expense/income details are updated

**Implementation:**

Replace lines 159-226 with:

```typescript
// Update the main transaction
await tx.financialTransaction.update({
  where: { id: transactionId },
  data: {
    type: validatedData.type,
    amount: validatedData.amount,
    description: validatedData.description,
    transactionDate: validatedData.transactionDate
      ? new Date(validatedData.transactionDate)
      : undefined,
    paymentMethod: validatedData.paymentMethod ?? null,
  },
});

// Update expense details if provided
if (validatedData.type === 'EXPENSE' && validatedData.expenseType) {
  await tx.expenseDetail.upsert({
    where: { transactionId },
    update: {
      expenseType: validatedData.expenseType,
      vendorName: validatedData.vendorName,
    },
    create: {
      transactionId,
      expenseType: validatedData.expenseType,
      vendorName: validatedData.vendorName,
    },
  });
}

// Update income details if provided
if (validatedData.type === 'INCOME' && validatedData.incomeSource) {
  await tx.incomeDetail.upsert({
    where: { transactionId },
    update: {
      incomeSource: validatedData.incomeSource,
      payerName: validatedData.payerName,
    },
    create: {
      transactionId,
      incomeSource: validatedData.incomeSource,
      payerName: validatedData.payerName,
    },
  });
}

// Re-fetch the complete transaction with all updated details
const updatedTransaction = await tx.financialTransaction.findUnique({
  where: { id: transactionId },
  include: {
    createdByUser: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    },
    approvedByUser: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    },
    expenseDetails: true,
    incomeDetails: true,
  },
});

return updatedTransaction;
```

---

### 2.3 Fix Type Assertions

**Priority:** LOW
**Files:** Multiple transaction routes

Replace unsafe `as any` casts with proper type handling:

```typescript
// Before:
paymentMethod: validatedData.paymentMethod as any,

// After:
paymentMethod: validatedData.paymentMethod ?? null,
```

The Zod schema already validates these are correct enum values.

---

## 3. Feature: Daily Trends Implementation

**Priority:** MEDIUM
**File:** `src/app/api/finance/analytics/route.ts`
**Issue:** `dailyTrends` always returns empty array

### 3.1 Implementation

Replace line 397 with a complete daily trends calculation:

```typescript
// Calculate daily trends from all sources
const dailyTrendsMap = new Map<string, { income: number; expense: number; date: string }>();

// Helper to add to daily map
const addToDaily = (date: Date | null, amount: number, type: 'income' | 'expense') => {
  if (!date) return;
  const dateKey = date.toISOString().split('T')[0];
  const existing = dailyTrendsMap.get(dateKey) || { income: 0, expense: 0, date: dateKey };
  if (type === 'income') {
    existing.income += amount;
  } else {
    existing.expense += amount;
  }
  dailyTrendsMap.set(dateKey, existing);
};

// Fetch transactions for trend data
const [trendFinancial, trendSales, trendStock] = await Promise.all([
  prisma.financialTransaction.findMany({
    where: financialWhere,
    select: { transactionDate: true, amount: true, type: true },
  }),
  includeIncome
    ? prisma.salesTransaction.findMany({
        where: salesWhere,
        select: { created_at: true, total_amount: true },
      })
    : Promise.resolve([]),
  includeExpense
    ? prisma.stockAddition.findMany({
        where: stockWhere,
        select: { purchaseDate: true, totalCost: true },
      })
    : Promise.resolve([]),
]);

// Process financial transactions
trendFinancial.forEach(t => {
  addToDaily(
    t.transactionDate,
    Number(t.amount) || 0,
    t.type === 'INCOME' ? 'income' : 'expense'
  );
});

// Process sales
trendSales.forEach(s => {
  addToDaily(s.created_at, Number(s.total_amount) || 0, 'income');
});

// Process stock additions
trendStock.forEach(sa => {
  addToDaily(sa.purchaseDate, Number(sa.totalCost) || 0, 'expense');
});

// Convert to sorted array
const dailyTrends = Array.from(dailyTrendsMap.values())
  .sort((a, b) => a.date.localeCompare(b.date))
  .map(d => ({
    date: d.date,
    income: d.income,
    expense: d.expense,
    net: d.income - d.expense,
  }));
```

Update the response object:
```typescript
charts: {
  paymentMethodDistribution,
  dailyTrends,  // Now populated
},
```

### 3.2 Frontend Component

**File:** `src/components/finance/charts/DailyTrendsChart.tsx`

```typescript
'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/finance';

interface DailyTrend {
  date: string;
  income: number;
  expense: number;
  net: number;
}

interface DailyTrendsChartProps {
  data: DailyTrend[];
  isLoading?: boolean;
}

export function DailyTrendsChart({ data, isLoading }: DailyTrendsChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Financial Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-NG', {
                month: 'short',
                day: 'numeric'
              })}
            />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label) => new Date(label).toLocaleDateString('en-NG', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#22c55e"
              strokeWidth={2}
              name="Income"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="expense"
              stroke="#ef4444"
              strokeWidth={2}
              name="Expenses"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="net"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Net"
              dot={false}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

---

## 4. Feature: Financial KPIs Dashboard

### 4.1 New API Endpoint

**File:** `src/app/api/finance/kpis/route.ts`

```typescript
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth/roles';
import { createApiResponse } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { SUCCESSFUL_PAYMENT_STATUSES } from '@/lib/constants';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    if (!hasPermission(request.user.role, 'FINANCIAL_ANALYTICS')) {
      return createApiResponse.forbidden(
        'Insufficient permissions to view financial KPIs'
      );
    }

    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '3');

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth() - months, 1);

    // Get all financial data for the period
    const [financialData, salesData, stockData] = await Promise.all([
      prisma.financialTransaction.groupBy({
        by: ['type'],
        where: {
          transactionDate: { gte: periodStart, lte: now },
          status: { in: ['COMPLETED', 'APPROVED'] },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.salesTransaction.aggregate({
        where: {
          created_at: { gte: periodStart, lte: now },
          payment_status: { in: SUCCESSFUL_PAYMENT_STATUSES },
        },
        _sum: { total_amount: true },
        _count: true,
      }),
      prisma.stockAddition.aggregate({
        where: {
          purchaseDate: { gte: periodStart, lte: now },
        },
        _sum: { totalCost: true },
        _count: true,
      }),
    ]);

    // Calculate totals
    let manualIncome = 0;
    let manualExpense = 0;
    financialData.forEach(d => {
      if (d.type === 'INCOME') manualIncome = Number(d._sum.amount) || 0;
      if (d.type === 'EXPENSE') manualExpense = Number(d._sum.amount) || 0;
    });

    const salesIncome = Number(salesData._sum.total_amount) || 0;
    const purchaseExpense = Number(stockData._sum.totalCost) || 0;

    const totalIncome = manualIncome + salesIncome;
    const totalExpenses = manualExpense + purchaseExpense;
    const netProfit = totalIncome - totalExpenses;

    // Calculate KPIs
    const daysInPeriod = Math.ceil(
      (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Burn Rate: Average daily expense
    const dailyBurnRate = totalExpenses / daysInPeriod;
    const monthlyBurnRate = dailyBurnRate * 30;

    // Get current cash position (simplified - sum of all net income)
    const allTimeData = await Promise.all([
      prisma.financialTransaction.aggregate({
        where: { type: 'INCOME', status: { in: ['COMPLETED', 'APPROVED'] } },
        _sum: { amount: true },
      }),
      prisma.financialTransaction.aggregate({
        where: { type: 'EXPENSE', status: { in: ['COMPLETED', 'APPROVED'] } },
        _sum: { amount: true },
      }),
      prisma.salesTransaction.aggregate({
        where: { payment_status: { in: SUCCESSFUL_PAYMENT_STATUSES } },
        _sum: { total_amount: true },
      }),
      prisma.stockAddition.aggregate({
        _sum: { totalCost: true },
      }),
    ]);

    const allTimeIncome =
      (Number(allTimeData[0]._sum.amount) || 0) +
      (Number(allTimeData[2]._sum.total_amount) || 0);
    const allTimeExpense =
      (Number(allTimeData[1]._sum.amount) || 0) +
      (Number(allTimeData[3]._sum.totalCost) || 0);
    const estimatedCashPosition = allTimeIncome - allTimeExpense;

    // Runway: Months of cash remaining at current burn rate
    const runwayMonths =
      monthlyBurnRate > 0
        ? Math.max(0, estimatedCashPosition / monthlyBurnRate)
        : Infinity;

    // Operating Expense Ratio: OpEx as % of revenue
    const operatingExpenseRatio =
      totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

    // Profit Margin
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    // Break-even point (monthly revenue needed to cover monthly expenses)
    const breakEvenRevenue = monthlyBurnRate;

    // Revenue per day
    const dailyRevenue = totalIncome / daysInPeriod;

    // Days to break-even (if currently in loss)
    const daysToBreakEven =
      netProfit < 0 && dailyRevenue > dailyBurnRate
        ? Math.abs(netProfit) / (dailyRevenue - dailyBurnRate)
        : 0;

    const kpis = {
      period: {
        startDate: periodStart.toISOString(),
        endDate: now.toISOString(),
        days: daysInPeriod,
        months,
      },
      summary: {
        totalIncome,
        totalExpenses,
        netProfit,
        profitMargin: Math.round(profitMargin * 100) / 100,
      },
      burnRate: {
        daily: Math.round(dailyBurnRate * 100) / 100,
        monthly: Math.round(monthlyBurnRate * 100) / 100,
        trend: 'stable', // TODO: Calculate trend by comparing periods
      },
      runway: {
        months: runwayMonths === Infinity ? null : Math.round(runwayMonths * 10) / 10,
        estimatedCashPosition: Math.round(estimatedCashPosition * 100) / 100,
        status:
          runwayMonths === Infinity
            ? 'healthy'
            : runwayMonths > 6
              ? 'healthy'
              : runwayMonths > 3
                ? 'caution'
                : 'critical',
      },
      efficiency: {
        operatingExpenseRatio: Math.round(operatingExpenseRatio * 100) / 100,
        breakEvenRevenue: Math.round(breakEvenRevenue * 100) / 100,
        dailyRevenue: Math.round(dailyRevenue * 100) / 100,
        daysToBreakEven: daysToBreakEven > 0 ? Math.ceil(daysToBreakEven) : null,
      },
      health: {
        score: calculateHealthScore(profitMargin, runwayMonths, operatingExpenseRatio),
        indicators: {
          profitability: profitMargin > 0 ? 'positive' : 'negative',
          cashflow: runwayMonths > 6 ? 'healthy' : runwayMonths > 3 ? 'moderate' : 'low',
          efficiency: operatingExpenseRatio < 80 ? 'efficient' : 'high-cost',
        },
      },
    };

    return createApiResponse.success(kpis, 'Financial KPIs calculated successfully');
  } catch (error) {
    console.error('Error calculating financial KPIs:', error);
    return createApiResponse.internalError('Failed to calculate financial KPIs');
  }
});

function calculateHealthScore(
  profitMargin: number,
  runwayMonths: number,
  opExRatio: number
): number {
  let score = 50; // Base score

  // Profitability component (max 30 points)
  if (profitMargin > 20) score += 30;
  else if (profitMargin > 10) score += 20;
  else if (profitMargin > 0) score += 10;
  else if (profitMargin > -10) score += 0;
  else score -= 10;

  // Runway component (max 20 points)
  if (runwayMonths === Infinity || runwayMonths > 12) score += 20;
  else if (runwayMonths > 6) score += 15;
  else if (runwayMonths > 3) score += 5;
  else score -= 10;

  // Efficiency component (max 10 points)
  if (opExRatio < 60) score += 10;
  else if (opExRatio < 80) score += 5;
  else if (opExRatio > 100) score -= 10;

  return Math.max(0, Math.min(100, score));
}
```

### 4.2 Frontend Component

**File:** `src/components/finance/widgets/FinancialKPIsWidget.tsx`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils/finance';
import {
  TrendingUp,
  TrendingDown,
  Flame,
  Clock,
  Target,
  Activity,
} from 'lucide-react';

interface KPIData {
  period: { startDate: string; endDate: string; days: number; months: number };
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
  };
  burnRate: { daily: number; monthly: number; trend: string };
  runway: {
    months: number | null;
    estimatedCashPosition: number;
    status: 'healthy' | 'caution' | 'critical';
  };
  efficiency: {
    operatingExpenseRatio: number;
    breakEvenRevenue: number;
    dailyRevenue: number;
    daysToBreakEven: number | null;
  };
  health: {
    score: number;
    indicators: {
      profitability: string;
      cashflow: string;
      efficiency: string;
    };
  };
}

async function fetchKPIs(months: number): Promise<KPIData> {
  const response = await fetch(`/api/finance/kpis?months=${months}`);
  if (!response.ok) throw new Error('Failed to fetch KPIs');
  const data = await response.json();
  return data.data;
}

interface FinancialKPIsWidgetProps {
  months?: number;
}

export function FinancialKPIsWidget({ months = 3 }: FinancialKPIsWidgetProps) {
  const { data: kpis, isLoading, error } = useQuery({
    queryKey: ['financial-kpis', months],
    queryFn: () => fetchKPIs(months),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return <KPIsSkeleton />;
  }

  if (error || !kpis) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Failed to load financial KPIs</p>
        </CardContent>
      </Card>
    );
  }

  const runwayStatusColors = {
    healthy: 'bg-green-500',
    caution: 'bg-yellow-500',
    critical: 'bg-red-500',
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Health Score */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Financial Health</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.health.score}/100</div>
          <Progress value={kpis.health.score} className="mt-2" />
          <div className="mt-2 flex gap-2">
            <Badge variant={kpis.health.indicators.profitability === 'positive' ? 'default' : 'destructive'}>
              {kpis.health.indicators.profitability}
            </Badge>
            <Badge variant="outline">{kpis.health.indicators.efficiency}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Burn Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Monthly Burn Rate</CardTitle>
          <Flame className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(kpis.burnRate.monthly)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatCurrency(kpis.burnRate.daily)}/day average
          </p>
        </CardContent>
      </Card>

      {/* Runway */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Cash Runway</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {kpis.runway.months !== null
              ? `${kpis.runway.months} months`
              : 'Profitable'}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div
              className={`h-2 w-2 rounded-full ${runwayStatusColors[kpis.runway.status]}`}
            />
            <span className="text-xs text-muted-foreground capitalize">
              {kpis.runway.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Cash: {formatCurrency(kpis.runway.estimatedCashPosition)}
          </p>
        </CardContent>
      </Card>

      {/* Profit Margin */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
          {kpis.summary.profitMargin >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              kpis.summary.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {kpis.summary.profitMargin.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Net: {formatCurrency(kpis.summary.netProfit)}
          </p>
        </CardContent>
      </Card>

      {/* Operating Expense Ratio */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">OpEx Ratio</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {kpis.efficiency.operatingExpenseRatio.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            of revenue spent on operations
          </p>
          <Progress
            value={Math.min(100, kpis.efficiency.operatingExpenseRatio)}
            className="mt-2"
          />
        </CardContent>
      </Card>

      {/* Break-even */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Break-even Revenue</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(kpis.efficiency.breakEvenRevenue)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            monthly revenue needed
          </p>
          {kpis.efficiency.daysToBreakEven && (
            <p className="text-xs text-amber-600 mt-1">
              ~{kpis.efficiency.daysToBreakEven} days to break-even
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KPIsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            <div className="h-3 w-20 bg-muted animate-pulse rounded mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### 4.3 Add Hook

**File:** `src/hooks/api/finance.ts`

Add to existing hooks:

```typescript
export function useFinancialKPIs(months: number = 3) {
  return useQuery({
    queryKey: ['financial-kpis', months],
    queryFn: async () => {
      const response = await fetch(`/api/finance/kpis?months=${months}`);
      if (!response.ok) {
        throw new Error('Failed to fetch financial KPIs');
      }
      const data = await response.json();
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

---

## 5. Feature: Profit Margin Dashboard

### 5.1 New API Endpoint

**File:** `src/app/api/finance/profit-margins/route.ts`

```typescript
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth/roles';
import { createApiResponse } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { SUCCESSFUL_PAYMENT_STATUSES } from '@/lib/constants';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    if (!hasPermission(request.user.role, 'FINANCIAL_ANALYTICS')) {
      return createApiResponse.forbidden(
        'Insufficient permissions to view profit margins'
      );
    }

    const { searchParams } = new URL(request.url);
    const periodMonths = parseInt(searchParams.get('months') || '12');

    const now = new Date();
    const periods: Array<{
      label: string;
      startDate: Date;
      endDate: Date;
    }> = [];

    // Generate monthly periods
    for (let i = periodMonths - 1; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      periods.push({
        label: startDate.toLocaleDateString('en-NG', {
          month: 'short',
          year: 'numeric',
        }),
        startDate,
        endDate: endDate > now ? now : endDate,
      });
    }

    // Calculate margins for each period
    const marginData = await Promise.all(
      periods.map(async period => {
        const [financialIncome, financialExpense, sales, cogs] = await Promise.all([
          // Manual income
          prisma.financialTransaction.aggregate({
            where: {
              type: 'INCOME',
              status: { in: ['COMPLETED', 'APPROVED'] },
              transactionDate: { gte: period.startDate, lte: period.endDate },
            },
            _sum: { amount: true },
          }),
          // Manual expenses
          prisma.financialTransaction.aggregate({
            where: {
              type: 'EXPENSE',
              status: { in: ['COMPLETED', 'APPROVED'] },
              transactionDate: { gte: period.startDate, lte: period.endDate },
            },
            _sum: { amount: true },
          }),
          // Sales income
          prisma.salesTransaction.aggregate({
            where: {
              payment_status: { in: SUCCESSFUL_PAYMENT_STATUSES },
              created_at: { gte: period.startDate, lte: period.endDate },
            },
            _sum: { total_amount: true },
          }),
          // Cost of goods (stock purchases)
          prisma.stockAddition.aggregate({
            where: {
              purchaseDate: { gte: period.startDate, lte: period.endDate },
            },
            _sum: { totalCost: true },
          }),
        ]);

        const totalRevenue =
          (Number(financialIncome._sum.amount) || 0) +
          (Number(sales._sum.total_amount) || 0);

        const totalCOGS = Number(cogs._sum.totalCost) || 0;
        const totalExpenses = Number(financialExpense._sum.amount) || 0;

        const grossProfit = totalRevenue - totalCOGS;
        const netProfit = totalRevenue - totalCOGS - totalExpenses;

        const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        const operatingMargin =
          totalRevenue > 0
            ? ((totalRevenue - totalExpenses) / totalRevenue) * 100
            : 0;

        return {
          period: period.label,
          revenue: totalRevenue,
          cogs: totalCOGS,
          operatingExpenses: totalExpenses,
          grossProfit,
          netProfit,
          grossMargin: Math.round(grossMargin * 100) / 100,
          netMargin: Math.round(netMargin * 100) / 100,
          operatingMargin: Math.round(operatingMargin * 100) / 100,
        };
      })
    );

    // Calculate by income source
    const incomeSourceBreakdown = await prisma.incomeDetail.groupBy({
      by: ['incomeSource'],
      where: {
        transaction: {
          status: { in: ['COMPLETED', 'APPROVED'] },
          transactionDate: {
            gte: periods[0].startDate,
            lte: periods[periods.length - 1].endDate,
          },
        },
      },
      _count: true,
    });

    const sourceMargins = await Promise.all(
      incomeSourceBreakdown.map(async source => {
        const sourceIncome = await prisma.financialTransaction.aggregate({
          where: {
            type: 'INCOME',
            status: { in: ['COMPLETED', 'APPROVED'] },
            incomeDetails: { incomeSource: source.incomeSource },
          },
          _sum: { amount: true },
        });

        return {
          source: source.incomeSource,
          revenue: Number(sourceIncome._sum.amount) || 0,
          transactionCount: source._count,
        };
      })
    );

    // Add sales as a source
    const salesTotal = await prisma.salesTransaction.aggregate({
      where: {
        payment_status: { in: SUCCESSFUL_PAYMENT_STATUSES },
        created_at: {
          gte: periods[0].startDate,
          lte: periods[periods.length - 1].endDate,
        },
      },
      _sum: { total_amount: true },
      _count: true,
    });

    sourceMargins.push({
      source: 'POS_SALES',
      revenue: Number(salesTotal._sum.total_amount) || 0,
      transactionCount: salesTotal._count || 0,
    });

    // Calculate totals and averages
    const totals = marginData.reduce(
      (acc, m) => ({
        revenue: acc.revenue + m.revenue,
        grossProfit: acc.grossProfit + m.grossProfit,
        netProfit: acc.netProfit + m.netProfit,
      }),
      { revenue: 0, grossProfit: 0, netProfit: 0 }
    );

    const averageGrossMargin =
      totals.revenue > 0 ? (totals.grossProfit / totals.revenue) * 100 : 0;
    const averageNetMargin =
      totals.revenue > 0 ? (totals.netProfit / totals.revenue) * 100 : 0;

    return createApiResponse.success(
      {
        trends: marginData,
        bySource: sourceMargins.sort((a, b) => b.revenue - a.revenue),
        summary: {
          totalRevenue: totals.revenue,
          totalGrossProfit: totals.grossProfit,
          totalNetProfit: totals.netProfit,
          averageGrossMargin: Math.round(averageGrossMargin * 100) / 100,
          averageNetMargin: Math.round(averageNetMargin * 100) / 100,
        },
        period: {
          months: periodMonths,
          startDate: periods[0].startDate.toISOString(),
          endDate: periods[periods.length - 1].endDate.toISOString(),
        },
      },
      'Profit margin data retrieved successfully'
    );
  } catch (error) {
    console.error('Error fetching profit margins:', error);
    return createApiResponse.internalError('Failed to fetch profit margin data');
  }
});
```

### 5.2 Frontend Component

**File:** `src/components/finance/dashboards/ProfitMarginDashboard.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils/finance';
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface ProfitMarginData {
  trends: Array<{
    period: string;
    revenue: number;
    grossProfit: number;
    netProfit: number;
    grossMargin: number;
    netMargin: number;
  }>;
  bySource: Array<{
    source: string;
    revenue: number;
    transactionCount: number;
  }>;
  summary: {
    totalRevenue: number;
    totalGrossProfit: number;
    totalNetProfit: number;
    averageGrossMargin: number;
    averageNetMargin: number;
  };
}

async function fetchProfitMargins(months: number): Promise<ProfitMarginData> {
  const response = await fetch(`/api/finance/profit-margins?months=${months}`);
  if (!response.ok) throw new Error('Failed to fetch');
  const data = await response.json();
  return data.data;
}

export function ProfitMarginDashboard() {
  const [months, setMonths] = useState(12);

  const { data, isLoading, error } = useQuery({
    queryKey: ['profit-margins', months],
    queryFn: () => fetchProfitMargins(months),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <ProfitMarginSkeleton />;
  if (error || !data) return <div>Failed to load profit margin data</div>;

  const latestMargin = data.trends[data.trends.length - 1];
  const previousMargin = data.trends[data.trends.length - 2];
  const marginTrend =
    latestMargin && previousMargin
      ? latestMargin.netMargin - previousMargin.netMargin
      : 0;

  return (
    <div className="space-y-6">
      {/* Header with period selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Profit Margin Analysis</h2>
        <Select value={months.toString()} onValueChange={v => setMonths(parseInt(v))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Last 3 months</SelectItem>
            <SelectItem value="6">Last 6 months</SelectItem>
            <SelectItem value="12">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.summary.totalRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.summary.totalGrossProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.summary.averageGrossMargin}% margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            {data.summary.totalNetProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                data.summary.totalNetProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(data.summary.totalNetProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.summary.averageNetMargin}% margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Margin Trend</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                marginTrend >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {marginTrend >= 0 ? '+' : ''}
              {marginTrend.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">vs previous month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Margin Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Profit Margin Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="grossMargin"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="Gross Margin %"
                />
                <Line
                  type="monotone"
                  dataKey="netMargin"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Net Margin %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Source */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.bySource}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="revenue"
                  nameKey="source"
                  label={({ source, percent }) =>
                    `${source.replace('_', ' ')}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {data.bySource.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Profit Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Profit Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis tickFormatter={v => formatCurrency(v)} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                <Bar dataKey="grossProfit" fill="#22c55e" name="Gross Profit" />
                <Bar dataKey="netProfit" fill="#8b5cf6" name="Net Profit" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProfitMarginSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 bg-muted animate-pulse rounded" />
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-4 w-20 bg-muted animate-pulse rounded mb-2" />
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## 6. Feature: Cash Flow Forecast

### 6.1 New API Endpoint

**File:** `src/app/api/finance/cash-flow-forecast/route.ts`

```typescript
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth/roles';
import { createApiResponse } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { SUCCESSFUL_PAYMENT_STATUSES } from '@/lib/constants';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    if (!hasPermission(request.user.role, 'FINANCIAL_ANALYTICS')) {
      return createApiResponse.forbidden(
        'Insufficient permissions to view cash flow forecast'
      );
    }

    const { searchParams } = new URL(request.url);
    const forecastDays = parseInt(searchParams.get('days') || '90');
    const historicalMonths = parseInt(searchParams.get('historicalMonths') || '6');

    const now = new Date();
    const historicalStart = new Date(
      now.getFullYear(),
      now.getMonth() - historicalMonths,
      1
    );

    // Get historical data for pattern analysis
    const [historicalIncome, historicalExpenses, historicalSales, historicalPurchases] =
      await Promise.all([
        prisma.financialTransaction.findMany({
          where: {
            type: 'INCOME',
            status: { in: ['COMPLETED', 'APPROVED'] },
            transactionDate: { gte: historicalStart, lte: now },
          },
          select: { amount: true, transactionDate: true },
        }),
        prisma.financialTransaction.findMany({
          where: {
            type: 'EXPENSE',
            status: { in: ['COMPLETED', 'APPROVED'] },
            transactionDate: { gte: historicalStart, lte: now },
          },
          select: { amount: true, transactionDate: true },
        }),
        prisma.salesTransaction.findMany({
          where: {
            payment_status: { in: SUCCESSFUL_PAYMENT_STATUSES },
            created_at: { gte: historicalStart, lte: now },
          },
          select: { total_amount: true, created_at: true },
        }),
        prisma.stockAddition.findMany({
          where: {
            purchaseDate: { gte: historicalStart, lte: now },
          },
          select: { totalCost: true, purchaseDate: true },
        }),
      ]);

    // Calculate daily averages
    const daysOfHistory = Math.ceil(
      (now.getTime() - historicalStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    const totalHistoricalIncome =
      historicalIncome.reduce((sum, t) => sum + Number(t.amount), 0) +
      historicalSales.reduce((sum, s) => sum + Number(s.total_amount), 0);

    const totalHistoricalExpenses =
      historicalExpenses.reduce((sum, t) => sum + Number(t.amount), 0) +
      historicalPurchases.reduce((sum, p) => sum + Number(p.totalCost), 0);

    const avgDailyIncome = totalHistoricalIncome / daysOfHistory;
    const avgDailyExpense = totalHistoricalExpenses / daysOfHistory;
    const avgDailyNetCashFlow = avgDailyIncome - avgDailyExpense;

    // Calculate day-of-week patterns
    const dayOfWeekIncome: number[] = Array(7).fill(0);
    const dayOfWeekExpense: number[] = Array(7).fill(0);
    const dayOfWeekCounts: number[] = Array(7).fill(0);

    [...historicalIncome, ...historicalSales.map(s => ({ amount: s.total_amount, transactionDate: s.created_at }))].forEach(t => {
      const day = new Date(t.transactionDate!).getDay();
      dayOfWeekIncome[day] += Number(t.amount);
      dayOfWeekCounts[day]++;
    });

    [...historicalExpenses, ...historicalPurchases.map(p => ({ amount: p.totalCost, transactionDate: p.purchaseDate }))].forEach(t => {
      const day = new Date(t.transactionDate!).getDay();
      dayOfWeekExpense[day] += Number(t.amount);
    });

    // Normalize to get day-of-week multipliers
    const dayMultipliers = dayOfWeekIncome.map((inc, i) => {
      const avgInc = inc / Math.max(1, dayOfWeekCounts[i]);
      return avgDailyIncome > 0 ? avgInc / avgDailyIncome : 1;
    });

    // Get current estimated cash position
    const allTimeData = await Promise.all([
      prisma.financialTransaction.aggregate({
        where: { type: 'INCOME', status: { in: ['COMPLETED', 'APPROVED'] } },
        _sum: { amount: true },
      }),
      prisma.financialTransaction.aggregate({
        where: { type: 'EXPENSE', status: { in: ['COMPLETED', 'APPROVED'] } },
        _sum: { amount: true },
      }),
      prisma.salesTransaction.aggregate({
        where: { payment_status: { in: SUCCESSFUL_PAYMENT_STATUSES } },
        _sum: { total_amount: true },
      }),
      prisma.stockAddition.aggregate({
        _sum: { totalCost: true },
      }),
    ]);

    const currentCashPosition =
      (Number(allTimeData[0]._sum.amount) || 0) +
      (Number(allTimeData[2]._sum.total_amount) || 0) -
      (Number(allTimeData[1]._sum.amount) || 0) -
      (Number(allTimeData[3]._sum.totalCost) || 0);

    // Generate forecast
    const forecast: Array<{
      date: string;
      projectedIncome: number;
      projectedExpense: number;
      projectedNetCashFlow: number;
      projectedCashPosition: number;
      confidence: 'high' | 'medium' | 'low';
    }> = [];

    let runningCashPosition = currentCashPosition;

    for (let i = 1; i <= forecastDays; i++) {
      const forecastDate = new Date(now);
      forecastDate.setDate(forecastDate.getDate() + i);
      const dayOfWeek = forecastDate.getDay();

      // Apply day-of-week multiplier for more realistic projections
      const multiplier = dayMultipliers[dayOfWeek] || 1;
      const projectedIncome = avgDailyIncome * multiplier;
      const projectedExpense = avgDailyExpense;
      const projectedNetCashFlow = projectedIncome - projectedExpense;

      runningCashPosition += projectedNetCashFlow;

      // Confidence decreases over time
      const confidence: 'high' | 'medium' | 'low' =
        i <= 30 ? 'high' : i <= 60 ? 'medium' : 'low';

      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        projectedIncome: Math.round(projectedIncome * 100) / 100,
        projectedExpense: Math.round(projectedExpense * 100) / 100,
        projectedNetCashFlow: Math.round(projectedNetCashFlow * 100) / 100,
        projectedCashPosition: Math.round(runningCashPosition * 100) / 100,
        confidence,
      });
    }

    // Calculate key forecast metrics
    const endOfMonthIdx = Math.min(29, forecast.length - 1);
    const endOfQuarterIdx = Math.min(89, forecast.length - 1);

    const metrics = {
      current: {
        cashPosition: Math.round(currentCashPosition * 100) / 100,
        date: now.toISOString().split('T')[0],
      },
      thirtyDay: {
        projectedCashPosition: forecast[endOfMonthIdx]?.projectedCashPosition || 0,
        totalProjectedIncome:
          forecast.slice(0, 30).reduce((sum, f) => sum + f.projectedIncome, 0),
        totalProjectedExpense:
          forecast.slice(0, 30).reduce((sum, f) => sum + f.projectedExpense, 0),
      },
      ninetyDay: {
        projectedCashPosition: forecast[endOfQuarterIdx]?.projectedCashPosition || 0,
        totalProjectedIncome:
          forecast.slice(0, 90).reduce((sum, f) => sum + f.projectedIncome, 0),
        totalProjectedExpense:
          forecast.slice(0, 90).reduce((sum, f) => sum + f.projectedExpense, 0),
      },
      runway: {
        daysUntilNegative:
          avgDailyNetCashFlow < 0
            ? Math.floor(currentCashPosition / Math.abs(avgDailyNetCashFlow))
            : null,
        isPositive: avgDailyNetCashFlow >= 0,
      },
      averages: {
        dailyIncome: Math.round(avgDailyIncome * 100) / 100,
        dailyExpense: Math.round(avgDailyExpense * 100) / 100,
        dailyNetCashFlow: Math.round(avgDailyNetCashFlow * 100) / 100,
      },
    };

    // Identify potential cash crunches (days where cash position drops below threshold)
    const warningThreshold = currentCashPosition * 0.2; // 20% of current position
    const warnings = forecast
      .filter(f => f.projectedCashPosition < warningThreshold)
      .slice(0, 5)
      .map(f => ({
        date: f.date,
        projectedCashPosition: f.projectedCashPosition,
        severity: f.projectedCashPosition < 0 ? 'critical' : 'warning',
      }));

    return createApiResponse.success(
      {
        forecast: forecast.filter((_, i) => i % (forecastDays > 30 ? 7 : 1) === 0), // Weekly for long forecasts
        fullForecast: forecast,
        metrics,
        warnings,
        methodology: {
          historicalPeriod: `${historicalMonths} months`,
          forecastPeriod: `${forecastDays} days`,
          model: 'Moving average with day-of-week adjustment',
        },
      },
      'Cash flow forecast generated successfully'
    );
  } catch (error) {
    console.error('Error generating cash flow forecast:', error);
    return createApiResponse.internalError('Failed to generate cash flow forecast');
  }
});
```

### 6.2 Frontend Component

**File:** `src/components/finance/dashboards/CashFlowForecastDashboard.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/utils/finance';
import { AlertTriangle, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface ForecastData {
  forecast: Array<{
    date: string;
    projectedIncome: number;
    projectedExpense: number;
    projectedNetCashFlow: number;
    projectedCashPosition: number;
    confidence: 'high' | 'medium' | 'low';
  }>;
  metrics: {
    current: { cashPosition: number; date: string };
    thirtyDay: {
      projectedCashPosition: number;
      totalProjectedIncome: number;
      totalProjectedExpense: number;
    };
    ninetyDay: {
      projectedCashPosition: number;
      totalProjectedIncome: number;
      totalProjectedExpense: number;
    };
    runway: { daysUntilNegative: number | null; isPositive: boolean };
    averages: {
      dailyIncome: number;
      dailyExpense: number;
      dailyNetCashFlow: number;
    };
  };
  warnings: Array<{
    date: string;
    projectedCashPosition: number;
    severity: 'critical' | 'warning';
  }>;
}

async function fetchForecast(days: number): Promise<ForecastData> {
  const response = await fetch(`/api/finance/cash-flow-forecast?days=${days}`);
  if (!response.ok) throw new Error('Failed to fetch');
  const data = await response.json();
  return data.data;
}

export function CashFlowForecastDashboard() {
  const [forecastDays, setForecastDays] = useState(90);

  const { data, isLoading, error } = useQuery({
    queryKey: ['cash-flow-forecast', forecastDays],
    queryFn: () => fetchForecast(forecastDays),
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) return <ForecastSkeleton />;
  if (error || !data) return <div>Failed to load forecast</div>;

  const thirtyDayChange =
    data.metrics.thirtyDay.projectedCashPosition - data.metrics.current.cashPosition;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Cash Flow Forecast</h2>
        <Select
          value={forecastDays.toString()}
          onValueChange={v => setForecastDays(parseInt(v))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Forecast period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">30 days</SelectItem>
            <SelectItem value="60">60 days</SelectItem>
            <SelectItem value="90">90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Warnings */}
      {data.warnings.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Cash Flow Warning</AlertTitle>
          <AlertDescription>
            Projected low cash position on{' '}
            {data.warnings.map(w => new Date(w.date).toLocaleDateString()).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Cash</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.metrics.current.cashPosition)}
            </div>
            <p className="text-xs text-muted-foreground">
              as of {new Date(data.metrics.current.date).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">30-Day Projection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.metrics.thirtyDay.projectedCashPosition)}
            </div>
            <div className="flex items-center gap-1">
              {thirtyDayChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span
                className={`text-xs ${
                  thirtyDayChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {thirtyDayChange >= 0 ? '+' : ''}
                {formatCurrency(thirtyDayChange)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily Net Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                data.metrics.averages.dailyNetCashFlow >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {formatCurrency(data.metrics.averages.dailyNetCashFlow)}
            </div>
            <p className="text-xs text-muted-foreground">average per day</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cash Runway</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.runway.daysUntilNegative !== null
                ? `${data.metrics.runway.daysUntilNegative} days`
                : 'Sustainable'}
            </div>
            <Badge
              variant={data.metrics.runway.isPositive ? 'default' : 'destructive'}
            >
              {data.metrics.runway.isPositive ? 'Positive trend' : 'Negative trend'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Projected Cash Position</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data.forecast}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={v =>
                  new Date(v).toLocaleDateString('en-NG', {
                    month: 'short',
                    day: 'numeric',
                  })
                }
              />
              <YAxis tickFormatter={v => formatCurrency(v)} />
              <Tooltip
                formatter={(v: number) => formatCurrency(v)}
                labelFormatter={v =>
                  new Date(v).toLocaleDateString('en-NG', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })
                }
              />
              <ReferenceLine
                y={0}
                stroke="#ef4444"
                strokeDasharray="5 5"
                label="Break-even"
              />
              <ReferenceLine
                y={data.metrics.current.cashPosition}
                stroke="#3b82f6"
                strokeDasharray="3 3"
                label="Current"
              />
              <Area
                type="monotone"
                dataKey="projectedCashPosition"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.3}
                name="Projected Cash"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Income vs Expense Projection */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">30-Day Projected Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.metrics.thirtyDay.totalProjectedIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              ~{formatCurrency(data.metrics.averages.dailyIncome)}/day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">30-Day Projected Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(data.metrics.thirtyDay.totalProjectedExpense)}
            </div>
            <p className="text-xs text-muted-foreground">
              ~{formatCurrency(data.metrics.averages.dailyExpense)}/day
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Methodology Note */}
      <Card>
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 inline mr-1" />
            Forecast based on {forecastDays}-day projection using historical patterns
            from the last 6 months. Confidence decreases for projections beyond 30 days.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ForecastSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-muted animate-pulse rounded" />
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-4 w-20 bg-muted animate-pulse rounded mb-2" />
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="animate-pulse">Loading forecast...</div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 7. Feature: Accounts Receivable Integration

### 7.1 New API Endpoint

**File:** `src/app/api/finance/receivables/route.ts`

This integrates with existing sales transactions that have unpaid/partial payment status.

```typescript
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth/roles';
import { createApiResponse } from '@/lib/api-response';
import { prisma } from '@/lib/db';

// Payment statuses that indicate money is still owed
const UNPAID_STATUSES = ['pending', 'partial', 'failed'];

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    if (!hasPermission(request.user.role, 'FINANCE_TRANSACTIONS_READ')) {
      return createApiResponse.forbidden(
        'Insufficient permissions to view accounts receivable'
      );
    }

    const { searchParams } = new URL(request.url);
    const agingDays = parseInt(searchParams.get('agingDays') || '90');

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const cutoffDate = new Date(now.getTime() - agingDays * 24 * 60 * 60 * 1000);

    // Get all unpaid/partial sales transactions
    const unpaidSales = await prisma.salesTransaction.findMany({
      where: {
        payment_status: { in: UNPAID_STATUSES },
        created_at: { gte: cutoffDate },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        transaction_payments: {
          select: {
            amount: true,
            payment_date: true,
            payment_method: true,
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    // Calculate amounts and aging
    const receivables = unpaidSales.map(sale => {
      const totalAmount = Number(sale.total_amount);
      const paidAmount = sale.transaction_payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      const outstandingAmount = totalAmount - paidAmount;
      const saleDate = new Date(sale.created_at!);
      const daysOutstanding = Math.floor(
        (now.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      let agingBucket: '0-30' | '31-60' | '61-90' | '90+';
      if (daysOutstanding <= 30) agingBucket = '0-30';
      else if (daysOutstanding <= 60) agingBucket = '31-60';
      else if (daysOutstanding <= 90) agingBucket = '61-90';
      else agingBucket = '90+';

      return {
        id: sale.id,
        transactionNumber: sale.transaction_number,
        customer: sale.customer || { name: 'Walk-in Customer' },
        saleDate: sale.created_at,
        totalAmount,
        paidAmount,
        outstandingAmount,
        daysOutstanding,
        agingBucket,
        paymentStatus: sale.payment_status,
        createdBy: sale.users,
        payments: sale.transaction_payments,
      };
    });

    // Calculate aging summary
    const agingSummary = {
      '0-30': { count: 0, amount: 0 },
      '31-60': { count: 0, amount: 0 },
      '61-90': { count: 0, amount: 0 },
      '90+': { count: 0, amount: 0 },
    };

    receivables.forEach(r => {
      agingSummary[r.agingBucket].count++;
      agingSummary[r.agingBucket].amount += r.outstandingAmount;
    });

    // Calculate totals
    const totalOutstanding = receivables.reduce(
      (sum, r) => sum + r.outstandingAmount,
      0
    );
    const totalTransactions = receivables.length;

    // Get top debtors
    const customerDebt = new Map<
      string,
      { customer: any; totalOwed: number; transactionCount: number }
    >();

    receivables.forEach(r => {
      const customerId = r.customer?.id?.toString() || 'walk-in';
      const existing = customerDebt.get(customerId) || {
        customer: r.customer,
        totalOwed: 0,
        transactionCount: 0,
      };
      existing.totalOwed += r.outstandingAmount;
      existing.transactionCount++;
      customerDebt.set(customerId, existing);
    });

    const topDebtors = Array.from(customerDebt.values())
      .sort((a, b) => b.totalOwed - a.totalOwed)
      .slice(0, 10);

    // Calculate average days outstanding
    const avgDaysOutstanding =
      receivables.length > 0
        ? receivables.reduce((sum, r) => sum + r.daysOutstanding, 0) /
          receivables.length
        : 0;

    // Estimate collection probability based on aging
    const collectionProbability =
      totalOutstanding > 0
        ? (agingSummary['0-30'].amount * 0.95 +
            agingSummary['31-60'].amount * 0.8 +
            agingSummary['61-90'].amount * 0.6 +
            agingSummary['90+'].amount * 0.3) /
          totalOutstanding
        : 1;

    return createApiResponse.success(
      {
        receivables: receivables.slice(0, 100), // Limit response size
        summary: {
          totalOutstanding: Math.round(totalOutstanding * 100) / 100,
          totalTransactions,
          averageDaysOutstanding: Math.round(avgDaysOutstanding),
          estimatedCollectable:
            Math.round(totalOutstanding * collectionProbability * 100) / 100,
          collectionProbability: Math.round(collectionProbability * 100),
        },
        aging: agingSummary,
        topDebtors,
        dateRange: {
          from: cutoffDate.toISOString(),
          to: now.toISOString(),
        },
      },
      'Accounts receivable data retrieved successfully'
    );
  } catch (error) {
    console.error('Error fetching accounts receivable:', error);
    return createApiResponse.internalError('Failed to fetch accounts receivable');
  }
});
```

### 7.2 Frontend Component

**File:** `src/components/finance/dashboards/AccountsReceivableDashboard.tsx`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils/finance';
import { AlertTriangle, DollarSign, Clock, Users } from 'lucide-react';

interface ReceivablesData {
  receivables: Array<{
    id: number;
    transactionNumber: string;
    customer: { name?: string; email?: string };
    saleDate: string;
    totalAmount: number;
    outstandingAmount: number;
    daysOutstanding: number;
    agingBucket: string;
    paymentStatus: string;
  }>;
  summary: {
    totalOutstanding: number;
    totalTransactions: number;
    averageDaysOutstanding: number;
    estimatedCollectable: number;
    collectionProbability: number;
  };
  aging: {
    '0-30': { count: number; amount: number };
    '31-60': { count: number; amount: number };
    '61-90': { count: number; amount: number };
    '90+': { count: number; amount: number };
  };
  topDebtors: Array<{
    customer: { name?: string };
    totalOwed: number;
    transactionCount: number;
  }>;
}

async function fetchReceivables(): Promise<ReceivablesData> {
  const response = await fetch('/api/finance/receivables');
  if (!response.ok) throw new Error('Failed to fetch');
  const data = await response.json();
  return data.data;
}

const AGING_COLORS = {
  '0-30': '#22c55e',
  '31-60': '#f59e0b',
  '61-90': '#f97316',
  '90+': '#ef4444',
};

export function AccountsReceivableDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['accounts-receivable'],
    queryFn: fetchReceivables,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <ReceivablesSkeleton />;
  if (error || !data) return <div>Failed to load receivables data</div>;

  const agingChartData = Object.entries(data.aging).map(([bucket, values]) => ({
    bucket,
    amount: values.amount,
    count: values.count,
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Accounts Receivable</h2>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(data.summary.totalOutstanding)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.summary.totalTransactions} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Days Outstanding</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.averageDaysOutstanding} days
            </div>
            <Badge
              variant={
                data.summary.averageDaysOutstanding <= 30
                  ? 'default'
                  : data.summary.averageDaysOutstanding <= 60
                    ? 'secondary'
                    : 'destructive'
              }
            >
              {data.summary.averageDaysOutstanding <= 30
                ? 'Healthy'
                : data.summary.averageDaysOutstanding <= 60
                  ? 'Monitor'
                  : 'Action needed'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Est. Collectable</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.summary.estimatedCollectable)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.summary.collectionProbability}% collection probability
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">At Risk (90+ days)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(data.aging['90+'].amount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.aging['90+'].count} transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Aging Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Aging Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agingChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" tickFormatter={v => `${v} days`} />
                <YAxis tickFormatter={v => formatCurrency(v)} />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  labelFormatter={v => `${v} days`}
                />
                <Bar dataKey="amount" name="Amount Owed">
                  {agingChartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={AGING_COLORS[entry.bucket as keyof typeof AGING_COLORS]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Debtors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Top Outstanding Balances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Amount Owed</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topDebtors.map((debtor, i) => (
                  <TableRow key={i}>
                    <TableCell>{debtor.customer?.name || 'Walk-in'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(debtor.totalOwed)}
                    </TableCell>
                    <TableCell className="text-right">
                      {debtor.transactionCount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Recent Receivables Table */}
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Sale Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.receivables.slice(0, 20).map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-sm">
                    {r.transactionNumber}
                  </TableCell>
                  <TableCell>{r.customer?.name || 'Walk-in'}</TableCell>
                  <TableCell>
                    {new Date(r.saleDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(r.totalAmount)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-amber-600">
                    {formatCurrency(r.outstandingAmount)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        r.daysOutstanding <= 30
                          ? 'default'
                          : r.daysOutstanding <= 60
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {r.daysOutstanding}d
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{r.paymentStatus}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ReceivablesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-muted animate-pulse rounded" />
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-4 w-20 bg-muted animate-pulse rounded mb-2" />
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## 8. Feature: Export Improvements (PDF Reports)

### 8.1 Install Dependencies

```bash
npm install @react-pdf/renderer
```

### 8.2 PDF Report Component

**File:** `src/lib/pdf/FinancialReportPDF.tsx`

```typescript
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '1pt solid #e5e7eb',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    backgroundColor: '#f3f4f6',
    padding: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottom: '0.5pt solid #e5e7eb',
  },
  label: {
    fontSize: 10,
    color: '#374151',
  },
  value: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  valuePositive: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  valueNegative: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  summaryBox: {
    backgroundColor: '#f9fafb',
    padding: 15,
    marginTop: 10,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '0.5pt solid #e5e7eb',
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
  },
  tableCellRight: {
    flex: 1,
    fontSize: 9,
    textAlign: 'right',
  },
});

interface FinancialReportData {
  reportType: string;
  period: { startDate: string; endDate: string };
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    grossProfit: number;
  };
  profitLoss: {
    revenue: { sales: number; otherIncome: number; totalRevenue: number };
    expenses: {
      costOfGoods: number;
      operatingExpenses: number;
      totalExpenses: number;
    };
  };
  paymentMethods: Array<{ method: string; amount: number; count: number }>;
}

interface FinancialReportPDFProps {
  data: FinancialReportData;
  companyName?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount);
};

export function FinancialReportPDF({
  data,
  companyName = 'Your Company',
}: FinancialReportPDFProps) {
  const reportDate = new Date().toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const periodStart = new Date(data.period.startDate).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const periodEnd = new Date(data.period.endDate).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{companyName}</Text>
          <Text style={styles.subtitle}>
            Financial Report: {data.reportType.replace('_', ' ')}
          </Text>
          <Text style={styles.subtitle}>
            Period: {periodStart} - {periodEnd}
          </Text>
          <Text style={styles.subtitle}>Generated: {reportDate}</Text>
        </View>

        {/* Executive Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Total Revenue</Text>
            <Text style={styles.valuePositive}>
              {formatCurrency(data.summary.totalIncome)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Expenses</Text>
            <Text style={styles.valueNegative}>
              {formatCurrency(data.summary.totalExpenses)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Gross Profit</Text>
            <Text
              style={
                data.summary.grossProfit >= 0
                  ? styles.valuePositive
                  : styles.valueNegative
              }
            >
              {formatCurrency(data.summary.grossProfit)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Net Profit</Text>
            <Text
              style={
                data.summary.netProfit >= 0
                  ? styles.valuePositive
                  : styles.valueNegative
              }
            >
              {formatCurrency(data.summary.netProfit)}
            </Text>
          </View>
        </View>

        {/* Revenue Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Breakdown</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Sales Revenue</Text>
            <Text style={styles.value}>
              {formatCurrency(data.profitLoss.revenue.sales)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Other Income</Text>
            <Text style={styles.value}>
              {formatCurrency(data.profitLoss.revenue.otherIncome)}
            </Text>
          </View>
          <View style={[styles.row, { backgroundColor: '#f9fafb' }]}>
            <Text style={[styles.label, { fontWeight: 'bold' }]}>Total Revenue</Text>
            <Text style={styles.valuePositive}>
              {formatCurrency(data.profitLoss.revenue.totalRevenue)}
            </Text>
          </View>
        </View>

        {/* Expense Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expense Breakdown</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Cost of Goods Sold</Text>
            <Text style={styles.value}>
              {formatCurrency(data.profitLoss.expenses.costOfGoods)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Operating Expenses</Text>
            <Text style={styles.value}>
              {formatCurrency(data.profitLoss.expenses.operatingExpenses)}
            </Text>
          </View>
          <View style={[styles.row, { backgroundColor: '#f9fafb' }]}>
            <Text style={[styles.label, { fontWeight: 'bold' }]}>Total Expenses</Text>
            <Text style={styles.valueNegative}>
              {formatCurrency(data.profitLoss.expenses.totalExpenses)}
            </Text>
          </View>
        </View>

        {/* Payment Methods */}
        {data.paymentMethods.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method Distribution</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCell}>Payment Method</Text>
                <Text style={styles.tableCellRight}>Transactions</Text>
                <Text style={styles.tableCellRight}>Amount</Text>
              </View>
              {data.paymentMethods.map((pm, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell}>
                    {pm.method?.replace('_', ' ') || 'Unknown'}
                  </Text>
                  <Text style={styles.tableCellRight}>{pm.count}</Text>
                  <Text style={styles.tableCellRight}>{formatCurrency(pm.amount)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          This report was automatically generated by the Finance Manager system.
          For questions, contact your system administrator.
        </Text>
      </Page>
    </Document>
  );
}
```

### 8.3 Export API Endpoint

**File:** `src/app/api/finance/reports/export/route.ts`

```typescript
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth/roles';
import { createApiResponse } from '@/lib/api-response';
import { renderToBuffer } from '@react-pdf/renderer';
import { FinancialReportPDF } from '@/lib/pdf/FinancialReportPDF';

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    if (!hasPermission(request.user.role, 'FINANCIAL_REPORTS')) {
      return createApiResponse.forbidden(
        'Insufficient permissions to export reports'
      );
    }

    const body = await request.json();
    const { reportData, format = 'pdf', companyName } = body;

    if (!reportData) {
      return createApiResponse.validationError('Report data is required');
    }

    if (format === 'pdf') {
      const pdfBuffer = await renderToBuffer(
        <FinancialReportPDF data={reportData} companyName={companyName} />
      );

      return new Response(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="financial-report-${Date.now()}.pdf"`,
        },
      });
    }

    if (format === 'csv') {
      const csvContent = generateCSV(reportData);
      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="financial-report-${Date.now()}.csv"`,
        },
      });
    }

    if (format === 'json') {
      return new Response(JSON.stringify(reportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="financial-report-${Date.now()}.json"`,
        },
      });
    }

    return createApiResponse.validationError(
      'Invalid format. Supported: pdf, csv, json'
    );
  } catch (error) {
    console.error('Error exporting report:', error);
    return createApiResponse.internalError('Failed to export report');
  }
});

function generateCSV(data: any): string {
  const lines: string[] = [];

  // Header
  lines.push('Financial Report');
  lines.push(`Period,${data.period.startDate},${data.period.endDate}`);
  lines.push('');

  // Summary
  lines.push('Summary');
  lines.push('Metric,Amount');
  lines.push(`Total Revenue,${data.summary.totalIncome}`);
  lines.push(`Total Expenses,${data.summary.totalExpenses}`);
  lines.push(`Gross Profit,${data.summary.grossProfit}`);
  lines.push(`Net Profit,${data.summary.netProfit}`);
  lines.push('');

  // Payment Methods
  if (data.paymentMethods?.length > 0) {
    lines.push('Payment Methods');
    lines.push('Method,Transactions,Amount');
    data.paymentMethods.forEach((pm: any) => {
      lines.push(`${pm.method || 'Unknown'},${pm.count},${pm.amount}`);
    });
  }

  return lines.join('\n');
}
```

### 8.4 Frontend Export Button Component

**File:** `src/components/finance/ExportReportButton.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, FileJson } from 'lucide-react';
import { toast } from 'sonner';

interface ExportReportButtonProps {
  reportData: any;
  companyName?: string;
  disabled?: boolean;
}

export function ExportReportButton({
  reportData,
  companyName,
  disabled,
}: ExportReportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'pdf' | 'csv' | 'json') => {
    setIsExporting(true);

    try {
      const response = await fetch('/api/finance/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportData, format, companyName }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial-report-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || isExporting}>
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')}>
          <FileJson className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## Implementation Checklist

Use this checklist to track progress:

### Critical Fixes
- [ ] Add permission check to analytics endpoint
- [ ] Sanitize database error messages
- [ ] Create finance-specific audit actions

### Bug Fixes
- [ ] Integrate sales/stock data into reports endpoint
- [ ] Fix stale data in update transaction response
- [ ] Fix unsafe type assertions

### Features
- [ ] Daily Trends Implementation
- [ ] Financial KPIs Dashboard
- [ ] Profit Margin Dashboard
- [ ] Cash Flow Forecast
- [ ] Accounts Receivable Integration
- [ ] PDF Report Export

### Testing
- [ ] Add unit tests for new API endpoints
- [ ] Add integration tests for financial calculations
- [ ] Add component tests for new dashboards

---

## Estimated Timeline

| Task | Complexity | Est. Time |
|------|------------|-----------|
| Critical Fixes | Low | 1-2 hours |
| Bug Fixes | Medium | 2-3 hours |
| Daily Trends | Low | 1-2 hours |
| Financial KPIs | Medium | 3-4 hours |
| Profit Margins | Medium | 3-4 hours |
| Cash Flow Forecast | High | 4-6 hours |
| Accounts Receivable | Medium | 3-4 hours |
| PDF Export | Medium | 3-4 hours |

**Total estimated time: 20-29 hours**

---

## Notes

1. All new endpoints require proper authentication and permission checks
2. Consider adding rate limiting to expensive analytics endpoints
3. For large datasets, implement pagination on list endpoints
4. Consider caching frequently accessed aggregate data
5. All financial calculations should use precise decimal arithmetic where possible
