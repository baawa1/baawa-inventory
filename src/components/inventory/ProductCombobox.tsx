"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Product {
  id: number;
  name: string;
  sku: string;
  stock: number;
  stock_quantity?: number; // Alternative field name for consistency
}

interface ProductComboboxProps {
  products: Product[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
}

export function ProductCombobox({
  products,
  value,
  onValueChange,
  placeholder = "Select a product...",
  emptyMessage = "No products found.",
  disabled = false,
  className,
}: ProductComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedProduct = products.find(
    (product) => product.id.toString() === value
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedProduct ? (
            <div className="flex items-center gap-2 text-left">
              <Package className="h-4 w-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {selectedProduct.name}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  SKU: {selectedProduct.sku} | Stock:{" "}
                  {selectedProduct.stock || selectedProduct.stock_quantity || 0}
                </div>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search products..." />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={`${product.name} ${product.sku}`}
                  onSelect={() => {
                    onValueChange(product.id.toString());
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 p-2"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === product.id.toString()
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <Package className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{product.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      SKU: {product.sku} | Stock:{" "}
                      {product.stock || product.stock_quantity || 0}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
