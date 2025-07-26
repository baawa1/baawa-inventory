"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconCash,
  IconTrendingUp,
  IconChartBar,
  IconReceipt,
  IconTarget,
} from "@tabler/icons-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

const financeNavItems = [
  {
    title: "Overview",
    url: "/finance",
    icon: IconCash,
    items: [],
  },
  {
    title: "Transactions",
    url: "/finance/transactions",
    icon: IconReceipt,
    items: [
      {
        title: "All Transactions",
        url: "/finance/transactions",
      },
      {
        title: "Income",
        url: "/finance/income",
      },
      {
        title: "Expenses",
        url: "/finance/expenses",
      },
    ],
  },
  {
    title: "Add New",
    url: "/finance/income/new",
    icon: IconTrendingUp,
    items: [
      {
        title: "Add Income",
        url: "/finance/income/new",
      },
      {
        title: "Add Expense",
        url: "/finance/expenses/new",
      },
    ],
  },
  {
    title: "Reports",
    url: "/finance/reports",
    icon: IconChartBar,
    items: [
      {
        title: "Financial Summary",
        url: "/finance/reports",
      },
      {
        title: "Income Statement",
        url: "/finance/reports/income-statement",
      },
      {
        title: "Expense Report",
        url: "/finance/reports/expenses",
      },
      {
        title: "Cash Flow",
        url: "/finance/reports/cash-flow",
      },
    ],
  },
  {
    title: "Budget Management",
    url: "/finance/budget",
    icon: IconTarget,
    items: [
      {
        title: "Budget Overview",
        url: "/finance/budget",
      },
      {
        title: "Set Budget",
        url: "/finance/budget/new",
      },
    ],
  },
];

function CollapsibleNavItem({ item }: { item: (typeof financeNavItems)[0] }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);

  // Check if any sub-item is active - use exact matching to avoid conflicts
  const hasActiveChild = item.items?.some(
    (subItem) => pathname === subItem.url
  );

  // Check if the main item URL is active (only for items without sub-items)
  // For items with sub-items, only highlight if it's an exact match and no child is active
  const isMainActive = !item.items?.length
    ? pathname === item.url || pathname.startsWith(item.url + "/")
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
          className={isMainActive ? "bg-accent text-accent-foreground" : ""}
        >
          <Link href={item.url}>
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
            className={isMainActive ? "bg-accent text-accent-foreground" : ""}
          >
            <item.icon />
            <span>{item.title}</span>
            <ChevronDown
              className={`ml-auto h-4 w-4 transition-transform duration-200 -rotate-90 ${
                isOpen ? "rotate-0" : ""
              }`}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        {item.items?.length ? (
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.items?.map((subItem) => {
                const isActive = pathname === subItem.url;
                return (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton
                      asChild
                      className={
                        isActive ? "bg-accent text-accent-foreground" : ""
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

export function NavFinance() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Finance Manager</SidebarGroupLabel>
      <SidebarMenu>
        {financeNavItems.map((item) => (
          <CollapsibleNavItem key={item.title} item={item} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
