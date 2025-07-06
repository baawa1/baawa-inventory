"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import {
  IconPackages,
  IconTag,
  IconTruck,
  IconAdjustments,
  IconBuildingStore,
  type Icon,
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

const inventoryNavItems = [
  {
    title: "Products",
    url: "/inventory/products",
    icon: IconPackages,
    items: [
      {
        title: "All Products",
        url: "/inventory/products",
      },
      {
        title: "Add Product",
        url: "/inventory/products/add",
      },
      {
        title: "Low Stock",
        url: "/inventory/products?filter=low-stock",
      },
    ],
  },
  {
    title: "Categories",
    url: "/inventory/categories",
    icon: IconTag,
    items: [
      {
        title: "All Categories",
        url: "/inventory/categories",
      },
      {
        title: "Add Category",
        url: "/inventory/categories/add",
      },
    ],
  },
  {
    title: "Brands",
    url: "/inventory/brands",
    icon: IconBuildingStore,
    items: [
      {
        title: "All Brands",
        url: "/inventory/brands",
      },
      {
        title: "Add Brand",
        url: "/inventory/brands/add",
      },
    ],
  },
  {
    title: "Suppliers",
    url: "/inventory/suppliers",
    icon: IconTruck,
    items: [
      {
        title: "All Suppliers",
        url: "/inventory/suppliers",
      },
      {
        title: "Add Supplier",
        url: "/inventory/suppliers/add",
      },
      {
        title: "Purchase Orders",
        url: "/inventory/purchase-orders",
      },
    ],
  },
  {
    title: "Stock Adjustments",
    url: "/inventory/stock-adjustments",
    icon: IconAdjustments,
    items: [
      {
        title: "All Adjustments",
        url: "/inventory/stock-adjustments",
      },
      {
        title: "Add Adjustment",
        url: "/inventory/stock-adjustments/add",
      },
      {
        title: "Stock History",
        url: "/inventory/stock-history",
      },
    ],
  },
];

function CollapsibleNavItem({ item }: { item: (typeof inventoryNavItems)[0] }) {
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
                    <a href={subItem.url}>
                      <span>{subItem.title}</span>
                    </a>
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

export function NavInventory() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Inventory Management</SidebarGroupLabel>
      <SidebarMenu>
        {inventoryNavItems.map((item) => (
          <CollapsibleNavItem key={item.title} item={item} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
