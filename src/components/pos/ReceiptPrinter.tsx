"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  IconPrinter,
  IconMail,
  IconSettings,
  IconLoader,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { PrinterConfig } from "./PrinterConfig";
import { formatCurrency } from "@/lib/utils";
import { logger } from "@/lib/logger";

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
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
}

interface ValidationDetail {
  message: string;
}

const PAYMENT_METHOD_LABELS = {
  cash: "Cash",
  pos: "POS Machine",
  card: "Card",
  bank_transfer: "Bank Transfer",
  mobile_money: "Mobile Money",
};

export function ReceiptPrinter({
  receiptData,
  trigger,
  showEmailOption = true,
  showThermalOption = true,
  size = "sm",
  variant = "outline",
}: ReceiptPrinterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPrinterConfig, setShowPrinterConfig] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [printerConfig, setPrinterConfig] = useState({
    type: "usb" as const,
    interface: "USB001",
    options: {
      width: 32,
      characterSet: "SLOVENIA",
      removeSpecialCharacters: false,
      lineCharacter: "-",
    },
  });

  const paymentLabel =
    PAYMENT_METHOD_LABELS[
      receiptData.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS
    ] || receiptData.paymentMethod;

  // Format date and time
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Standard paper print
  const handleStandardPrint = () => {
    const printWindow = window.open("", "_blank");
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
            <div><strong>Date:</strong> ${formatDate(receiptData.timestamp)}</div>
            <div><strong>Time:</strong> ${formatTime(receiptData.timestamp)}</div>
            <div><strong>Staff:</strong> ${receiptData.staffName}</div>
            <div><strong>Payment:</strong> ${paymentLabel}</div>
            
            ${receiptData.customerName ? `<div><strong>Customer:</strong> ${receiptData.customerName}</div>` : ""}
            ${receiptData.customerPhone ? `<div><strong>Phone:</strong> ${receiptData.customerPhone}</div>` : ""}
          </div>
          
          <div class="items">
            ${receiptData.items
              .map(
                (item) => `
              <div class="item">
                <div class="item-name">${item.name}</div>
                <div class="item-details">SKU: ${item.sku} | ${item.category || "N/A"}</div>
                <div class="total-line">
                  <span>${item.quantity} × ${formatCurrency(item.price)}</span>
                  <span>${formatCurrency(item.price * item.quantity)}</span>
                </div>
              </div>
            `
              )
              .join("")}
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
            </div>`
                : ""
            }
            <div class="total-line grand-total">
              <span>TOTAL:</span>
              <span>${formatCurrency(receiptData.total)}</span>
            </div>
          </div>
          
          ${
            receiptData.notes
              ? `
          <div style="margin-top: 20px;">
            <div><strong>Notes:</strong></div>
            <div>${receiptData.notes}</div>
          </div>`
              : ""
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
      toast.success("Receipt sent to printer");
    }
  };

  // Thermal printer receipt
  const handleThermalPrint = async () => {
    setIsProcessing(true);
    try {
      const requestData = {
        saleId: receiptData.id,
        timestamp: receiptData.timestamp.toISOString(),
        staffName: receiptData.staffName,
        customerName: receiptData.customerName,
        customerPhone: receiptData.customerPhone,
        items: receiptData.items.map((item) => ({
          name: item.name,
          sku: item.sku || `SKU-${item.id}`, // Ensure SKU is always present
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
          category: item.category,
        })),
        subtotal: receiptData.subtotal,
        discount: receiptData.discount,
        total: receiptData.total,
        paymentMethod: receiptData.paymentMethod,
        printerConfig,
      };

      logger.info("Receipt print request", {
        transactionId: receiptData.id,
        customerName: receiptData.customerName,
        totalAmount: receiptData.total,
      });

      const response = await fetch("/api/pos/print-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        toast.success("Receipt printed on thermal printer!");
      } else {
        const error = await response.json();
        logger.error("Receipt print error", {
          transactionId: receiptData.id,
          error: error.error || "Failed to print receipt",
          details: error.details,
        });

        // Show detailed validation errors for debugging
        if (error.details && Array.isArray(error.details)) {
          logger.error("Receipt validation errors", {
            transactionId: receiptData.id,
            errors: error.details,
          });
          toast.error(
            `Validation error: ${error.details.map((d: ValidationDetail) => d.message).join(", ")}`
          );
        } else {
          toast.error(error.error || "Failed to print receipt");
        }
      }
    } catch (error) {
      logger.error("Error printing receipt", {
        transactionId: receiptData.id,
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error("Failed to print receipt");
    } finally {
      setIsProcessing(false);
    }
  };

  // Email receipt
  const handleEmailReceipt = async () => {
    if (!receiptData.customerEmail) {
      toast.error("No customer email available");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch("/api/pos/email-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          saleId: receiptData.id,
          transactionNumber: receiptData.transactionNumber,
          customerEmail: receiptData.customerEmail,
          customerName: receiptData.customerName,
        }),
      });

      if (response.ok) {
        toast.success("Receipt sent successfully!");
      } else {
        const error = await response.json();
        logger.error("Receipt email sending failed", {
          transactionId: receiptData.id,
          customerEmail: receiptData.customerEmail,
          error: error.error || "Failed to send receipt email",
        });
        toast.error("Failed to send receipt");
      }
    } catch (error) {
      logger.error("Error sending receipt", {
        transactionId: receiptData.id,
        customerEmail: receiptData.customerEmail,
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error("Failed to send receipt");
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
              Choose how you want to print the receipt for transaction{" "}
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
              <IconPrinter className="h-4 w-4 mr-2" />
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
                  <IconLoader className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <IconPrinter className="h-4 w-4 mr-2" />
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
                  <IconLoader className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <IconMail className="h-4 w-4 mr-2" />
                )}
                Email to {receiptData.customerEmail}
              </Button>
            )}

            {/* Printer Configuration */}
            {showThermalOption && (
              <Button
                onClick={() => setShowPrinterConfig(true)}
                className="w-full justify-start"
                variant="outline"
                disabled={isProcessing}
              >
                <IconSettings className="h-4 w-4 mr-2" />
                Printer Settings
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Printer Configuration Dialog */}
      {showPrinterConfig && (
        <Dialog open={showPrinterConfig} onOpenChange={setShowPrinterConfig}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Thermal Printer Configuration</DialogTitle>
              <DialogDescription>
                Configure your thermal printer connection settings.
              </DialogDescription>
            </DialogHeader>
            <PrinterConfig onConfigChange={setPrinterConfig} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
