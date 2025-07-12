"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProductGrid } from "./ProductGrid";
import { ShoppingCart } from "./ShoppingCart";
import { PaymentInterface } from "./PaymentInterface";
import { ReceiptGenerator } from "./ReceiptGenerator";
import { OfflineStatusIndicator } from "./OfflineStatusIndicator";
import { POSErrorBoundary } from "./POSErrorBoundary";
import { IconShoppingCart, IconCash, IconReceipt } from "@tabler/icons-react";
import { useOffline } from "@/hooks/useOffline";
import { toast } from "sonner";

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
    "search" | "payment" | "receipt"
  >("search");
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [discount, setDiscount] = useState(0);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
  });

  // Calculate totals
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const total = subtotal - discount;

  // Add product to cart
  const addToCart = (product: Omit<CartItem, "quantity">) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);
      if (existingItem) {
        return prev.map((item) =>
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
      setCart((prev) => prev.filter((item) => item.id !== productId));
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.id === productId
          ? { ...item, quantity: Math.min(quantity, item.stock) }
          : item
      )
    );
  };

  // Remove item from cart
  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setCustomerInfo({ name: "", phone: "", email: "" });
  };

  // Handle successful payment
  const handlePaymentSuccess = async (sale: Sale) => {
    // If offline, queue the transaction
    if (!isOnline) {
      try {
        const transactionId = await queueTransaction({
          items: cart.map((item) => ({
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
          staffName: session?.user?.name || "Staff",
          staffId: parseInt(session?.user?.id || "0"),
        });

        // Create offline sale record
        const offlineSale: Sale = {
          ...sale,
          id: transactionId,
          timestamp: new Date(),
        };

        setCompletedSale(offlineSale);
        setCurrentStep("receipt");
        clearCart();

        toast.success("Transaction saved offline. Will sync when online.");
      } catch (error) {
        toast.error("Failed to save transaction offline");
        console.error("Offline transaction error:", error);
      }
    } else {
      // Online - normal flow
      setCompletedSale(sale);
      setCurrentStep("receipt");
      clearCart();
    }
  };

  // Start new sale
  const startNewSale = () => {
    setCurrentStep("search");
    setCompletedSale(null);
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
    <POSErrorBoundary componentName="POSInterface">
      <div data-testid="pos-interface" className="h-screen overflow-hidden">
        {/* Offline Status Indicator */}
        <div className="flex justify-between items-center p-4 border-b">
          <h1 className="text-2xl font-bold">Point of Sale</h1>
          <OfflineStatusIndicator />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full p-6">
          {/* Left Column - Product Search and Grid */}
          <div className="lg:col-span-2 h-full">
            <POSErrorBoundary componentName="ProductGrid">
              <ProductGrid
                onProductSelect={addToCart}
                disabled={currentStep !== "search"}
              />
            </POSErrorBoundary>
          </div>

          {/* Right Column - Cart and Actions */}
          <div className="space-y-6 h-full overflow-y-auto">
            {/* Shopping Cart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <IconShoppingCart className="h-5 w-5" />
                    Shopping Cart
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {cart.length} items
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <POSErrorBoundary componentName="ShoppingCart">
                  <ShoppingCart
                    items={cart}
                    onUpdateQuantity={updateQuantity}
                    onRemoveItem={removeFromCart}
                    onClearCart={clearCart}
                    disabled={currentStep !== "search"}
                  />
                </POSErrorBoundary>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₦{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount</span>
                    <span>-₦{discount.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₦{total.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              {currentStep === "search" && (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setCurrentStep("payment")}
                  disabled={cart.length === 0}
                >
                  <IconCash className="h-5 w-5 mr-2" />
                  Proceed to Payment
                </Button>
              )}

              {currentStep === "payment" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setCurrentStep("search")}
                >
                  Back to Shopping
                </Button>
              )}

              {currentStep === "receipt" && (
                <Button className="w-full" size="lg" onClick={startNewSale}>
                  <IconReceipt className="h-5 w-5 mr-2" />
                  Start New Sale
                </Button>
              )}
            </div>
          </div>

          {/* Payment Modal */}
          {currentStep === "payment" && (
            <POSErrorBoundary componentName="PaymentInterface">
              <PaymentInterface
                items={cart}
                subtotal={subtotal}
                discount={discount}
                total={total}
                customerInfo={customerInfo}
                staffName={session.user.name || "Staff"}
                onPaymentSuccess={handlePaymentSuccess}
                onCancel={() => setCurrentStep("search")}
                onDiscountChange={setDiscount}
                onCustomerInfoChange={setCustomerInfo}
              />
            </POSErrorBoundary>
          )}

          {/* Receipt Display */}
          {currentStep === "receipt" && completedSale && (
            <POSErrorBoundary componentName="ReceiptGenerator">
              <ReceiptGenerator sale={completedSale} onClose={startNewSale} />
            </POSErrorBoundary>
          )}
        </div>
      </div>
    </POSErrorBoundary>
  );
}
