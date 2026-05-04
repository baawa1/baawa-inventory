import { format } from 'date-fns';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { createApiResponse } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { hasPermission } from '@/lib/auth/roles';
import { getDashboardInventoryHealth } from '@/lib/dashboard/data';
import {
  API_LIMITS,
  SUCCESSFUL_PAYMENT_STATUSES,
} from '@/lib/constants';
import { getFinanceAggregate } from '@/lib/finance/aggregation';
import { summarizeCanonicalFinanceAggregate } from '@/lib/finance/metrics';
import { formatCurrency } from '@/lib/utils';
import type {
  DashboardAnalyticsResponse,
  DashboardKpi,
  DashboardModuleCard,
  DashboardTopProduct,
  DashboardTrendPoint,
  DashboardTrendSeries,
} from '@/types/dashboard';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface SalesPeriodSummary {
  totalSales: number;
  totalTransactions: number;
  totalItems: number;
  averageOrderValue: number;
}

interface SalesTrendRow {
  day: Date;
  total_sales: unknown;
  transactions: number;
}

interface SalesItemTrendRow {
  day: Date;
  items: unknown;
}

function normalizeStartOfDay(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function normalizeEndOfDay(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(23, 59, 59, 999);
  return normalized;
}

function parseDateRange(searchParams: URLSearchParams) {
  const dateFromParam = searchParams.get('dateFrom');
  const dateToParam = searchParams.get('dateTo');
  const invalidFields: string[] = [];

  const parseDateParam = (value: string | null, field: string) => {
    if (!value) return undefined;

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      invalidFields.push(field);
      return undefined;
    }

    return parsed;
  };

  const now = new Date();
  let startDate = normalizeStartOfDay(
    parseDateParam(dateFromParam, 'dateFrom') ??
      new Date(now.getFullYear(), now.getMonth(), 1)
  );
  let endDate = normalizeEndOfDay(
    parseDateParam(dateToParam, 'dateTo') ?? now
  );

  if (!dateFromParam && dateToParam) {
    startDate = normalizeStartOfDay(endDate);
  }

  if (!dateToParam && dateFromParam) {
    endDate = normalizeEndOfDay(now);
  }

  if (startDate > endDate) {
    const swappedStart = normalizeStartOfDay(endDate);
    endDate = normalizeEndOfDay(startDate);
    startDate = swappedStart;
  }

  const days =
    Math.floor(
      (normalizeStartOfDay(endDate).getTime() -
        normalizeStartOfDay(startDate).getTime()) /
        MS_PER_DAY
    ) + 1;

  const comparisonEndDate = new Date(startDate.getTime() - 1);
  const comparisonStartDate = normalizeStartOfDay(
    new Date(startDate.getTime() - days * MS_PER_DAY)
  );

  return {
    invalidFields,
    startDate,
    endDate,
    comparisonStartDate,
    comparisonEndDate,
    days,
  };
}

function calculateChange(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return ((current - previous) / previous) * 100;
}

function formatPeriodLabel(startDate: Date, endDate: Date) {
  if (startDate.toDateString() === endDate.toDateString()) {
    return format(startDate, 'MMM d, yyyy');
  }

  return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
}

function formatComparisonLabel(days: number) {
  return `Compared with the previous ${days}-day period`;
}

async function getSalesPeriodSummary(
  startDate: Date,
  endDate: Date
): Promise<SalesPeriodSummary> {
  const where = {
    created_at: {
      gte: startDate,
      lte: endDate,
    },
    transaction_type: 'sale',
    payment_status: {
      in: SUCCESSFUL_PAYMENT_STATUSES,
    },
  };

  const [transactions, totalSales, totalItems] = await Promise.all([
    prisma.salesTransaction.count({ where }),
    prisma.salesTransaction.aggregate({
      where,
      _sum: { total_amount: true },
    }),
    prisma.salesItem.aggregate({
      where: {
        sales_transactions: where,
      },
      _sum: { quantity: true },
    }),
  ]);

  const resolvedTotalSales = Number(totalSales._sum.total_amount || 0);

  return {
    totalSales: resolvedTotalSales,
    totalTransactions: transactions,
    totalItems: Number(totalItems._sum.quantity || 0),
    averageOrderValue:
      transactions > 0 ? resolvedTotalSales / transactions : 0,
  };
}

async function getSalesTrendData(startDate: Date, endDate: Date) {
  const [salesRows, itemRows] = await Promise.all([
    prisma.$queryRaw<SalesTrendRow[]>`
      SELECT
        date_trunc('day', "created_at") AS day,
        COALESCE(SUM("total_amount"), 0) AS total_sales,
        COUNT(*)::int AS transactions
      FROM "sales_transactions"
      WHERE "created_at" >= ${startDate}
        AND "created_at" <= ${endDate}
        AND "transaction_type" = 'sale'
        AND "payment_status" IN (${Prisma.join(SUCCESSFUL_PAYMENT_STATUSES)})
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    prisma.$queryRaw<SalesItemTrendRow[]>`
      SELECT
        date_trunc('day', st."created_at") AS day,
        COALESCE(SUM(si."quantity"), 0) AS items
      FROM "sales_items" si
      INNER JOIN "sales_transactions" st ON st."id" = si."transaction_id"
      WHERE st."created_at" >= ${startDate}
        AND st."created_at" <= ${endDate}
        AND st."transaction_type" = 'sale'
        AND st."payment_status" IN (${Prisma.join(SUCCESSFUL_PAYMENT_STATUSES)})
      GROUP BY 1
      ORDER BY 1 ASC
    `,
  ]);

  const salesMap = new Map(
    salesRows.map(row => [row.day.toISOString().split('T')[0], row])
  );
  const itemMap = new Map(
    itemRows.map(row => [row.day.toISOString().split('T')[0], row])
  );
  const points: DashboardTrendPoint[] = [];
  const totalDays =
    Math.floor(
      (normalizeStartOfDay(endDate).getTime() -
        normalizeStartOfDay(startDate).getTime()) /
        MS_PER_DAY
    ) + 1;

  for (let offset = 0; offset < totalDays; offset += 1) {
    const date = new Date(startDate.getTime() + offset * MS_PER_DAY);
    const dateKey = date.toISOString().split('T')[0];
    const salesRow = salesMap.get(dateKey);
    const itemRow = itemMap.get(dateKey);

    points.push({
      date: dateKey,
      label: format(date, 'MMM d'),
      sales: Number(salesRow?.total_sales || 0),
      transactions: salesRow?.transactions || 0,
      items: Number(itemRow?.items || 0),
    });
  }

  return points;
}

async function getTopProducts(startDate: Date, endDate: Date) {
  const groupedProducts = await prisma.salesItem.groupBy({
    by: ['product_id'],
    where: {
      sales_transactions: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
        payment_status: {
          in: SUCCESSFUL_PAYMENT_STATUSES,
        },
        transaction_type: 'sale',
      },
    },
    _sum: {
      quantity: true,
      total_price: true,
    },
    _count: {
      id: true,
    },
  });

  const productIds = groupedProducts.map(item => item.product_id);
  const products =
    productIds.length > 0
      ? await prisma.product.findMany({
          where: {
            id: {
              in: productIds,
            },
          },
          select: {
            id: true,
            name: true,
            sku: true,
          },
        })
      : [];

  const productMap = new Map(products.map(product => [product.id, product]));

  return groupedProducts
    .map(item => {
      const product = productMap.get(item.product_id);

      if (!product) {
        return null;
      }

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        quantity: Number(item._sum.quantity || 0),
        revenue: Number(item._sum.total_price || 0),
        saleLines: item._count.id,
      };
    })
    .filter((product): product is NonNullable<typeof product> => product !== null)
    .sort((left, right) => {
      if (right.quantity !== left.quantity) {
        return right.quantity - left.quantity;
      }

      return right.revenue - left.revenue;
    });
}

function buildAdminKpis(args: {
  currentSales: SalesPeriodSummary;
  previousSales: SalesPeriodSummary;
  currentFinance: ReturnType<typeof summarizeCanonicalFinanceAggregate>;
  previousFinance: ReturnType<typeof summarizeCanonicalFinanceAggregate>;
}): DashboardKpi[] {
  const { currentSales, previousSales, currentFinance, previousFinance } = args;

  return [
    {
      id: 'operating-revenue',
      title: 'Operating Revenue',
      value: currentFinance.operatingRevenue,
      format: 'currency',
      description: 'Revenue across POS and manual income',
      delta: calculateChange(
        currentFinance.operatingRevenue,
        previousFinance.operatingRevenue
      ),
      deltaLabel: 'vs previous period',
      tone: 'green',
    },
    {
      id: 'net-profit',
      title: 'Net Profit',
      value: currentFinance.netProfit,
      format: 'currency',
      description: 'Net profit after stock and operating expenses',
      delta: calculateChange(currentFinance.netProfit, previousFinance.netProfit),
      deltaLabel: 'vs previous period',
      tone: currentFinance.netProfit >= 0 ? 'blue' : 'rose',
    },
    {
      id: 'transactions',
      title: 'Completed Sales',
      value: currentSales.totalTransactions,
      format: 'number',
      description: 'Successful POS transactions in the selected range',
      delta: calculateChange(
        currentSales.totalTransactions,
        previousSales.totalTransactions
      ),
      deltaLabel: 'vs previous period',
      tone: 'blue',
    },
    {
      id: 'average-order-value',
      title: 'Average Order Value',
      value: currentSales.averageOrderValue,
      format: 'currency',
      description: 'Average value per completed POS transaction',
      delta: calculateChange(
        currentSales.averageOrderValue,
        previousSales.averageOrderValue
      ),
      deltaLabel: 'vs previous period',
      tone: 'purple',
    },
  ];
}

function buildOperationalKpis(args: {
  currentSales: SalesPeriodSummary;
  previousSales: SalesPeriodSummary;
  days: number;
}): DashboardKpi[] {
  const { currentSales, previousSales, days } = args;
  const currentAvgItems =
    currentSales.totalTransactions > 0
      ? currentSales.totalItems / currentSales.totalTransactions
      : 0;
  const previousAvgItems =
    previousSales.totalTransactions > 0
      ? previousSales.totalItems / previousSales.totalTransactions
      : 0;
  const currentTransactionsPerDay =
    days > 0 ? currentSales.totalTransactions / days : 0;
  const previousTransactionsPerDay =
    days > 0 ? previousSales.totalTransactions / days : 0;

  return [
    {
      id: 'transactions',
      title: 'Completed Sales',
      value: currentSales.totalTransactions,
      format: 'number',
      description: 'Successful POS transactions in the selected range',
      delta: calculateChange(
        currentSales.totalTransactions,
        previousSales.totalTransactions
      ),
      deltaLabel: 'vs previous period',
      tone: 'blue',
    },
    {
      id: 'items-sold',
      title: 'Items Sold',
      value: currentSales.totalItems,
      format: 'number',
      description: 'Units sold across completed transactions',
      delta: calculateChange(currentSales.totalItems, previousSales.totalItems),
      deltaLabel: 'vs previous period',
      tone: 'green',
    },
    {
      id: 'avg-items-per-order',
      title: 'Avg Items / Sale',
      value: currentAvgItems,
      format: 'decimal',
      description: 'Average units per completed transaction',
      delta: calculateChange(currentAvgItems, previousAvgItems),
      deltaLabel: 'vs previous period',
      tone: 'amber',
    },
    {
      id: 'sales-per-day',
      title: 'Sales / Day',
      value: currentTransactionsPerDay,
      format: 'decimal',
      description: 'Average completed transactions per day',
      delta: calculateChange(currentTransactionsPerDay, previousTransactionsPerDay),
      deltaLabel: 'vs previous period',
      tone: 'purple',
    },
  ];
}

function buildModules(args: {
  role: AuthenticatedRequest['user']['role'];
  permissions: DashboardAnalyticsResponse['permissions'];
  sales: SalesPeriodSummary;
  inventorySnapshot: Awaited<ReturnType<typeof getDashboardInventoryHealth>>;
  financeMetrics: ReturnType<typeof summarizeCanonicalFinanceAggregate> | null;
}): DashboardModuleCard[] {
  const { role, permissions, sales, inventorySnapshot, financeMetrics } = args;
  const modules: DashboardModuleCard[] = [
    {
      id: 'pos',
      title: 'POS',
      description: 'Run checkout and review sales activity.',
      href: '/pos',
      tone: 'blue',
      badge: `${sales.totalTransactions} completed sales`,
      caption: `${sales.totalItems} items sold in the selected period`,
    },
    {
      id: 'inventory',
      title: 'Inventory',
      description: 'Monitor stock levels and keep products moving.',
      href: '/inventory',
      tone: 'green',
      badge: `${inventorySnapshot.lowStockItems} low-stock items`,
      caption: `${inventorySnapshot.totalProducts} active products`,
    },
  ];

  if (role === 'ADMIN') {
    modules.push({
      id: 'finance',
      title: 'Finance',
      description: financeMetrics
        ? 'Review profitability, cash flow, and financial reports.'
        : 'Open finance dashboards, reports, and transaction oversight.',
      href: '/finance',
      tone: financeMetrics ? 'purple' : 'slate',
      badge: financeMetrics
        ? `${formatCurrency(financeMetrics.netProfit)} net profit`
        : 'Finance analytics temporarily unavailable',
      caption: financeMetrics
        ? `${formatCurrency(financeMetrics.operatingRevenue)} operating revenue`
        : 'Use the finance module for detailed review',
    });
  } else if (permissions.canReadFinanceTransactions) {
    modules.push({
      id: 'finance',
      title: 'Finance',
      description: 'Review income, expenses, and transaction approvals.',
      href: '/finance/transactions',
      tone: 'amber',
      badge: 'Review finance transactions',
      caption: 'Manage income and expense records',
    });
  }

  if (permissions.canManageUsers) {
    modules.push({
      id: 'admin',
      title: 'Admin',
      description: 'Manage users, approvals, and system settings.',
      href: '/admin',
      tone: 'slate',
      badge: 'User and system controls',
      caption: 'Approvals, audit logs, and settings',
    });
  }

  return modules;
}

// GET /api/dashboard/analytics - Canonical filtered dashboard analytics
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const {
      invalidFields,
      startDate,
      endDate,
      comparisonStartDate,
      comparisonEndDate,
      days,
    } = parseDateRange(searchParams);

    if (invalidFields.length > 0) {
      return createApiResponse.validationError(
        `Invalid ${invalidFields.join(', ')}`
      );
    }

    const permissions: DashboardAnalyticsResponse['permissions'] = {
      role: request.user.role,
      canViewRevenue: hasPermission(request.user.role, 'REVENUE_READ'),
      canViewFinanceAnalytics: hasPermission(
        request.user.role,
        'FINANCIAL_ANALYTICS'
      ),
      canReadFinanceTransactions: hasPermission(
        request.user.role,
        'FINANCE_TRANSACTIONS_READ'
      ),
      canManageProducts: hasPermission(request.user.role, 'INVENTORY_WRITE'),
      canManageUsers: hasPermission(request.user.role, 'USER_MANAGEMENT'),
      canAccessReports: hasPermission(request.user.role, 'REPORTS_READ'),
    };

    const currentSales = await getSalesPeriodSummary(startDate, endDate);
    const previousSales = await getSalesPeriodSummary(
      comparisonStartDate,
      comparisonEndDate
    );
    const currentTrend = await getSalesTrendData(startDate, endDate);
    const topProducts = await getTopProducts(startDate, endDate);
    const inventorySnapshot = await getDashboardInventoryHealth();

    let currentFinanceMetrics:
      | ReturnType<typeof summarizeCanonicalFinanceAggregate>
      | null = null;
    let previousFinanceMetrics:
      | ReturnType<typeof summarizeCanonicalFinanceAggregate>
      | null = null;

    if (permissions.canViewFinanceAnalytics) {
      try {
        const currentFinanceAggregate = await getFinanceAggregate(
          {
            startDate,
            endDate,
          },
          {
            groupBy: 'day',
          }
        );
        const previousFinanceAggregate = await getFinanceAggregate({
          startDate: comparisonStartDate,
          endDate: comparisonEndDate,
        });

        currentFinanceMetrics = summarizeCanonicalFinanceAggregate(
          currentFinanceAggregate
        );
        previousFinanceMetrics = summarizeCanonicalFinanceAggregate(
          previousFinanceAggregate
        );
      } catch (error) {
        logger.warn('Dashboard finance analytics unavailable', {
          error: error instanceof Error ? error.message : String(error),
          userId: request.user.id,
        });
      }
    }

    const isAdminAnalytics =
      permissions.canViewRevenue &&
      permissions.canViewFinanceAnalytics &&
      currentFinanceMetrics !== null &&
      previousFinanceMetrics !== null;

    const kpis: DashboardKpi[] =
      isAdminAnalytics && currentFinanceMetrics && previousFinanceMetrics
        ? buildAdminKpis({
            currentSales,
            previousSales,
            currentFinance: currentFinanceMetrics,
            previousFinance: previousFinanceMetrics,
          })
        : buildOperationalKpis({
            currentSales,
            previousSales,
            days,
          });

    const primaryTrendSeries: DashboardTrendSeries[] = isAdminAnalytics
        ? [
          {
            key: 'sales',
            label: 'Revenue',
            color: 'var(--chart-1)',
            format: 'currency',
          },
          {
            key: 'transactions',
            label: 'Transactions',
            color: 'var(--chart-4)',
            format: 'number',
          },
        ]
      : [
          {
            key: 'transactions',
            label: 'Transactions',
            color: 'var(--chart-1)',
            format: 'number',
          },
          {
            key: 'items',
            label: 'Items Sold',
            color: 'var(--chart-2)',
            format: 'number',
          },
        ];

    const rankedTopProducts = [...topProducts].sort((left, right) => {
      if (isAdminAnalytics) {
        if (right.revenue !== left.revenue) {
          return right.revenue - left.revenue;
        }

        return right.quantity - left.quantity;
      }

      if (right.quantity !== left.quantity) {
        return right.quantity - left.quantity;
      }

      return right.saleLines - left.saleLines;
    });

    const topProductData: DashboardTopProduct[] = rankedTopProducts
      .slice(0, API_LIMITS.TOP_PRODUCTS_LIMIT)
      .map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        value: isAdminAnalytics ? product.revenue : product.quantity,
        valueFormat: isAdminAnalytics ? 'currency' : 'number',
        secondaryLabel: isAdminAnalytics ? 'Units sold' : 'Sale lines',
        secondaryValue: isAdminAnalytics ? product.quantity : product.saleLines,
      }));

    const hasData =
      currentSales.totalTransactions > 0 ||
      currentSales.totalItems > 0 ||
      (currentFinanceMetrics?.operatingRevenue ?? 0) > 0;

    const response: DashboardAnalyticsResponse = {
      period: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
        comparisonFrom: comparisonStartDate.toISOString(),
        comparisonTo: comparisonEndDate.toISOString(),
        label: formatPeriodLabel(startDate, endDate),
        comparisonLabel: formatComparisonLabel(days),
        days,
      },
      permissions,
      hasData,
      kpis,
      charts: {
        primaryTrend: {
          title: isAdminAnalytics ? 'Revenue Trend' : 'Sales Activity Trend',
          description: isAdminAnalytics
            ? 'Revenue and completed sales across the selected period'
            : 'Completed sales and items sold across the selected period',
          series: primaryTrendSeries,
          data: currentTrend,
        },
        topProducts: {
          title: 'Top Products',
          description: isAdminAnalytics
            ? 'Best performers by revenue for the selected period'
            : 'Best performers by units sold for the selected period',
          metricLabel: isAdminAnalytics ? 'Revenue' : 'Units sold',
          data: topProductData,
        },
      },
      modules: buildModules({
        role: request.user.role,
        permissions,
        sales: currentSales,
        inventorySnapshot,
        financeMetrics: currentFinanceMetrics,
      }),
    };

    if (!hasData) {
      response.charts.primaryTrend.data = [];
    }

    return createApiResponse.success(
      response,
      'Dashboard analytics retrieved successfully'
    );
  } catch (error) {
    logger.error('Error fetching dashboard analytics', {
      error: error instanceof Error ? error.message : String(error),
      userId: request.user.id,
    });
    return createApiResponse.internalError(
      'Failed to fetch dashboard analytics'
    );
  }
});
