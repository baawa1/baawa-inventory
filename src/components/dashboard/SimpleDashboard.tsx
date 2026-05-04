'use client';

import * as React from 'react';
import Link from 'next/link';
import { DateRange } from 'react-day-picker';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Boxes,
  FileText,
  History,
  Package,
  RefreshCcw,
  Settings,
  ShieldCheck,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  CardGridSkeleton,
  ChartCardSkeleton,
  ListSkeleton,
  PageHeaderSkeleton,
} from '@/components/ui/skeletons';
import { DateRangePickerWithPresets } from '@/components/ui/date-range-picker-with-presets';
import { useDashboardAnalytics, useDashboardOperations } from '@/hooks/api/useDashboard';
import { usePermissions } from '@/hooks/usePermissions';
import { hasPermission } from '@/lib/auth/roles';
import {
  DEFAULT_DATE_RANGE_PRESET,
  getDateRangePreset,
} from '@/lib/utils/date-range';
import { cn, formatCurrency, formatRelativeTime } from '@/lib/utils';
import type {
  DashboardKpi,
  DashboardModuleCard,
  DashboardQuickAction,
  DashboardTopProduct,
  DashboardTrendPoint,
  DashboardValueFormat,
} from '@/types/dashboard';
import type { SessionUser, UserRole } from '@/types/user';

interface SimpleDashboardProps {
  user: SessionUser;
}

interface PermissionSnapshot {
  canManageProducts: boolean;
  canReadTransactions: boolean;
  canAccessFinancialReports: boolean;
  canManageUsers: boolean;
  canAccessPOS: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isStaff: boolean;
}

const toneClassMap = {
  blue: {
    icon: 'bg-primary/10 text-primary',
  },
  green: {
    icon: 'bg-secondary text-secondary-foreground',
  },
  amber: {
    icon: 'bg-muted text-foreground',
  },
  purple: {
    icon: 'bg-accent/10 text-accent',
  },
  rose: {
    icon: 'bg-destructive/10 text-destructive',
  },
  slate: {
    icon: 'bg-muted text-muted-foreground',
  },
} as const;

const moduleIconMap = {
  pos: ShoppingCart,
  inventory: Package,
  finance: Wallet,
  admin: ShieldCheck,
} as const;

const quickActionIconMap = {
  'open-pos': ShoppingCart,
  'add-product': Boxes,
  'finance-overview': Wallet,
  'finance-transactions': Wallet,
  'finance-reports': FileText,
  'inventory-overview': Package,
  'transaction-history': History,
  'admin-settings': Settings,
} as const;

function getFallbackPermissions(role: UserRole): PermissionSnapshot {
  return {
    canManageProducts: hasPermission(role, 'INVENTORY_WRITE'),
    canReadTransactions: hasPermission(role, 'FINANCE_TRANSACTIONS_READ'),
    canAccessFinancialReports: hasPermission(role, 'FINANCIAL_REPORTS'),
    canManageUsers: hasPermission(role, 'USER_MANAGEMENT'),
    canAccessPOS: hasPermission(role, 'POS_ACCESS'),
    isAdmin: role === 'ADMIN',
    isManager: role === 'MANAGER',
    isStaff: role === 'STAFF',
  };
}

function formatDashboardValue(value: number, format: DashboardValueFormat) {
  if (format === 'currency') {
    return formatCurrency(value);
  }

  if (format === 'decimal') {
    return value.toFixed(1);
  }

  return Math.round(value).toLocaleString();
}

type ChartTooltipPayload = Array<{
  payload?: {
    label?: string;
    name?: string;
  };
}>;

function formatDelta(delta: number | null) {
  if (delta === null) {
    return null;
  }

  if (delta === 0) {
    return '0.0%';
  }

  const prefix = delta > 0 ? '+' : '';
  return `${prefix}${delta.toFixed(1)}%`;
}

function isPermissionHookResolved(permissions: ReturnType<typeof usePermissions>) {
  return permissions.isAdmin || permissions.isManager || permissions.isStaff;
}

function canShowModule(
  module: DashboardModuleCard,
  permissions: PermissionSnapshot
) {
  if (module.id === 'finance') {
    return (
      permissions.canAccessFinancialReports || permissions.canReadTransactions
    );
  }

  if (module.id === 'admin') {
    return permissions.canManageUsers;
  }

  return true;
}

function canShowQuickAction(
  action: DashboardQuickAction,
  permissions: PermissionSnapshot
) {
  switch (action.id) {
    case 'add-product':
      return permissions.canManageProducts;
    case 'finance-overview':
    case 'finance-reports':
      return permissions.canAccessFinancialReports;
    case 'finance-transactions':
      return permissions.canReadTransactions;
    case 'admin-settings':
      return permissions.canManageUsers;
    default:
      return true;
  }
}

function DashboardErrorCard({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry: () => void;
}) {
  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="text-destructive h-4 w-4" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCcw className="h-4 w-4" />
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}

function DashboardKpiStrip({ items }: { items: DashboardKpi[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map(item => {
        const tone = toneClassMap[item.tone];
        const delta = formatDelta(item.delta);
        const isPositive = (item.delta ?? 0) >= 0;

        return (
          <Card key={item.id} className="shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardDescription>{item.title}</CardDescription>
                  <CardTitle className="mt-2 text-2xl font-semibold">
                    {formatDashboardValue(item.value, item.format)}
                  </CardTitle>
                </div>
                <div className={cn('rounded-lg p-2', tone.icon)}>
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {delta && (
                <Badge variant="secondary" className="gap-1">
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {delta}
                </Badge>
              )}
              <p className="text-muted-foreground text-sm">{item.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function DashboardTrendCard({
  title,
  description,
  data,
  series,
}: {
  title: string;
  description: string;
  data: DashboardTrendPoint[];
  series: Array<{ key: string; label: string; color: string; format: DashboardValueFormat }>;
}) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[320px] items-center justify-center">
          <p className="text-muted-foreground text-sm">
            No trend data is available for the selected range.
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = Object.fromEntries(
    series.map(item => [
      item.key,
      {
        label: item.label,
        color: item.color,
      },
    ])
  ) as ChartConfig;
  const seriesByKey = new Map(series.map(item => [item.key, item]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[320px] w-full">
          <LineChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
            />
            <YAxis tickLine={false} axisLine={false} width={44} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(
                    _value: unknown,
                    payload: ChartTooltipPayload
                  ) =>
                    payload?.[0]?.payload?.label || ''
                  }
                  formatter={(
                    value: unknown,
                    _name: string,
                    item: { dataKey?: string; name?: string }
                  ) => {
                    const seriesEntry = seriesByKey.get(String(item.dataKey));

                    return (
                      <div className="flex min-w-[9rem] items-center justify-between gap-3">
                        <span className="text-muted-foreground">
                          {seriesEntry?.label || item.name}
                        </span>
                        <span className="font-mono font-medium tabular-nums">
                          {formatDashboardValue(
                            Number(value),
                            seriesEntry?.format || 'number'
                          )}
                        </span>
                      </div>
                    );
                  }}
                  indicator="dot"
                />
              }
            />
            {series.map(item => (
              <Line
                key={item.key}
                type="monotone"
                dataKey={item.key}
                stroke={`var(--color-${item.key})`}
                strokeWidth={2}
                dot={{ fill: `var(--color-${item.key})`, r: 3 }}
                activeDot={{ r: 5 }}
                name={item.label}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function DashboardTopProductsCard({
  title,
  description,
  metricLabel,
  data,
}: {
  title: string;
  description: string;
  metricLabel: string;
  data: DashboardTopProduct[];
}) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[320px] items-center justify-center">
          <p className="text-muted-foreground text-sm">
            No product movement is available for the selected range.
          </p>
        </CardContent>
      </Card>
    );
  }

  const primaryFormat = data[0]?.valueFormat || 'number';
  const chartConfig = {
    value: {
      label: metricLabel,
      color: 'var(--chart-2)',
    },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="name" hide />
            <YAxis tickLine={false} axisLine={false} width={44} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(
                    _value: unknown,
                    payload: ChartTooltipPayload
                  ) =>
                    payload?.[0]?.payload?.name || ''
                  }
                  formatter={(value: unknown) => (
                    <div className="flex min-w-[9rem] items-center justify-between gap-3">
                      <span className="text-muted-foreground">{metricLabel}</span>
                      <span className="font-mono font-medium tabular-nums">
                        {formatDashboardValue(Number(value), primaryFormat)}
                      </span>
                    </div>
                  )}
                  indicator="dot"
                />
              }
            />
            <Bar dataKey="value" fill="var(--color-value)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>

        <div className="space-y-3">
          {data.map(product => (
            <div
              key={product.id}
              className="flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{product.name}</p>
                <p className="text-muted-foreground text-xs">
                  {product.secondaryLabel}: {product.secondaryValue.toLocaleString()}
                </p>
              </div>
              <div className="text-right text-sm font-semibold">
                {formatDashboardValue(product.value, product.valueFormat)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardModuleGrid({ items }: { items: DashboardModuleCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {items.map(item => {
        const Icon = moduleIconMap[item.id];
        const tone = toneClassMap[item.tone];

        return (
          <Link key={item.id} href={item.href} className="block">
            <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <span className={cn('rounded-lg p-2', tone.icon)}>
                        <Icon className="h-4 w-4" />
                      </span>
                      {item.title}
                    </CardTitle>
                    <CardDescription className="mt-3">
                      {item.description}
                    </CardDescription>
                  </div>
                  <ArrowRight className="text-muted-foreground h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge variant="secondary">{item.badge}</Badge>
                <p className="text-muted-foreground text-sm">{item.caption}</p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

function InventoryHealthCard({
  totalProducts,
  inStockItems,
  lowStockItems,
  outOfStockItems,
}: {
  totalProducts: number;
  inStockItems: number;
  lowStockItems: number;
  outOfStockItems: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="text-primary h-5 w-5" />
          Inventory Health
        </CardTitle>
        <CardDescription>Always-current stock snapshot</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              Active Products
            </p>
            <p className="mt-1 text-xl font-semibold">
              {totalProducts.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              In Stock
            </p>
            <p className="text-primary mt-1 text-xl font-semibold">
              {inStockItems.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              Low Stock
            </p>
            <p className="text-accent mt-1 text-xl font-semibold">
              {lowStockItems.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              Out of Stock
            </p>
            <p className="text-destructive mt-1 text-xl font-semibold">
              {outOfStockItems.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentTransactionsCard({
  items,
}: {
  items: Array<{
    id: number;
    customerName: string;
    totalAmount: number;
    totalItems: number;
    firstItem: string;
    createdAt: string;
  }>;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="text-primary h-5 w-5" />
              Recent Transactions
            </CardTitle>
            <CardDescription>
              Live checkout activity, newest first
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/pos/history">View all</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex h-[220px] items-center justify-center">
            <p className="text-muted-foreground text-sm">
              No recent transactions to show.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {item.customerName}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {item.firstItem} • {item.totalItems} items
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {formatCurrency(item.totalAmount)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatRelativeTime(item.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActionsCard({ items }: { items: DashboardQuickAction[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Shortcuts tailored to your role</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {items.map(item => {
            const Icon = quickActionIconMap[item.id];

            return (
              <Button
                key={item.id}
                asChild
                variant="outline"
                className="h-auto justify-start px-4 py-3"
              >
                <Link href={item.href}>
                  <Icon className="h-4 w-4" />
                  <span className="flex flex-col items-start">
                    <span>{item.label}</span>
                    <span className="text-muted-foreground text-xs font-normal">
                      {item.description}
                    </span>
                  </span>
                </Link>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsSectionSkeleton() {
  return (
    <div className="space-y-6">
      <CardGridSkeleton count={4} columns={{ base: 1, md: 2, lg: 4 }} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCardSkeleton height="h-[320px]" />
        <ChartCardSkeleton height="h-[320px]" />
      </div>
      <CardGridSkeleton count={2} columns={{ base: 1, md: 2, lg: 2 }} />
    </div>
  );
}

function OperationsSectionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.4fr]">
        <ChartCardSkeleton height="h-[220px]" showDescription={false} />
        <Card>
          <CardHeader>
            <PageHeaderSkeleton
              titleWidth="w-44"
              descriptionWidth="w-56"
              actionsCount={1}
              actionWidths={['w-20']}
            />
          </CardHeader>
          <CardContent>
            <ListSkeleton rows={4} withAvatar />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <PageHeaderSkeleton titleWidth="w-32" descriptionWidth="w-44" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-lg border p-3">
                <div className="bg-muted h-4 w-24 animate-pulse rounded" />
                <div className="bg-muted h-3 w-32 animate-pulse rounded mt-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SimpleDashboard({ user }: SimpleDashboardProps) {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(() =>
    getDateRangePreset(DEFAULT_DATE_RANGE_PRESET)
  );
  const analyticsQuery = useDashboardAnalytics(dateRange);
  const operationsQuery = useDashboardOperations();
  const permissionHook = usePermissions();

  const fallbackPermissions = React.useMemo(
    () => getFallbackPermissions(user.role),
    [user.role]
  );
  const effectivePermissions = isPermissionHookResolved(permissionHook)
    ? {
        canManageProducts: permissionHook.canManageProducts,
        canReadTransactions: permissionHook.canReadTransactions,
        canAccessFinancialReports: permissionHook.canAccessFinancialReports,
        canManageUsers: permissionHook.canManageUsers,
        canAccessPOS: permissionHook.canAccessPOS,
        isAdmin: permissionHook.isAdmin,
        isManager: permissionHook.isManager,
        isStaff: permissionHook.isStaff,
      }
    : fallbackPermissions;

  const analyticsData = analyticsQuery.data;
  const operationsData = operationsQuery.data;

  const visibleModules = React.useMemo(
    () =>
      (analyticsData?.modules || []).filter(module =>
        canShowModule(module, effectivePermissions)
      ),
    [analyticsData?.modules, effectivePermissions]
  );

  const visibleQuickActions = React.useMemo(
    () =>
      (operationsData?.quickActions || []).filter(action =>
        canShowQuickAction(action, effectivePermissions)
      ),
    [effectivePermissions, operationsData?.quickActions]
  );

  const greetingName = user.firstName || user.name || 'there';

  return (
    <div className="space-y-8 px-4 py-6 lg:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
            Welcome back, {greetingName}. Track performance with one shared
            dashboard while keeping live operations separate from filtered
            analytics.
          </p>
          {analyticsData?.period && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{analyticsData.period.label}</Badge>
              <span className="text-muted-foreground text-xs">
                {analyticsData.period.comparisonLabel}
              </span>
            </div>
          )}
        </div>

        <DateRangePickerWithPresets
          date={dateRange}
          onDateChange={setDateRange}
          placeholder="Select date range"
          className="w-full lg:w-[320px]"
        />
      </div>

      {analyticsQuery.isLoading ? (
        <AnalyticsSectionSkeleton />
      ) : analyticsQuery.isError ? (
        <DashboardErrorCard
          title="Analytics unavailable"
          description="The filtered dashboard metrics could not be loaded. Operations are still available below."
          onRetry={() => {
            void analyticsQuery.refetch();
          }}
        />
      ) : analyticsData ? (
        <div className="space-y-6">
          <DashboardKpiStrip items={analyticsData.kpis} />

          {analyticsData.hasData ? (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <DashboardTrendCard
                title={analyticsData.charts.primaryTrend.title}
                description={analyticsData.charts.primaryTrend.description}
                data={analyticsData.charts.primaryTrend.data}
                series={analyticsData.charts.primaryTrend.series}
              />
              <DashboardTopProductsCard
                title={analyticsData.charts.topProducts.title}
                description={analyticsData.charts.topProducts.description}
                metricLabel={analyticsData.charts.topProducts.metricLabel}
                data={analyticsData.charts.topProducts.data}
              />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="text-muted-foreground h-5 w-5" />
                  No filtered activity yet
                </CardTitle>
                <CardDescription>
                  There were no completed sales in the selected date range.
                  Change the range to compare a different window.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          <DashboardModuleGrid items={visibleModules} />
        </div>
      ) : null}

      {operationsQuery.isLoading ? (
        <OperationsSectionSkeleton />
      ) : operationsQuery.isError ? (
        <DashboardErrorCard
          title="Live operations unavailable"
          description="Inventory health, recent transactions, and quick actions could not be loaded."
          onRetry={() => {
            void operationsQuery.refetch();
          }}
        />
      ) : operationsData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.4fr]">
            <InventoryHealthCard {...operationsData.inventoryHealth} />
            <RecentTransactionsCard items={operationsData.recentTransactions} />
          </div>

          <QuickActionsCard items={visibleQuickActions} />
        </div>
      ) : null}
    </div>
  );
}
