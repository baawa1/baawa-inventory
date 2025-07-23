"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconShoppingCart,
  IconHistory,
  IconUsers,
  IconChartBar,
  IconTicket,
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

const posNavItems = [
  {
    title: "Sales",
    url: "/pos",
    icon: IconShoppingCart,
    items: [
      {
        title: "New Sale",
        url: "/pos",
      },
      {
        title: "Barcode Scanner",
        url: "/pos?mode=scanner",
      },
    ],
  },
  {
    title: "Transaction History",
    url: "/pos/history",
    icon: IconHistory,
    items: [],
  },
  {
    title: "Analytics",
    url: "/pos/analytics",
    icon: IconChartBar,
    items: [
      {
        title: "Sales Overview",
        url: "/pos/analytics",
      },
      {
        title: "Product Performance",
        url: "/pos/analytics/products",
      },
      {
        title: "Category Performance",
        url: "/pos/analytics/categories",
      },
    ],
  },
  {
    title: "Customers",
    url: "/pos/customers",
    icon: IconUsers,
    items: [
      {
        title: "Customer Leaderboard",
        url: "/pos/customers",
      },
      {
        title: "Customer History",
        url: "/pos/customers/all",
      },
    ],
  },

  {
    title: "Coupons",
    url: "/pos/coupons",
    icon: IconTicket,
    items: [
      {
        title: "All Coupons",
        url: "/pos/coupons",
      },
      {
        title: "Create Coupon",
        url: "/pos/coupons/create",
      },
    ],
  },
];

function CollapsibleNavItem({ item }: { item: (typeof posNavItems)[0] }) {
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

export function NavPOS() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>POS System</SidebarGroupLabel>
      <SidebarMenu>
        {posNavItems.map((item) => (
          <CollapsibleNavItem key={item.title} item={item} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
