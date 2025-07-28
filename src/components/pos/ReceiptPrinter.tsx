'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { IconPrinter, IconMail, IconLoader } from '@tabler/icons-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { logger } from '@/lib/logger';
import {
  generateThermalReceipt,
  createRawTextPrintWindow,
  downloadThermalReceiptAsText,
  ThermalReceiptData,
} from '@/lib/utils/thermal-receipt';

export interface ReceiptData {
  id: string;
  transactionNumber?: string;
  items: {
    id?: number;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    category?: string;
    brand?: string;
  }[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  staffName: string;
  timestamp: Date;
  notes?: string;
}

interface ReceiptPrinterProps {
  receiptData: ReceiptData;
  trigger?: React.ReactNode;
  showEmailOption?: boolean;
  showThermalOption?: boolean;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

const PAYMENT_METHOD_LABELS = {
  cash: 'Cash',
  pos: 'POS Machine',
  card: 'Card',
  bank_transfer: 'Bank Transfer',
  mobile_money: 'Mobile Money',
};

export function ReceiptPrinter({
  receiptData,
  trigger,
  showEmailOption = true,
  showThermalOption = true,
  size = 'sm',
  variant = 'outline',
}: ReceiptPrinterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentLabel =
    PAYMENT_METHOD_LABELS[
      receiptData.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS
    ] || receiptData.paymentMethod;

  // Format date and time
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Standard paper print
  const handleStandardPrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - ${receiptData.transactionNumber || receiptData.id}</title>
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
            <div>Receipt #${receiptData.transactionNumber || receiptData.id}</div>
          </div>
          
          <div class="receipt-details">
            <div>Date: ${formatDate(receiptData.timestamp)}</div>
            <div>Time: ${formatTime(receiptData.timestamp)}</div>
            <div>Staff: ${receiptData.staffName}</div>
            ${receiptData.customerName ? `<div>Customer: ${receiptData.customerName}</div>` : ''}
            ${receiptData.customerPhone ? `<div>Phone: ${receiptData.customerPhone}</div>` : ''}
          </div>
          
          <div class="items">
            ${receiptData.items
              .map(
                item => `
              <div class="item">
                <div class="item-name">${item.name}</div>
                <div class="item-details">
                  SKU: ${item.sku} | Qty: ${item.quantity} | Price: ${formatCurrency(item.price)}
                </div>
                <div>Total: ${formatCurrency(item.price * item.quantity)}</div>
              </div>
            `
              )
              .join('')}
          </div>
          
          <div class="totals">
            <div class="total-line">
              <span>Subtotal:</span>
              <span>${formatCurrency(receiptData.subtotal)}</span>
            </div>
            ${
              receiptData.discount > 0
                ? `
              <div class="total-line">
                <span>Discount:</span>
                <span>-${formatCurrency(receiptData.discount)}</span>
              </div>
            `
                : ''
            }
            <div class="total-line grand-total">
              <span>Total:</span>
              <span>${formatCurrency(receiptData.total)}</span>
            </div>
            <div class="total-line">
              <span>Payment Method:</span>
              <span>${paymentLabel}</span>
            </div>
          </div>
          
          ${
            receiptData.notes
              ? `
          <div style="margin-top: 20px;">
            <div><strong>Notes:</strong></div>
            <div>${receiptData.notes}</div>
          </div>`
              : ''
          }
          
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
      toast.success('Receipt sent to printer');
    }
  };

  // Thermal printer receipt (58mm thermal printer format)
  const handleThermalPrint = async () => {
    setIsProcessing(true);
    try {
      // Convert ReceiptData to ThermalReceiptData format
      const thermalData: ThermalReceiptData = {
        id: receiptData.id,
        transactionNumber: receiptData.transactionNumber,
        items: receiptData.items.map(item => ({
          name: item.name,
          sku: item.sku,
          price: item.price,
          quantity: item.quantity,
        })),
        subtotal: receiptData.subtotal,
        discount: receiptData.discount,
        total: receiptData.total,
        paymentMethod: receiptData.paymentMethod,
        customerName: receiptData.customerName,
        customerPhone: receiptData.customerPhone,
        staffName: receiptData.staffName,
        timestamp: receiptData.timestamp,
        notes: receiptData.notes,
      };

      // Generate plain text receipt for thermal printer
      const thermalReceipt = generateThermalReceipt(thermalData);

      // Try the raw text approach first (most likely to work)
      try {
        createRawTextPrintWindow(thermalReceipt);
        toast.success('Thermal receipt sent to printer');
      } catch (_error) {
        // Fallback: Download as text file
        const filename = `receipt-${receiptData.transactionNumber || receiptData.id}`;
        downloadThermalReceiptAsText(thermalReceipt, filename);
        toast.success(
          'Receipt downloaded as text file. Open it and print to your thermal printer.'
        );
      }
    } catch (error) {
      logger.error('Error with thermal print', {
        transactionId: receiptData.id,
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error('Failed to print thermal receipt');
    } finally {
      setIsProcessing(false);
    }
  };

  // Email receipt
  const handleEmailReceipt = async () => {
    if (!receiptData.customerEmail) {
      toast.error('No customer email available');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/pos/email-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          saleId: receiptData.id,
          customerEmail: receiptData.customerEmail,
          customerName: receiptData.customerName,
          receiptData: {
            items: receiptData.items.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              total: item.price * item.quantity,
            })),
            subtotal: receiptData.subtotal,
            discount: receiptData.discount,
            total: receiptData.total,
            paymentMethod: receiptData.paymentMethod,
            timestamp: receiptData.timestamp.toISOString(),
            staffName: receiptData.staffName,
          },
        }),
      });

      if (response.ok) {
        toast.success('Receipt sent successfully!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send receipt');
      }
    } catch (error) {
      logger.error('Error sending receipt', {
        transactionId: receiptData.id,
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error('Failed to send receipt');
    } finally {
      setIsProcessing(false);
    }
  };

  const defaultTrigger = (
    <Button
      variant={variant}
      size={size}
      onClick={() => setIsOpen(true)}
      disabled={isProcessing}
    >
      {isProcessing ? (
        <IconLoader className="h-4 w-4 animate-spin" />
      ) : (
        <IconPrinter className="h-4 w-4" />
      )}
    </Button>
  );

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>{trigger}</div>
      ) : (
        defaultTrigger
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Print Receipt</DialogTitle>
            <DialogDescription>
              Choose how you want to print the receipt for transaction{' '}
              {receiptData.transactionNumber || receiptData.id}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* Standard Print */}
            <Button
              onClick={handleStandardPrint}
              className="w-full justify-start"
              variant="outline"
              disabled={isProcessing}
            >
              <IconPrinter className="mr-2 h-4 w-4" />
              Standard Print (Paper)
            </Button>

            {/* Thermal Print */}
            {showThermalOption && (
              <Button
                onClick={handleThermalPrint}
                className="w-full justify-start"
                variant="outline"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <IconPrinter className="mr-2 h-4 w-4" />
                )}
                Thermal Print (Receipt Printer)
              </Button>
            )}

            {/* Email Receipt */}
            {showEmailOption && receiptData.customerEmail && (
              <Button
                onClick={handleEmailReceipt}
                className="w-full justify-start"
                variant="outline"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <IconMail className="mr-2 h-4 w-4" />
                )}
                Email to {receiptData.customerEmail}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
