"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import {
  IconShoppingCart,
  IconHistory,
  IconUsers,
  IconChartBar,
  IconStar,
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
    title: "Reviews",
    url: "/pos/reviews",
    icon: IconStar,
    items: [
      {
        title: "All Reviews",
        url: "/pos/reviews",
      },
      {
        title: "Pending Reviews",
        url: "/pos/reviews?status=pending",
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
  const [isOpen, setIsOpen] = React.useState(false);

  // If no items, render as simple link
  if (!item.items || item.items.length === 0) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip={item.title}>
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
          <SidebarMenuButton tooltip={item.title}>
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
              {item.items?.map((subItem) => (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton asChild>
                    <Link href={subItem.url}>
                      <span>{subItem.title}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
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
