'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ProductGrid } from './ProductGrid';
import { ShoppingCart } from './ShoppingCart';
import { SlidingPaymentInterface } from './SlidingPaymentInterface';
import { OfflineStatusIndicator } from './OfflineStatusIndicator';
import { POSErrorBoundary } from './POSErrorBoundary';
import { IconShoppingCart, IconCash, IconTrash } from '@tabler/icons-react';
import { useOffline } from '@/hooks/useOffline';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { logger } from '@/lib/logger';
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

export interface Sale {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  staffName: string;
  timestamp: Date;
}

export function POSInterface() {
  const { data: session } = useSession();
  const { isOnline, queueTransaction } = useOffline();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentStep, setCurrentStep] = useState<
    'search' | 'payment' | 'receipt'
  >('search');
  const [discount, setDiscount] = useState(0);
  const [fees, setFees] = useState<
    Array<{
      feeType: string;
      description?: string;
      amount: number;
    }>
  >([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    billingAddress: '',
    shippingAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Nigeria',
    customerType: 'individual' as 'individual' | 'business',
    notes: '',
    useBillingAsShipping: true,
    shippingCity: '',
    shippingState: '',
    shippingPostalCode: '',
    shippingCountry: 'Nigeria',
  });

  // Calculate totals using consistent utility
  const { subtotal, total: baseTotal } = calculateOrderTotals(cart, discount);

  // Add fees to total
  const feesTotal = fees.reduce((sum, fee) => sum + fee.amount, 0);
  const total = baseTotal + feesTotal;

  // Validate that total is never negative
  const validatedTotal = Math.max(0, total);
  const validatedDiscount = Math.min(discount, subtotal);

  // Add product to cart
  const addToCart = (product: Omit<CartItem, 'quantity'>) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, item.stock) }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // Update cart item quantity
  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== productId));
      return;
    }

    setCart(prev =>
      prev.map(item =>
        item.id === productId
          ? { ...item, quantity: Math.min(quantity, item.stock) }
          : item
      )
    );
  };

  // Remove item from cart
  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setFees([]);
    setCustomerInfo({
      name: '',
      phone: '',
      email: '',
      billingAddress: '',
      shippingAddress: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Nigeria',
      customerType: 'individual' as 'individual' | 'business',
      notes: '',
      useBillingAsShipping: true,
      shippingCity: '',
      shippingState: '',
      shippingPostalCode: '',
      shippingCountry: 'Nigeria',
    });
    toast.success('Shopping cart cleared');
  };

  // Handle successful payment
  const handlePaymentSuccess = async (sale: Sale) => {
    // If offline, queue the transaction
    if (!isOnline) {
      try {
        await queueTransaction({
          items: cart.map(item => ({
            productId: item.id,
            name: item.name,
            sku: item.sku,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity,
          })),
          subtotal,
          discount,
          total,
          paymentMethod: sale.paymentMethod as any,
          customerName: customerInfo.name || undefined,
          customerPhone: customerInfo.phone || undefined,
          customerEmail: customerInfo.email || undefined,
          staffName: session?.user?.name || 'Staff',
          staffId: parseInt(session?.user?.id || '0'),
        });

        clearCart();

        toast.success('Transaction saved offline. Will sync when online.');
      } catch (error) {
        logger.error('Offline transaction failed', {
          error: error instanceof Error ? error.message : String(error),
        });
        toast.error('Transaction failed. Please try again.');
      }
    } else {
      // Online - normal flow
      clearCart();
    }
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
    <POSErrorBoundary componentName="POSInterface">
      <div
        data-testid="pos-interface"
        className="flex h-[calc(100vh-49px)] flex-col overflow-hidden"
      >
        {/* Header with Clear All Button */}
        <div className="flex flex-shrink-0 items-center justify-between border-b p-3 sm:p-4">
          <h1 className="text-xl font-bold sm:text-2xl">Point of Sale</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            {cart.length > 0 && currentStep === 'search' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 sm:gap-2"
                  >
                    <IconTrash className="h-4 w-4" />
                    <span className="hidden sm:inline">Clear All</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Shopping Cart</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to clear all items from your
                      shopping cart? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={clearCart}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Clear All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <OfflineStatusIndicator />
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 p-3 sm:p-6 lg:grid-cols-3">
          {/* Left Column - Product Search and Grid */}
          <div className="flex min-h-0 flex-col lg:col-span-2">
            <POSErrorBoundary componentName="ProductGrid">
              <ProductGrid
                onProductSelect={addToCart}
                disabled={currentStep !== 'search'}
              />
            </POSErrorBoundary>
          </div>

          {/* Right Column - Cart and Actions - Full Height */}
          <div className="flex min-h-0 flex-col lg:h-full">
            {currentStep === 'payment' ? (
              /* Payment Interface - Slides in over cart */
              <POSErrorBoundary componentName="SlidingPaymentInterface">
                <div className="bg-background fixed inset-0 z-50 lg:static lg:z-auto lg:bg-transparent">
                  <SlidingPaymentInterface
                    items={cart}
                    subtotal={subtotal}
                    discount={validatedDiscount}
                    fees={fees}
                    total={validatedTotal}
                    customerInfo={customerInfo}
                    staffName={session.user.name || 'Staff'}
                    onPaymentSuccess={sale => {
                      // Convert SlidingPaymentInterface.Sale to POSInterface.Sale
                      handlePaymentSuccess({
                        ...sale,
                        items: sale.items.map(item => ({
                          ...item,
                          id: Number(item.id),
                          sku: '',
                          stock: 0,
                          category: undefined,
                          brand: undefined,
                        })),
                      });
                    }}
                    onCancel={() => setCurrentStep('search')}
                    onDiscountChange={setDiscount}
                    onFeesChange={setFees}
                    onCustomerInfoChange={info =>
                      setCustomerInfo(prev => ({ ...prev, ...info }))
                    }
                  />
                </div>
              </POSErrorBoundary>
            ) : (
              /* Normal Cart View */
              <>
                {/* Shopping Cart - Full height with scrollable content */}
                <Card className="flex min-h-0 flex-1 flex-col gap-1 py-3 md:gap-6 md:py-6">
                  <CardHeader className="flex-shrink-0">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <IconShoppingCart className="h-5 w-5" />
                        Shopping Cart
                      </span>
                      <span className="text-muted-foreground text-sm font-normal">
                        {cart.length} items
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex min-h-0 flex-1 flex-col p-0">
                    <POSErrorBoundary componentName="ShoppingCart">
                      <ShoppingCart
                        items={cart}
                        onUpdateQuantity={updateQuantity}
                        onRemoveItem={removeFromCart}
                        onClearCart={clearCart}
                        disabled={currentStep !== 'search'}
                      />
                    </POSErrorBoundary>
                  </CardContent>
                </Card>

                {/* Order Summary and Actions - Fixed at bottom */}
                <div className="mt-3 flex flex-shrink-0 flex-col gap-2 py-3 sm:mt-6 sm:gap-3 sm:py-0">
                  {/* Order Summary */}
                  <Card className="py-0 md:py-6">
                    <CardHeader className="hidden pb-2 sm:block sm:pb-3">
                      <CardTitle className="text-base sm:text-lg">
                        Order Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3 pb-3 sm:pt-0 sm:pb-6">
                      <div className="space-y-1 sm:space-y-2">
                        <div className="hidden justify-between text-sm sm:flex sm:text-base">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(subtotal)}</span>
                        </div>
                        {validatedDiscount > 0 && (
                          <div className="hidden justify-between text-sm text-red-600 sm:flex sm:text-base">
                            <span>Discount:</span>
                            <span>-{formatCurrency(validatedDiscount)}</span>
                          </div>
                        )}
                        <Separator className="hidden sm:block" />
                        <div className="flex justify-between text-base font-bold sm:text-lg">
                          <span>Total:</span>
                          <span>{formatCurrency(validatedTotal)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setCurrentStep('payment')}
                      disabled={cart.length === 0}
                      className="h-12 flex-1 text-base sm:h-10 sm:text-sm"
                    >
                      <IconCash className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
                      <span className="xs:inline hidden">Proceed to </span>
                      Payment
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </POSErrorBoundary>
  );
}
