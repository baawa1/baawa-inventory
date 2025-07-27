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
      <div className="text-muted-foreground py-8 text-center">
        <IconShoppingCartOff className="mx-auto mb-2 h-12 w-12 opacity-50" />
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
    <div className="flex h-full flex-col">
      {/* Cart Header - Fixed */}
      <div className="mb-4 flex flex-shrink-0 items-center justify-between">
        <div className="text-muted-foreground text-sm">
          {totalItems} item{totalItems !== 1 ? 's' : ''} •{' '}
          {formatCurrency(totalValue)}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearCart}
          disabled={disabled}
        >
          <IconTrash className="mr-1 h-4 w-4" />
          Clear
        </Button>
      </div>

      {/* Cart Items - Scrollable */}
      <div className="max-h-80 min-h-0 flex-1 space-y-3 overflow-y-auto pt-2 pr-2 pb-2">
        {items.map(item => (
          <Card key={item.id} className="border-l-primary border-l-4">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Product Info */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {item.sku}
                      </Badge>
                      {item.category && (
                        <span className="text-muted-foreground flex items-center gap-1 text-xs">
                          <IconTag className="h-3 w-3" />
                          {item.category}
                        </span>
                      )}
                      {item.brand && (
                        <span className="text-muted-foreground flex items-center gap-1 text-xs">
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
                      onChange={e => {
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
                    <div className="text-muted-foreground text-sm">
                      {formatCurrency(item.price)} each
                    </div>
                    <div className="font-semibold">
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
      <div className="mt-auto flex-shrink-0 space-y-2 border-t pt-4">
        <div className="flex justify-between text-sm">
          <span>Total Items:</span>
          <span>{totalItems}</span>
        </div>
        <div className="flex justify-between text-lg font-semibold">
          <span>Subtotal:</span>
          <span>{formatCurrency(totalValue)}</span>
        </div>
      </div>
    </div>
  );
}
