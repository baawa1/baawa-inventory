import { prisma } from '@/lib/db';
import { hasPermission } from '@/lib/auth/roles';
import {
  PRODUCT_STATUS,
  SUCCESSFUL_PAYMENT_STATUSES,
} from '@/lib/constants';
import type { UserRole } from '@/types/user';
import type {
  DashboardInventoryHealth,
  DashboardQuickAction,
  DashboardRecentTransaction,
} from '@/types/dashboard';

const DEFAULT_RECENT_TRANSACTION_LIMIT = 5;
const MAX_RECENT_TRANSACTION_LIMIT = 8;

export function clampDashboardRecentTransactionLimit(limit?: number) {
  if (!Number.isFinite(limit) || !limit || limit <= 0) {
    return DEFAULT_RECENT_TRANSACTION_LIMIT;
  }

  return Math.min(Math.floor(limit), MAX_RECENT_TRANSACTION_LIMIT);
}

export async function getDashboardInventoryHealth(): Promise<DashboardInventoryHealth> {
  const [inventoryStats] = await prisma.$queryRaw<
    Array<{
      total_products: bigint;
      low_stock_items: bigint;
      out_of_stock_items: bigint;
      in_stock_items: bigint;
    }>
  >`
    SELECT
      COUNT(*) FILTER (
        WHERE "is_archived" = false
          AND "status" = CAST(${PRODUCT_STATUS.ACTIVE} AS "ProductStatus")
      ) AS total_products,
      COUNT(*) FILTER (
        WHERE "is_archived" = false
          AND "status" = CAST(${PRODUCT_STATUS.ACTIVE} AS "ProductStatus")
          AND "stock" > 0
          AND "stock" <= "min_stock"
      ) AS low_stock_items,
      COUNT(*) FILTER (
        WHERE "is_archived" = false
          AND "status" = CAST(${PRODUCT_STATUS.ACTIVE} AS "ProductStatus")
          AND "stock" = 0
      ) AS out_of_stock_items,
      COUNT(*) FILTER (
        WHERE "is_archived" = false
          AND "status" = CAST(${PRODUCT_STATUS.ACTIVE} AS "ProductStatus")
          AND "stock" > "min_stock"
      ) AS in_stock_items
    FROM "products"
  `;

  return {
    totalProducts: Number(inventoryStats?.total_products || 0),
    lowStockItems: Number(inventoryStats?.low_stock_items || 0),
    outOfStockItems: Number(inventoryStats?.out_of_stock_items || 0),
    inStockItems: Number(inventoryStats?.in_stock_items || 0),
  };
}

export async function getDashboardRecentTransactions(
  requestedLimit?: number
): Promise<DashboardRecentTransaction[]> {
  const limit = clampDashboardRecentTransactionLimit(requestedLimit);

  const recentTransactions = await prisma.salesTransaction.findMany({
    where: {
      transaction_type: 'sale',
      payment_status: { in: SUCCESSFUL_PAYMENT_STATUSES },
    },
    orderBy: {
      created_at: 'desc',
    },
    take: limit,
    include: {
      customer: {
        select: {
          name: true,
        },
      },
      sales_items: {
        select: {
          products: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          created_at: 'asc',
        },
        take: 1,
      },
    },
  });

  const transactionIds = recentTransactions.map(transaction => transaction.id);
  const itemCounts =
    transactionIds.length > 0
      ? await prisma.salesItem.groupBy({
          by: ['transaction_id'],
          where: {
            transaction_id: {
              in: transactionIds,
            },
          },
          _sum: {
            quantity: true,
          },
        })
      : [];

  const itemCountMap = new Map(
    itemCounts.map(item => [item.transaction_id, Number(item._sum.quantity || 0)])
  );

  return recentTransactions.map(transaction => ({
    id: transaction.id,
    transactionNumber: transaction.transaction_number,
    customerName: transaction.customer?.name || 'Walk-in Customer',
    totalAmount: Number(transaction.total_amount),
    totalItems: itemCountMap.get(transaction.id) || 0,
    firstItem: transaction.sales_items[0]?.products?.name || 'Product',
    createdAt:
      transaction.created_at?.toISOString() || new Date().toISOString(),
  }));
}

export function getDashboardQuickActions(
  userRole: UserRole
): DashboardQuickAction[] {
  const actions: DashboardQuickAction[] = [
    {
      id: 'open-pos',
      label: 'Open POS',
      href: '/pos',
      description: 'Start checkout and process sales',
    },
    {
      id: 'inventory-overview',
      label: 'Inventory',
      href: '/inventory',
      description: 'Review stock levels and product health',
    },
  ];

  if (hasPermission(userRole, 'INVENTORY_WRITE')) {
    actions.push({
      id: 'add-product',
      label: 'Add Product',
      href: '/inventory/products/add',
      description: 'Create a new product listing',
    });
  }

  if (hasPermission(userRole, 'FINANCIAL_REPORTS')) {
    actions.push(
      {
        id: 'finance-overview',
        label: 'Finance Overview',
        href: '/finance',
        description: 'Review profitability and cash flow',
      },
      {
        id: 'finance-reports',
        label: 'Finance Reports',
        href: '/finance/reports',
        description: 'Open financial reports and exports',
      }
    );
  } else if (hasPermission(userRole, 'FINANCE_TRANSACTIONS_READ')) {
    actions.push({
      id: 'finance-transactions',
      label: 'Finance Transactions',
      href: '/finance/transactions',
      description: 'Review income and expense records',
    });
  } else {
    actions.push({
      id: 'transaction-history',
      label: 'Transaction History',
      href: '/pos/history',
      description: 'Review recent checkout activity',
    });
  }

  if (hasPermission(userRole, 'USER_MANAGEMENT')) {
    actions.push({
      id: 'admin-settings',
      label: 'Admin',
      href: '/admin',
      description: 'Manage users, approvals, and settings',
    });
  }

  return actions;
}
