'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { hasPermission } from '@/lib/auth/roles';
import {
  IconCash,
  IconChartBar,
  IconReceipt,
  IconTrendingUp,
  IconShoppingCart,
} from '@tabler/icons-react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';

const financeNavItems = [
  {
    title: 'Finance Overview',
    url: '/finance',
    icon: IconCash,
    items: [],
  },
  {
    title: 'Income Management',
    url: '/finance/income',
    icon: IconTrendingUp,
    items: [
      {
        title: 'View Income',
        url: '/finance/income',
      },
      {
        title: 'Add Income',
        url: '/finance/income/new',
      },
    ],
  },
  {
    title: 'Expense Management',
    url: '/finance/expenses',
    icon: IconShoppingCart,
    items: [
      {
        title: 'View Expenses',
        url: '/finance/expenses',
      },
      {
        title: 'Add Expense',
        url: '/finance/expenses/new',
      },
    ],
  },
  {
    title: 'Transactions',
    url: '/finance/transactions',
    icon: IconReceipt,
    items: [
      {
        title: 'All Transactions',
        url: '/finance/transactions',
      },
    ],
  },
  {
    title: 'Reports & Analytics',
    url: '/finance/reports',
    icon: IconChartBar,
    items: [
      {
        title: 'Financial Summary',
        url: '/finance/reports',
      },
      {
        title: 'Analytics Dashboard',
        url: '/finance/reports/analytics',
      },
      {
        title: 'Income Statement',
        url: '/finance/reports/income-statement',
      },
      {
        title: 'Cash Flow',
        url: '/finance/reports/cash-flow',
      },
    ],
  },
];

function CollapsibleNavItem({ item }: { item: (typeof financeNavItems)[0] }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);

  // Check if any sub-item is active - use exact matching to avoid conflicts
  const hasActiveChild = item.items?.some(subItem => pathname === subItem.url);

  // Check if the main item URL is active (only for items without sub-items)
  // For items with sub-items, only highlight if it's an exact match and no child is active
  const isMainActive = !item.items?.length
    ? pathname === item.url || pathname.startsWith(item.url + '/')
    : pathname === item.url && !hasActiveChild;

  // Auto-open dropdown if any child is active
  React.useEffect(() => {
    if (hasActiveChild) {
      setIsOpen(true);
    }
  }, [hasActiveChild]);

  // If no items, render as simple link
  if (!item.items || item.items.length === 0) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          tooltip={item.title}
          className={isMainActive ? 'bg-accent text-accent-foreground' : ''}
        >
          <Link href={item.url} prefetch={true}>
            <item.icon />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            className={isMainActive ? 'bg-accent text-accent-foreground' : ''}
          >
            <item.icon />
            <span>{item.title}</span>
            <ChevronDown
              className={`ml-auto h-4 w-4 -rotate-90 transition-transform duration-200 ${
                isOpen ? 'rotate-0' : ''
              }`}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        {item.items?.length ? (
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.items?.map(subItem => {
                const isActive = pathname === subItem.url;
                return (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton
                      asChild
                      className={
                        isActive ? 'bg-accent text-accent-foreground' : ''
                      }
                    >
                      <Link href={subItem.url} prefetch={true}>
                        <span>{subItem.title}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        ) : null}
      </Collapsible>
    </SidebarMenuItem>
  );
}

export function NavFinance() {
  const { data: session } = useSession();

  // Filter navigation items based on user permissions
  const filteredItems = React.useMemo(() => {
    if (!session?.user?.role) return [];

    const canViewFinancialReports = hasPermission(session.user.role, 'FINANCIAL_REPORTS');
    const canCreateTransactions = hasPermission(session.user.role, 'FINANCE_TRANSACTIONS_CREATE');

    return financeNavItems.filter(item => {
      // Always hide Finance Overview from Manager/Staff - contains business intelligence
      if (item.title === 'Finance Overview' && !canViewFinancialReports) {
        return false;
      }
      
      // Hide Reports & Analytics completely from Manager/Staff
      if (item.title === 'Reports & Analytics' && !canViewFinancialReports) {
        return false;
      }

      // Show Income/Expense Management only if user can create transactions
      if ((item.title === 'Income Management' || item.title === 'Expense Management') && !canCreateTransactions) {
        return false;
      }

      // Show Transactions only if user can create transactions
      if (item.title === 'Transactions' && !canCreateTransactions) {
        return false;
      }

      return true;
    }).map(item => {
      // For remaining items, filter sub-items based on permissions
      if (item.items && item.items.length > 0) {
        const filteredSubItems = item.items.filter(subItem => {
          // For Manager: only show Add Income/Expense and their own transaction view
          // Hide complex analytics and company-wide views
          return true; // We'll handle sub-item filtering in route protection
        });

        return { ...item, items: filteredSubItems };
      }
      return item;
    });
  }, [session?.user?.role]);

  // Don't render the finance section if no items are available
  if (filteredItems.length === 0) {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Finance Manager</SidebarGroupLabel>
      <SidebarMenu>
        {filteredItems.map(item => (
          <CollapsibleNavItem key={item.title} item={item} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
