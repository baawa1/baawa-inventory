'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  IconMinus,
  IconPlus,
  IconTrash,
  IconShoppingCartOff,
  IconPackage,
  IconTag,
} from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';
import { calculateOrderTotals } from '@/lib/utils/calculations';

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
  onUpdateQuantity: (_productId: number, _quantity: number) => void;
  onRemoveItem: (_productId: number) => void;
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
      <div className="text-muted-foreground py-8 text-center">
        <IconShoppingCartOff className="mx-auto mb-2 h-12 w-12 opacity-50" />
        <p>Your cart is empty</p>
        <p className="text-sm">Search for products to add to your cart</p>
      </div>
    );
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const { subtotal: totalValue } = calculateOrderTotals(items, 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Cart Header - Fixed */}
      <div className="mb-1 flex flex-shrink-0 items-center justify-between px-2 pt-0 sm:mb-3 sm:px-4 sm:pt-0 2xl:pt-3">
        <div className="text-muted-foreground text-xs sm:text-sm">
          {totalItems} item{totalItems !== 1 ? 's' : ''} •{' '}
          {formatCurrency(totalValue)}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearCart}
          disabled={disabled}
          className="h-7 px-2 text-xs sm:h-8 sm:px-3 sm:text-sm"
        >
          <IconTrash className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
          <span className="xs:inline hidden">Clear</span>
        </Button>
      </div>

      {/* Cart Items - Optimized scrollable area */}
      <div className="max-h-[300px] min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-1 sm:max-h-none sm:space-y-2 sm:px-4 sm:pb-3">
        {items.map(item => (
          <Card
            key={item.id}
            className="border-l-primary border-l-2 py-2 sm:border-l-4 sm:py-3"
          >
            <CardContent className="px-2 sm:px-3">
              <div className="space-y-1 sm:space-y-2">
                {/* Product Info */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold sm:text-base">
                      {item.name}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-1 sm:gap-2">
                      <Badge variant="outline" className="text-xs">
                        {item.sku}
                      </Badge>
                      {item.category && (
                        <span className="text-muted-foreground hidden items-center gap-1 text-xs sm:flex">
                          <IconTag className="h-3 w-3" />
                          {item.category}
                        </span>
                      )}
                      {item.brand && (
                        <span className="text-muted-foreground hidden items-center gap-1 text-xs sm:flex">
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
                    className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                  >
                    <IconTrash className="h-4 w-4" />
                  </Button>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onUpdateQuantity(item.id, item.quantity - 1)
                      }
                      disabled={disabled || item.quantity <= 1}
                      className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                    >
                      <IconMinus className="h-4 w-4" />
                    </Button>

                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={e => {
                        const newQuantity = parseInt(e.target.value) || 0;
                        if (newQuantity >= 1 && newQuantity <= item.stock) {
                          onUpdateQuantity(item.id, newQuantity);
                        }
                      }}
                      className="h-8 w-12 text-center sm:h-auto sm:w-16"
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
                      className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                    >
                      <IconPlus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-right">
                    <div className="text-muted-foreground text-xs sm:text-sm">
                      {formatCurrency(item.price)} each
                    </div>
                    <div className="text-sm font-semibold sm:text-base">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                </div>

                {/* Stock Warning */}
                {item.quantity >= item.stock && (
                  <div className="rounded bg-amber-50 p-2 text-xs text-amber-600">
                    Maximum quantity reached ({item.stock} available)
                  </div>
                )}

                {/* Stock Info */}
                <div className="text-muted-foreground flex items-center justify-between text-xs">
                  <span className="hidden sm:inline">
                    {item.stock} available in stock
                  </span>
                  <span className="sm:hidden">{item.stock} in stock</span>
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

      {/* Cart Summary - Compact fixed bottom */}
      <div className="flex-shrink-0 space-y-1 border-t px-2 pt-1 pb-1 sm:space-y-2 sm:px-4 sm:pt-2 sm:pb-0">
        <div className="flex justify-between text-xs sm:text-sm">
          <span>Items:</span>
          <span>{totalItems}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold sm:text-base">
          <span>Subtotal:</span>
          <span>{formatCurrency(totalValue)}</span>
        </div>
      </div>
    </div>
  );
}
