'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  IconPrinter,
  IconDownload,
  IconMail,
  IconCheck,
  IconReceipt,
  IconCalendar,
  IconUser,
  IconPhone,
  IconCash,
  IconCreditCard,
  IconBuilding,
  IconWallet,
  IconSettings,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { PrinterConfig } from './PrinterConfig';
import { formatCurrency } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { safeToISOString } from '@/lib/utils/date-utils';

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

interface ReceiptGeneratorProps {
  sale: Sale;
  onClose: () => void;
}

const PAYMENT_METHOD_ICONS = {
  cash: IconCash,
  pos: IconCreditCard,
  bank_transfer: IconBuilding,
  mobile_money: IconWallet,
};

const PAYMENT_METHOD_LABELS = {
  cash: 'Cash',
  pos: 'POS Machine',
  bank_transfer: 'Bank Transfer',
  mobile_money: 'Mobile Money',
};

export function ReceiptGenerator({ sale, onClose }: ReceiptGeneratorProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [showPrinterConfig, setShowPrinterConfig] = useState(false);
  const [printerConfig, setPrinterConfig] = useState({
    type: 'usb',
    interface: 'USB001',
    options: {
      width: 32,
      characterSet: 'SLOVENIA',
      removeSpecialCharacters: false,
      lineCharacter: '-',
    },
  });

  const PaymentIcon =
    PAYMENT_METHOD_ICONS[
      sale.paymentMethod as keyof typeof PAYMENT_METHOD_ICONS
    ] || IconCash;
  const paymentLabel =
    PAYMENT_METHOD_LABELS[
      sale.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS
    ] || 'Cash';

  // Format date and time
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Print receipt
  const handlePrint = () => {
    if (receiptRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const receiptHTML = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Receipt - ${sale.id}</title>
            <style>
              body { font-family: monospace; font-size: 12px; line-height: 1.4; margin: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .store-name { font-size: 18px; font-weight: bold; }
              .receipt-details { margin-bottom: 20px; }
              .items { margin-bottom: 20px; }
              .item { margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
              .item-name { font-weight: bold; }
              .item-details { color: #666; font-size: 11px; }
              .totals { margin-top: 20px; padding-top: 10px; border-top: 2px solid #000; }
              .total-line { display: flex; justify-content: space-between; margin-bottom: 5px; }
              .grand-total { font-weight: bold; font-size: 14px; }
              .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #666; }
              @media print { 
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="store-name">BaaWA ACCESSORIES</div>
              <div>Quality Accessories Store</div>
              <div>Receipt #${sale.id}</div>
            </div>
            
            <div class="receipt-details">
              <div><strong>Date:</strong> ${formatDate(sale.timestamp)}</div>
              <div><strong>Time:</strong> ${formatTime(sale.timestamp)}</div>
              <div><strong>Staff:</strong> ${sale.staffName}</div>
              <div><strong>Payment:</strong> ${paymentLabel}</div>
              ${sale.customerName ? `<div><strong>Customer:</strong> ${sale.customerName}</div>` : ''}
              ${sale.customerPhone ? `<div><strong>Phone:</strong> ${sale.customerPhone}</div>` : ''}
            </div>
            
            <div class="items">
              ${sale.items
                .map(
                  item => `
                <div class="item">
                  <div class="item-name">${item.name}</div>
                  <div class="item-details">SKU: ${item.sku} | ${item.category || 'N/A'}</div>
                  <div class="total-line">
                    <span>${item.quantity} × ${formatCurrency(item.price)}</span>
                    <span>${formatCurrency(item.price * item.quantity)}</span>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
            
            <div class="totals">
              <div class="total-line">
                <span>Subtotal:</span>
                <span>${formatCurrency(sale.subtotal)}</span>
              </div>
              <div class="total-line">
                <span>Discount:</span>
                <span>-${formatCurrency(sale.discount)}</span>
              </div>
              <div class="total-line grand-total">
                <span>TOTAL:</span>
                <span>${formatCurrency(sale.total)}</span>
              </div>
            </div>
            
            <div class="footer">
              <div>Thank you for shopping with us!</div>
              <div>Visit us again soon</div>
              <div style="margin-top: 20px;">.</div>
            </div>
          </body>
          </html>
        `;

        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  // Download receipt as PDF (simplified version)
  const handleDownload = () => {
    const element = receiptRef.current;
    if (element) {
      // For now, we'll use the print functionality
      handlePrint();
      toast.success('Receipt ready for download/print');
    }
  };

  // Thermal printer receipt
  const handleThermalPrint = async () => {
    try {
      const response = await fetch('/api/pos/print-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          saleId: sale.id,
          timestamp: safeToISOString(sale.timestamp),
          staffName: sale.staffName,
          customerName: sale.customerName,
          customerPhone: sale.customerPhone,
          items: sale.items.map(item => ({
            name: item.name,
            sku: item.sku,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
            category: item.category,
          })),
          subtotal: sale.subtotal,
          discount: sale.discount,
          total: sale.total,
          paymentMethod: sale.paymentMethod,
          printerConfig,
        }),
      });

      if (response.ok) {
        toast.success('Receipt printed on thermal printer!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to print receipt');
      }
    } catch (error) {
      logger.error('Receipt printing failed', {
        transactionId: sale.id,
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error('Failed to print receipt');
    }
  };

  // Email receipt
  const handleEmailReceipt = async () => {
    if (!sale.customerEmail) {
      toast.error('No customer email provided');
      return;
    }

    try {
      const response = await fetch('/api/pos/email-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          saleId: sale.id,
          customerEmail: sale.customerEmail,
          customerName: sale.customerName,
        }),
      });

      if (response.ok) {
        toast.success('Receipt sent successfully!');
      } else {
        toast.error('Failed to send receipt');
      }
    } catch (error) {
      logger.error('Receipt email sending failed', {
        transactionId: sale.id,
        customerEmail: sale.customerEmail,
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error('Failed to send receipt email');
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconCheck className="h-5 w-5 text-green-600" />
            Payment Successful
          </DialogTitle>
          <DialogDescription>
            Transaction completed successfully. Receipt ready for printing.
          </DialogDescription>
        </DialogHeader>

        {/* Receipt Preview */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6" ref={receiptRef}>
              {/* Store Header */}
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold">BaaWA ACCESSORIES</h1>
                <p className="text-muted-foreground">
                  Quality Accessories Store
                </p>
                <div className="mt-2">
                  <Badge variant="outline">Receipt #{sale.id}</Badge>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <IconCalendar className="h-4 w-4" />
                    <span>{formatDate(sale.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconUser className="h-4 w-4" />
                    <span>Staff: {sale.staffName}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <PaymentIcon className="h-4 w-4" />
                    <span>{paymentLabel}</span>
                  </div>
                  <div className="text-muted-foreground">
                    Time: {formatTime(sale.timestamp)}
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              {(sale.customerName || sale.customerPhone) && (
                <div className="bg-muted mb-6 rounded p-3">
                  <h3 className="mb-2 font-semibold">Customer Information</h3>
                  {sale.customerName && (
                    <div className="flex items-center gap-2 text-sm">
                      <IconUser className="h-4 w-4" />
                      <span>{sale.customerName}</span>
                    </div>
                  )}
                  {sale.customerPhone && (
                    <div className="flex items-center gap-2 text-sm">
                      <IconPhone className="h-4 w-4" />
                      <span>{sale.customerPhone}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Items */}
              <div className="mb-6">
                <h3 className="mb-4 font-semibold">Items Purchased</h3>
                <div className="space-y-3">
                  {sale.items.map(item => (
                    <div
                      key={item.id}
                      className="border-b pb-3 last:border-b-0"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <div className="text-muted-foreground text-sm">
                            SKU: {item.sku} | {item.category || 'N/A'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(item.price * item.quantity)}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {item.quantity} × {formatCurrency(item.price)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(sale.subtotal)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(sale.discount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(sale.total)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-muted-foreground mt-8 text-center text-sm">
                <p>Thank you for shopping with us!</p>
                <p>Visit us again soon</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-center gap-4">
            <Button onClick={handlePrint} variant="outline">
              <IconPrinter className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>

            <Button onClick={handleThermalPrint} variant="outline">
              <IconPrinter className="mr-2 h-4 w-4" />
              Thermal Print
            </Button>

            <Button onClick={handleDownload} variant="outline">
              <IconDownload className="mr-2 h-4 w-4" />
              Download
            </Button>

            {sale.customerEmail && (
              <Button onClick={handleEmailReceipt} variant="outline">
                <IconMail className="mr-2 h-4 w-4" />
                Email Receipt
              </Button>
            )}

            <Button
              onClick={() => setShowPrinterConfig(true)}
              variant="outline"
            >
              <IconSettings className="mr-2 h-4 w-4" />
              Printer Config
            </Button>

            <Button onClick={onClose}>
              <IconReceipt className="mr-2 h-4 w-4" />
              Start New Sale
            </Button>
          </div>

          {/* Printer Configuration Dialog */}
          {showPrinterConfig && (
            <Dialog
              open={showPrinterConfig}
              onOpenChange={setShowPrinterConfig}
            >
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Xprinter XP 58 Configuration</DialogTitle>
                  <DialogDescription>
                    Configure your thermal printer connection settings.
                  </DialogDescription>
                </DialogHeader>
                <PrinterConfig onConfigChange={setPrinterConfig} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
