"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IconMinus,
  IconPlus,
  IconTrash,
  IconShoppingCartOff,
  IconPackage,
  IconTag,
} from "@tabler/icons-react";

export interface CartItem {
  id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  stock: number;
  category?: string;
  brand?: string;
}

interface ShoppingCartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemoveItem: (productId: number) => void;
  onClearCart: () => void;
  disabled?: boolean;
}

export function ShoppingCart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  disabled = false,
}: ShoppingCartProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <IconShoppingCartOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Your cart is empty</p>
        <p className="text-sm">Search for products to add to your cart</p>
      </div>
    );
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="h-full flex flex-col">
      {/* Cart Header - Fixed */}
      <div className="flex items-center justify-between flex-shrink-0 mb-4">
        <div className="text-sm text-muted-foreground">
          {totalItems} item{totalItems !== 1 ? "s" : ""} • ₦
          {totalValue.toLocaleString()}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearCart}
          disabled={disabled}
        >
          <IconTrash className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>

      {/* Cart Items - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto max-h-[30rem] space-y-3 pr-2">
        {items.map((item) => (
          <Card key={item.id} className="border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Product Info */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {item.sku}
                      </Badge>
                      {item.category && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <IconTag className="h-3 w-3" />
                          {item.category}
                        </span>
                      )}
                      {item.brand && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <IconPackage className="h-3 w-3" />
                          {item.brand}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveItem(item.id)}
                    disabled={disabled}
                  >
                    <IconTrash className="h-4 w-4" />
                  </Button>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onUpdateQuantity(item.id, item.quantity - 1)
                      }
                      disabled={disabled || item.quantity <= 1}
                    >
                      <IconMinus className="h-4 w-4" />
                    </Button>

                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const newQuantity = parseInt(e.target.value) || 0;
                        if (newQuantity >= 1 && newQuantity <= item.stock) {
                          onUpdateQuantity(item.id, newQuantity);
                        }
                      }}
                      className="w-16 text-center"
                      min="1"
                      max={item.stock}
                      disabled={disabled}
                    />

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onUpdateQuantity(item.id, item.quantity + 1)
                      }
                      disabled={disabled || item.quantity >= item.stock}
                    >
                      <IconPlus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      ₦{item.price.toLocaleString()} each
                    </div>
                    <div className="font-semibold">
                      ₦{(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Stock Warning */}
                {item.quantity >= item.stock && (
                  <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                    Maximum quantity reached ({item.stock} available)
                  </div>
                )}

                {/* Stock Info */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item.stock} available in stock</span>
                  {item.stock <= 5 && (
                    <Badge variant="destructive" className="text-xs">
                      Low Stock
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cart Summary - Fixed at bottom */}
      <div className="space-y-2 pt-4 border-t mt-auto flex-shrink-0">
        <div className="flex justify-between text-sm">
          <span>Total Items:</span>
          <span>{totalItems}</span>
        </div>
        <div className="flex justify-between font-semibold text-lg">
          <span>Subtotal:</span>
          <span>₦{totalValue.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
