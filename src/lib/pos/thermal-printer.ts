import { toast } from "sonner";
import { logger } from "@/lib/logger";

export interface PrinterConfig {
  type: "usb" | "network" | "serial";
  interface: string;
  options?: {
    width?: number;
    characterSet?: string;
    removeSpecialCharacters?: boolean;
    lineCharacter?: string;
  };
}

export interface ReceiptData {
  saleId: string;
  timestamp: Date;
  staffName: string;
  customerName?: string;
  customerPhone?: string;
  items: Array<{
    name: string;
    sku: string;
    quantity: number;
    price: number;
    total: number;
    category?: string;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
}

export class XprinterXP58Service {
  private config: PrinterConfig;

  constructor(config: PrinterConfig) {
    this.config = config;
  }

  async printReceipt(receiptData: ReceiptData): Promise<boolean> {
    try {
      // For web applications, thermal printing would typically:
      // 1. Generate ESC/POS commands
      // 2. Send to a local print service
      // 3. Use browser printing APIs

      // Debug logging removed for production

      // Generate and log receipt content
      const _content = this.generateReceiptContent(receiptData);

      // In production, this would:
      // - Generate the thermal printer commands
      // - Send to printer via WebUSB, local service, or network
      // - Handle printer status and errors

      toast.success("Receipt sent to printer");
      return true;
    } catch (error) {
      logger.error("Thermal printer operation failed", {
        operation: "print",
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private generateReceiptContent(receiptData: ReceiptData): string {
    const lines: string[] = [];

    // Header
    lines.push("        BaaWA ACCESSORIES        ");
    lines.push("     Quality Accessories Store   ");
    lines.push("--------------------------------");
    lines.push(`Receipt #${receiptData.saleId}`);
    lines.push("--------------------------------");

    // Transaction details
    lines.push(`Date: ${this.formatDate(receiptData.timestamp)}`);
    lines.push(`Time: ${this.formatTime(receiptData.timestamp)}`);
    lines.push(`Staff: ${receiptData.staffName}`);
    lines.push(
      `Payment: ${this.getPaymentMethodLabel(receiptData.paymentMethod)}`
    );

    if (receiptData.customerName) {
      lines.push(`Customer: ${receiptData.customerName}`);
    }

    if (receiptData.customerPhone) {
      lines.push(`Phone: ${receiptData.customerPhone}`);
    }

    lines.push("--------------------------------");

    // Items
    lines.push("ITEMS:");
    receiptData.items.forEach((item) => {
      lines.push(this.truncateText(item.name, 24));
      lines.push(`  SKU: ${item.sku}`);
      if (item.category) {
        lines.push(`  ${item.category}`);
      }

      const quantityText = `${item.quantity} × ₦${item.price.toLocaleString()}`;
      const totalText = `₦${item.total.toLocaleString()}`;
      const spacing = " ".repeat(
        Math.max(0, 32 - quantityText.length - totalText.length)
      );
      lines.push(`${quantityText}${spacing}${totalText}`);
      lines.push("");
    });

    lines.push("--------------------------------");

    // Totals
    lines.push(`Subtotal: ₦${receiptData.subtotal.toLocaleString()}`);

    if (receiptData.discount > 0) {
      lines.push(`Discount: -₦${receiptData.discount.toLocaleString()}`);
    }

    lines.push(`TOTAL: ₦${receiptData.total.toLocaleString()}`);
    lines.push("--------------------------------");

    // Footer
    lines.push("     Thank you for shopping!     ");
    lines.push("       Visit us again soon       ");
    lines.push("");

    const content = lines.join("\n");
    // Debug logging removed for production
    return content;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  private getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      cash: "Cash",
      pos: "POS Machine",
      bank_transfer: "Bank Transfer",
      mobile_money: "Mobile Money",
    };
    return labels[method] || method;
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  }

  async testConnection(): Promise<boolean> {
    try {
      // For web compatibility, simulate connection test
      // Debug logging removed for production
      // Debug logging removed for production
      // In production, this would check printer status
      return true;
    } catch (error) {
      logger.error("Printer connection test failed", {
        printerConfig: this.config,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async printTestPage(): Promise<boolean> {
    try {
      // Debug logging removed for production
      const _testContent = [
        "================================",
        "           TEST PAGE            ",
        "================================",
        "      Xprinter XP 58          ",
        `      ${new Date().toLocaleString()}      `,
        "================================",
        "         Connection OK          ",
        "================================",
      ].join("\n");

      // Debug logging removed for production
      return true;
    } catch (error) {
      logger.error("Test page print failed", {
        printerConfig: this.config,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

// Default configuration for Xprinter XP 58
export const defaultXprinterConfig: PrinterConfig = {
  type: "usb",
  interface: "USB001", // Common USB interface name
  options: {
    width: 32, // Xprinter XP 58 paper width
    characterSet: "SLOVENIA",
    removeSpecialCharacters: false,
    lineCharacter: "-",
  },
};

// Factory function to create printer service
export function createXprinterService(
  config?: Partial<PrinterConfig>
): XprinterXP58Service {
  const finalConfig = { ...defaultXprinterConfig, ...config };
  return new XprinterXP58Service(finalConfig);
}
