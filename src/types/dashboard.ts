import type { UserRole } from '@/types/user';

export type DashboardTone =
  | 'blue'
  | 'green'
  | 'amber'
  | 'purple'
  | 'rose'
  | 'slate';

export type DashboardValueFormat = 'currency' | 'number' | 'decimal';

export interface DashboardPeriod {
  from: string;
  to: string;
  comparisonFrom: string;
  comparisonTo: string;
  label: string;
  comparisonLabel: string;
  days: number;
}

export interface DashboardPermissions {
  role: UserRole;
  canViewRevenue: boolean;
  canViewFinanceAnalytics: boolean;
  canReadFinanceTransactions: boolean;
  canManageProducts: boolean;
  canManageUsers: boolean;
  canAccessReports: boolean;
}

export interface DashboardKpi {
  id: string;
  title: string;
  value: number;
  format: DashboardValueFormat;
  description: string;
  delta: number | null;
  deltaLabel: string;
  tone: DashboardTone;
}

export interface DashboardTrendSeries {
  key: 'sales' | 'transactions' | 'items';
  label: string;
  color: string;
  format: DashboardValueFormat;
}

export interface DashboardTrendPoint {
  date: string;
  label: string;
  sales?: number;
  transactions?: number;
  items?: number;
}

export interface DashboardPrimaryTrend {
  title: string;
  description: string;
  series: DashboardTrendSeries[];
  data: DashboardTrendPoint[];
}

export interface DashboardTopProduct {
  id: number;
  name: string;
  sku: string;
  value: number;
  valueFormat: DashboardValueFormat;
  secondaryLabel: string;
  secondaryValue: number;
}

export interface DashboardTopProductsChart {
  title: string;
  description: string;
  metricLabel: string;
  data: DashboardTopProduct[];
}

export interface DashboardModuleCard {
  id: 'pos' | 'inventory' | 'finance' | 'admin';
  title: string;
  description: string;
  href: string;
  tone: DashboardTone;
  badge: string;
  caption: string;
}

export interface DashboardAnalyticsResponse {
  period: DashboardPeriod;
  permissions: DashboardPermissions;
  hasData: boolean;
  kpis: DashboardKpi[];
  charts: {
    primaryTrend: DashboardPrimaryTrend;
    topProducts: DashboardTopProductsChart;
  };
  modules: DashboardModuleCard[];
}

export interface DashboardInventoryHealth {
  totalProducts: number;
  inStockItems: number;
  lowStockItems: number;
  outOfStockItems: number;
}

export interface DashboardRecentTransaction {
  id: number;
  transactionNumber: string;
  customerName: string;
  totalAmount: number;
  totalItems: number;
  firstItem: string;
  createdAt: string;
}

export interface DashboardQuickAction {
  id:
    | 'open-pos'
    | 'add-product'
    | 'finance-overview'
    | 'finance-transactions'
    | 'finance-reports'
    | 'inventory-overview'
    | 'transaction-history'
    | 'admin-settings';
  label: string;
  href: string;
  description: string;
}

export interface DashboardOperationsResponse {
  inventoryHealth: DashboardInventoryHealth;
  recentTransactions: DashboardRecentTransaction[];
  quickActions: DashboardQuickAction[];
}
