"use client";

import * as React from "react";
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
  IconShoppingCart,
  IconPackages,
  IconTruck,
  IconClipboardList,
  IconAdjustments,
  IconBarcode,
} from "@tabler/icons-react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "BaaWA Admin",
    email: "admin@baawa.com",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Inventory",
      url: "/inventory",
      icon: IconPackages,
    },
    {
      title: "POS System",
      url: "/pos",
      icon: IconShoppingCart,
    },
    {
      title: "Reports",
      url: "/reports",
      icon: IconChartBar,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
  ],
  navClouds: [
    {
      title: "Products",
      icon: IconPackages,
      isActive: true,
      url: "/inventory/products",
      items: [
        {
          title: "All Products",
          url: "/inventory/products",
        },
        {
          title: "Add Product",
          url: "/inventory/products/new",
        },
        {
          title: "Categories",
          url: "/inventory/categories",
        },
        {
          title: "Low Stock",
          url: "/inventory/products?filter=low-stock",
        },
      ],
    },
    {
      title: "Suppliers",
      icon: IconTruck,
      url: "/inventory/suppliers",
      items: [
        {
          title: "All Suppliers",
          url: "/inventory/suppliers",
        },
        {
          title: "Add Supplier",
          url: "/inventory/suppliers/new",
        },
        {
          title: "Purchase Orders",
          url: "/inventory/purchase-orders",
        },
      ],
    },
    {
      title: "Stock Management",
      icon: IconAdjustments,
      url: "/inventory/stock",
      items: [
        {
          title: "Stock Adjustments",
          url: "/inventory/stock-adjustments",
        },
        {
          title: "Stock History",
          url: "/inventory/stock-history",
        },
        {
          title: "Import Products",
          url: "/inventory/import",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Admin Panel",
      url: "/admin",
      icon: IconUsers,
    },
  ],
  documents: [
    {
      name: "Inventory Reports",
      url: "/reports/inventory",
      icon: IconReport,
    },
    {
      name: "Sales Reports",
      url: "/reports/sales",
      icon: IconChartBar,
    },
    {
      name: "Stock Reports",
      url: "/reports/stock",
      icon: IconDatabase,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
