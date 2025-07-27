'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconUsers,
  IconShoppingCart,
  IconCurrencyNaira,
  IconActivity,
} from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardKPICardsProps {
  transactionStats?: any;
  activeUsersCount: number;
  isLoading: boolean;
  _dateRange: any;
}

export function DashboardKPICards({
  transactionStats,
  activeUsersCount,
  isLoading,
  _dateRange,
}: DashboardKPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-2 h-8 w-24" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const kpiData = [
    {
      title: 'Total Revenue',
      value: formatCurrency(transactionStats?.totalSales || 0),
      change: transactionStats?.salesChange || 0,
      trend: (transactionStats?.salesChange || 0) >= 0 ? 'up' : 'down',
      icon: <IconCurrencyNaira className="h-5 w-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Transactions',
      value: transactionStats?.totalTransactions || 0,
      change: transactionStats?.transactionsChange || 0,
      trend: (transactionStats?.transactionsChange || 0) >= 0 ? 'up' : 'down',
      icon: <IconShoppingCart className="h-5 w-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Users',
      value: activeUsersCount,
      change: 8.2,
      trend: 'up',
      icon: <IconUsers className="h-5 w-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Average Order Value',
      value: formatCurrency(transactionStats?.averageOrderValue || 0),
      change: transactionStats?.averageOrderValueChange || 0,
      trend:
        (transactionStats?.averageOrderValueChange || 0) >= 0 ? 'up' : 'down',
      icon: <IconActivity className="h-5 w-5" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpiData.map((kpi, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-2">
                <div className={`rounded-lg p-2 ${kpi.bgColor} ${kpi.color}`}>
                  {kpi.icon}
                </div>
                {kpi.title}
              </span>
              {kpi.trend === 'up' ? (
                <IconTrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <IconTrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{kpi.value}</div>
              <div className="flex items-center gap-1">
                <Badge
                  variant={kpi.trend === 'up' ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {kpi.change > 0 ? '+' : ''}
                  {kpi.change.toFixed(1)}%
                </Badge>
                <span className="text-muted-foreground text-xs">
                  vs last period
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
