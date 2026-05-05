'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

const SEGMENT_LABELS: Record<string, string> = {
  pos: 'POS',
  history: 'Transaction History',
  analytics: 'Analytics',
  customers: 'Customers',
  'daily-orders': 'Daily Orders',
  coupons: 'Coupons',
  inventory: 'Inventory',
  products: 'Products',
  categories: 'Categories',
  brands: 'Brands',
  suppliers: 'Suppliers',
  'stock-reconciliations': 'Stock Reconciliations',
  'stock-history': 'Stock History',
  reports: 'Reports',
  finance: 'Finance',
  income: 'Income',
  expenses: 'Expenses',
  transactions: 'Transactions',
  dashboard: 'Dashboard',
  account: 'Account',
  admin: 'Admin',
  'audit-logs': 'Audit Logs',
};

const PATH_LABELS: Record<string, string> = {
  '/pos/history': 'Transaction History',
  '/pos/customers/all': 'Customer Management',
  '/pos/customers/manage': 'Customer List',
  '/pos/coupons/create': 'Create Coupon',
};

function getSegmentLabel(segment: string) {
  if (SEGMENT_LABELS[segment]) {
    return SEGMENT_LABELS[segment];
  }

  return segment
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function SiteHeader() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const contentSegments =
    segments[0] === 'dashboard' ? segments.slice(1) : segments;

  const crumbs = contentSegments.map((segment, index) => ({
    href: `/${contentSegments.slice(0, index + 1).join('/')}`,
    label:
      PATH_LABELS[`/${contentSegments.slice(0, index + 1).join('/')}`] ??
      getSegmentLabel(segment),
  }));

  const isDashboardHome = pathname === '/dashboard';

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b py-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              {isDashboardHome ? (
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href="/dashboard" prefetch={true}>
                    Dashboard
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {crumbs.map((crumb, index) => {
              const isLast = index === crumbs.length - 1;

              return (
                <Fragment key={crumb.href}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={crumb.href} prefetch={true}>
                          {crumb.label}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
