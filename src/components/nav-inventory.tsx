'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconPackages,
  IconTag,
  IconTruck,
  IconAdjustments,
  IconBuildingStore,
  IconChartBar,
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

const inventoryNavItems = [
  {
    title: 'Products',
    url: '/inventory/products',
    icon: IconPackages,
    items: [
      {
        title: 'All Products',
        url: '/inventory/products',
      },
      {
        title: 'Add Product',
        url: '/inventory/products/add',
      },
      {
        title: 'Low Stock',
        url: '/inventory/low-stock',
      },
      {
        title: 'Archived Products',
        url: '/inventory/products/archived',
      },
    ],
  },
  {
    title: 'Categories',
    url: '/inventory/categories',
    icon: IconTag,
    items: [
      {
        title: 'All Categories',
        url: '/inventory/categories',
      },
      {
        title: 'Add Category',
        url: '/inventory/categories/add',
      },
    ],
  },
  {
    title: 'Brands',
    url: '/inventory/brands',
    icon: IconBuildingStore,
    items: [
      {
        title: 'All Brands',
        url: '/inventory/brands',
      },
      {
        title: 'Add Brand',
        url: '/inventory/brands/add',
      },
    ],
  },
  {
    title: 'Suppliers',
    url: '/inventory/suppliers',
    icon: IconTruck,
    items: [
      {
        title: 'All Suppliers',
        url: '/inventory/suppliers',
      },
      {
        title: 'Add Supplier',
        url: '/inventory/suppliers/add',
      },
    ],
  },

  {
    title: 'Stock Reconciliation',
    url: '/inventory/stock-reconciliations',
    icon: IconAdjustments,
    items: [
      {
        title: 'All Reconciliations',
        url: '/inventory/stock-reconciliations',
      },
      {
        title: 'Add Reconciliation',
        url: '/inventory/stock-reconciliations/add',
      },
      {
        title: 'Stock History',
        url: '/inventory/stock-history',
      },
    ],
  },
  {
    title: 'Reports',
    url: '/inventory/reports',
    icon: IconChartBar,
    items: [
      {
        title: 'Inventory Reports',
        url: '/inventory/reports',
      },
      {
        title: 'Current Stock',
        url: '/inventory/reports?type=current_stock',
      },
      {
        title: 'Stock Value',
        url: '/inventory/reports?type=stock_value',
      },
      {
        title: 'Low Stock',
        url: '/inventory/reports?type=low_stock',
      },
    ],
  },
];

function CollapsibleNavItem({ item }: { item: (typeof inventoryNavItems)[0] }) {
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
                      <Link href={subItem.url}>
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

export function NavInventory() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Inventory Management</SidebarGroupLabel>
      <SidebarMenu>
        {inventoryNavItems.map(item => (
          <CollapsibleNavItem key={item.title} item={item} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
