"use client";

import {
  IconPlus,
  IconFileImport,
  IconAdjustments,
  IconBarcode,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface QuickActionsProps {
  userRole: string;
}

export function QuickActions({ userRole }: QuickActionsProps) {
  const canManageInventory = ["ADMIN", "MANAGER"].includes(userRole);
  const canAddProducts = ["ADMIN", "MANAGER", "STAFF"].includes(userRole);

  return (
    <div className="flex gap-2">
      {canAddProducts && (
        <Button asChild>
          <a href="/inventory/products/new" className="flex items-center gap-2">
            <IconPlus className="h-4 w-4" />
            Add Product
          </a>
        </Button>
      )}

      {canManageInventory && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Quick Actions</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Inventory Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <a
                href="/inventory/suppliers/new"
                className="flex items-center gap-2"
              >
                <IconPlus className="h-4 w-4" />
                Add Supplier
              </a>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <a
                href="/inventory/stock-adjustments"
                className="flex items-center gap-2"
              >
                <IconAdjustments className="h-4 w-4" />
                Stock Adjustment
              </a>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <a href="/inventory/import" className="flex items-center gap-2">
                <IconFileImport className="h-4 w-4" />
                Import Products
              </a>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <a href="/inventory/barcodes" className="flex items-center gap-2">
                <IconBarcode className="h-4 w-4" />
                Generate Barcodes
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
