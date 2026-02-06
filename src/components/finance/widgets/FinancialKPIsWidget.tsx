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
