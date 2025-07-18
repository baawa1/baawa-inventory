"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import {
  IconShoppingCart,
  IconHistory,
  IconReceipt,
  IconCash,
  IconChartBar,
  IconSettings,
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
    items: [
      {
        title: "All Transactions",
        url: "/pos/history",
      },
      {
        title: "Today's Sales",
        url: "/pos/history?period=today",
      },
      {
        title: "This Week",
        url: "/pos/history?period=week",
      },
      {
        title: "This Month",
        url: "/pos/history?period=month",
      },
    ],
  },
  {
    title: "Receipts",
    url: "/pos/receipts",
    icon: IconReceipt,
    items: [
      {
        title: "Print Receipts",
        url: "/pos/receipts",
      },
      {
        title: "Email Receipts",
        url: "/pos/receipts?mode=email",
      },
      {
        title: "Receipt Templates",
        url: "/pos/receipts/templates",
      },
    ],
  },
  {
    title: "Payments",
    url: "/pos/payments",
    icon: IconCash,
    items: [
      {
        title: "Payment Methods",
        url: "/pos/payments",
      },
      {
        title: "Cash Management",
        url: "/pos/payments/cash",
      },
      {
        title: "Refunds",
        url: "/pos/payments/refunds",
      },
    ],
  },
  {
    title: "Reports",
    url: "/pos/reports",
    icon: IconChartBar,
    items: [
      {
        title: "Sales Reports",
        url: "/pos/reports",
      },
      {
        title: "Daily Summary",
        url: "/pos/reports?type=daily",
      },
      {
        title: "Payment Analysis",
        url: "/pos/reports?type=payments",
      },
      {
        title: "Staff Performance",
        url: "/pos/reports?type=staff",
      },
    ],
  },
  {
    title: "Settings",
    url: "/pos/settings",
    icon: IconSettings,
    items: [
      {
        title: "POS Configuration",
        url: "/pos/settings",
      },
      {
        title: "Receipt Settings",
        url: "/pos/settings/receipts",
      },
      {
        title: "Payment Settings",
        url: "/pos/settings/payments",
      },
      {
        title: "Barcode Settings",
        url: "/pos/settings/barcode",
      },
    ],
  },
];

function CollapsibleNavItem({ item }: { item: (typeof posNavItems)[0] }) {
  const [isOpen, setIsOpen] = React.useState(false);

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
