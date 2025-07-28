import { logger } from '@/lib/logger';
import {
  ThermalPrinter,
  PrinterTypes,
  CharacterSet,
} from 'node-thermal-printer';

// Type declarations for escpos modules
declare module 'escpos' {
  export class Printer {
    constructor(device: any);
    font(font: string): this;
    align(alignment: string): this;
    style(style: string): this;
    size(width: number, height: number): this;
    text(text: string): this;
    drawLine(): this;
    cut(): this;
    close(): Promise<void>;
  }
}

declare module 'escpos-usb' {
  export function findPrinter(): Array<{
    deviceDescriptor: {
      idProduct: number;
    };
  }>;
}

declare module 'escpos-network' {
  export default class NetworkDevice {
    constructor(ip: string, port: number);
  }
}

// Dynamic imports for native modules
let escpos: any;
let escposUSB: any;
let escposNetwork: any;

// Try to load native modules
try {
  escpos = require('escpos');
  escposUSB = require('escpos-usb');
  escposNetwork = require('escpos-network');
} catch (error) {
  logger.warn('Native thermal printer modules not available', {
    error: error instanceof Error ? error.message : String(error),
    note: 'This is normal in web environments. Native modules require proper installation.',
  });
}

export interface PrinterConfig {
  type: 'usb' | 'network' | 'serial';
  interface: string;
  options?: {
    width?: number;
    characterSet?: string;
    removeSpecialCharacters?: boolean;
    lineCharacter?: string;
    ip?: string;
    port?: number;
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
  private printer: any;

  constructor(config: PrinterConfig) {
    this.config = config;
  }

  async printReceipt(receiptData: ReceiptData): Promise<boolean> {
    try {
      logger.info('Starting thermal print operation', {
        saleId: receiptData.saleId,
        printerConfig: this.config,
      });

      // Check if native modules are available
      if (!escpos || !escposUSB || !escposNetwork) {
        logger.warn('Native modules not available, using fallback mode');
        return this.printReceiptFallback(receiptData);
      }

      // Initialize printer based on configuration
      await this.initializePrinter();

      if (!this.printer) {
        throw new Error('Failed to initialize printer');
      }

      // Generate receipt content
      const content = this.generateReceiptContent(receiptData);

      // Print using the appropriate method
      if (this.config.type === 'network') {
        await this.printToNetworkPrinter(content);
      } else {
        await this.printToLocalPrinter(content);
      }

      logger.info('Receipt printed successfully', {
        saleId: receiptData.saleId,
        contentLength: content.length,
      });

      return true;
    } catch (error) {
      logger.error('Thermal printer operation failed', {
        operation: 'print',
        saleId: receiptData.saleId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Fallback to web printing if native modules fail
      if (error instanceof Error && error.message.includes('native build')) {
        logger.info('Falling back to web printing mode');
        return this.printReceiptFallback(receiptData);
      }

      throw error;
    }
  }

  private async printReceiptFallback(
    receiptData: ReceiptData
  ): Promise<boolean> {
    try {
      logger.info('Using fallback printing mode', {
        saleId: receiptData.saleId,
      });

      // Generate receipt content
      const content = this.generateReceiptContent(receiptData);

      // In web environments, we can:
      // 1. Show the receipt content in a new window for printing
      // 2. Download as a text file
      // 3. Send to a local print service (if available)

      // For now, we'll log the content and return success
      logger.info('Receipt content (fallback mode)', {
        saleId: receiptData.saleId,
        content,
      });

      // Show receipt in browser window for manual printing
      if (typeof window !== 'undefined') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const receiptHTML = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>Receipt - ${receiptData.saleId}</title>
              <style>
                body { 
                  font-family: monospace; 
                  font-size: 12px; 
                  line-height: 1.4; 
                  margin: 20px; 
                  white-space: pre-wrap;
                }
                .receipt { 
                  border: 1px solid #ccc; 
                  padding: 20px; 
                  max-width: 400px; 
                  margin: 0 auto;
                }
                @media print { 
                  body { margin: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              <div class="receipt">
                ${content.replace(/\n/g, '<br>')}
              </div>
              <div class="no-print" style="margin-top: 20px; text-align: center;">
                <button onclick="window.print()">Print Receipt</button>
                <button onclick="window.close()">Close</button>
              </div>
            </body>
            </html>
          `;

          printWindow.document.write(receiptHTML);
          printWindow.document.close();
        }
      }

      return true;
    } catch (error) {
      logger.error('Fallback printing failed', {
        saleId: receiptData.saleId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async initializePrinter(): Promise<void> {
    try {
      if (!escpos || !escposUSB || !escposNetwork) {
        throw new Error('Native modules not available');
      }

      if (this.config.type === 'network') {
        await this.initializeNetworkPrinter();
      } else if (this.config.type === 'usb') {
        await this.initializeUSBPrinter();
      } else {
        await this.initializeSerialPrinter();
      }
    } catch (error) {
      logger.error('Failed to initialize printer', {
        config: this.config,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async initializeNetworkPrinter(): Promise<void> {
    try {
      const device = new escposNetwork(
        this.config.options?.ip || '192.168.1.100',
        this.config.options?.port || 9100
      );
      this.printer = new escpos.Printer(device);

      logger.info('Network printer initialized', {
        ip: this.config.options?.ip,
        port: this.config.options?.port,
      });
    } catch (error) {
      logger.error('Failed to initialize network printer', {
        config: this.config,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async initializeUSBPrinter(): Promise<void> {
    try {
      // Try to find USB printer
      const devices = escposUSB.findPrinter();

      if (devices.length === 0) {
        throw new Error('No USB printers found');
      }

      // Use the first available USB printer or match by interface name
      let device;
      if (this.config.interface && this.config.interface !== 'USB001') {
        device = devices.find(
          (d: any) =>
            d.deviceDescriptor.idProduct.toString() === this.config.interface
        );
      }

      if (!device) {
        device = devices[0];
      }

      this.printer = new escpos.Printer(device);

      logger.info('USB printer initialized', {
        interface: this.config.interface,
        deviceId: device.deviceDescriptor.idProduct,
      });
    } catch (error) {
      logger.error('Failed to initialize USB printer', {
        config: this.config,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async initializeSerialPrinter(): Promise<void> {
    try {
      // For serial printers, we'll use a fallback approach
      logger.warn('Serial printer support is limited, using fallback');
      this.printer = null;
    } catch (error) {
      logger.error('Failed to initialize serial printer', {
        config: this.config,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async printToNetworkPrinter(content: string): Promise<void> {
    if (!this.printer) {
      throw new Error('Network printer not initialized');
    }

    return new Promise((resolve, reject) => {
      this.printer
        .font('a')
        .align('center')
        .style('b')
        .size(1, 1)
        .text('BaaWA ACCESSORIES')
        .text('Quality Accessories Store')
        .drawLine()
        .align('left')
        .style('normal')
        .size(0, 0)
        .text(`Receipt #${content.split('\n')[3]}`)
        .drawLine()
        .text(content)
        .drawLine()
        .align('center')
        .text('Thank you for shopping!')
        .text('Visit us again soon')
        .cut()
        .close()
        .then(() => resolve())
        .catch(reject);
    });
  }

  private async printToLocalPrinter(content: string): Promise<void> {
    if (!this.printer) {
      // Fallback to node-thermal-printer for local printing
      await this.printWithNodeThermalPrinter(content);
      return;
    }

    return new Promise((resolve, reject) => {
      this.printer
        .font('a')
        .align('center')
        .style('b')
        .size(1, 1)
        .text('BaaWA ACCESSORIES')
        .text('Quality Accessories Store')
        .drawLine()
        .align('left')
        .style('normal')
        .size(0, 0)
        .text(`Receipt #${content.split('\n')[3]}`)
        .drawLine()
        .text(content)
        .drawLine()
        .align('center')
        .text('Thank you for shopping!')
        .text('Visit us again soon')
        .cut()
        .close()
        .then(() => resolve())
        .catch(reject);
    });
  }

  private async printWithNodeThermalPrinter(content: string): Promise<void> {
    try {
      const printer = new ThermalPrinter({
        type: PrinterTypes.EPSON,
        interface: this.config.interface,
        options: {
          timeout: 5000,
        },
        width: this.config.options?.width || 32,
        characterSet:
          (this.config.options?.characterSet as CharacterSet) || 'SLOVENIA',
        removeSpecialCharacters:
          this.config.options?.removeSpecialCharacters || false,
        lineCharacter: this.config.options?.lineCharacter || '-',
      });

      const lines = content.split('\n');

      await printer.alignCenter();
      await printer.bold(true);
      await printer.setTextSize(1, 1);
      await printer.println('BaaWA ACCESSORIES');
      await printer.println('Quality Accessories Store');
      await printer.drawLine();

      await printer.alignLeft();
      await printer.bold(false);
      await printer.setTextSize(0, 0);

      for (const line of lines) {
        if (line.trim()) {
          await printer.println(line);
        }
      }

      await printer.drawLine();
      await printer.alignCenter();
      await printer.println('Thank you for shopping!');
      await printer.println('Visit us again soon');
      await printer.cut();

      logger.info('Printed using node-thermal-printer', {
        interface: this.config.interface,
        contentLength: content.length,
      });
    } catch (error) {
      logger.error('Failed to print with node-thermal-printer', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private generateReceiptContent(receiptData: ReceiptData): string {
    const lines: string[] = [];

    // Header
    lines.push('        BaaWA ACCESSORIES        ');
    lines.push('     Quality Accessories Store   ');
    lines.push('--------------------------------');
    lines.push(`Receipt #${receiptData.saleId}`);
    lines.push('--------------------------------');

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

    lines.push('--------------------------------');

    // Items
    lines.push('ITEMS:');
    receiptData.items.forEach(item => {
      lines.push(this.truncateText(item.name, 24));
      lines.push(`  SKU: ${item.sku}`);
      if (item.category) {
        lines.push(`  ${item.category}`);
      }

      const quantityText = `${item.quantity} × ₦${item.price.toLocaleString()}`;
      const totalText = `₦${item.total.toLocaleString()}`;
      const spacing = ' '.repeat(
        Math.max(0, 32 - quantityText.length - totalText.length)
      );
      lines.push(`${quantityText}${spacing}${totalText}`);
      lines.push('');
    });

    lines.push('--------------------------------');

    // Totals
    lines.push(`Subtotal: ₦${receiptData.subtotal.toLocaleString()}`);

    if (receiptData.discount > 0) {
      lines.push(`Discount: -₦${receiptData.discount.toLocaleString()}`);
    }

    lines.push(`TOTAL: ₦${receiptData.total.toLocaleString()}`);
    lines.push('--------------------------------');

    // Footer
    lines.push('     Thank you for shopping!     ');
    lines.push('       Visit us again soon       ');
    lines.push('');

    const content = lines.join('\n');
    return content;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      cash: 'Cash',
      pos: 'POS Machine',
      bank_transfer: 'Bank Transfer',
      mobile_money: 'Mobile Money',
    };
    return labels[method] || method;
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  async testConnection(): Promise<boolean> {
    try {
      logger.info('Testing printer connection', {
        printerConfig: this.config,
      });

      // Check if native modules are available
      if (!escpos || !escposUSB || !escposNetwork) {
        logger.warn(
          'Native modules not available, connection test will use fallback'
        );
        return true; // Return true for fallback mode
      }

      // Try to initialize the printer
      await this.initializePrinter();

      if (this.config.type === 'network') {
        // For network printers, try to connect
        if (!this.printer) {
          throw new Error('Network printer not initialized');
        }
      } else if (this.config.type === 'usb') {
        // For USB printers, check if device is available
        if (!this.printer) {
          // Try node-thermal-printer as fallback
          const testPrinter = new ThermalPrinter({
            type: PrinterTypes.EPSON,
            interface: this.config.interface,
            options: {
              timeout: 3000,
            },
          });

          const isConnected = await testPrinter.isPrinterConnected();
          if (!isConnected) {
            throw new Error('USB printer not connected');
          }
        }
      }

      logger.info('Printer connection test successful');
      return true;
    } catch (error) {
      logger.error('Printer connection test failed', {
        printerConfig: this.config,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async printTestPage(): Promise<boolean> {
    try {
      logger.info('Printing test page', {
        printerConfig: this.config,
      });

      // Check if native modules are available
      if (!escpos || !escposUSB || !escposNetwork) {
        logger.warn('Native modules not available, using fallback test page');
        return this.printTestPageFallback();
      }

      await this.initializePrinter();

      const testContent = [
        '================================',
        '           TEST PAGE            ',
        '================================',
        '      Xprinter XP 58          ',
        `      ${new Date().toLocaleString()}      `,
        '================================',
        '         Connection OK          ',
        '================================',
      ].join('\n');

      if (this.config.type === 'network') {
        await this.printToNetworkPrinter(testContent);
      } else {
        await this.printToLocalPrinter(testContent);
      }

      logger.info('Test page printed successfully');
      return true;
    } catch (error) {
      logger.error('Test page print failed', {
        printerConfig: this.config,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async printCustomMessage(message: string): Promise<boolean> {
    try {
      logger.info('Printing custom message', {
        message,
        printerConfig: this.config,
      });

      // Check if native modules are available
      if (!escpos || !escposUSB || !escposNetwork) {
        logger.warn(
          'Native modules not available, using fallback custom message'
        );
        return this.printCustomMessageFallback(message);
      }

      await this.initializePrinter();

      const messageContent = [
        '================================',
        '         CUSTOM MESSAGE         ',
        '================================',
        `      ${message}      `,
        `      ${new Date().toLocaleString()}      `,
        '================================',
      ].join('\n');

      if (this.config.type === 'network') {
        await this.printToNetworkPrinter(messageContent);
      } else {
        await this.printToLocalPrinter(messageContent);
      }

      logger.info('Custom message printed successfully');
      return true;
    } catch (error) {
      logger.error('Custom message print failed', {
        message,
        printerConfig: this.config,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async printCustomMessageFallback(message: string): Promise<boolean> {
    try {
      const messageContent = [
        '================================',
        '         CUSTOM MESSAGE         ',
        '================================',
        `      ${message}      `,
        `      ${new Date().toLocaleString()}      `,
        '================================',
      ].join('\n');

      logger.info('Custom message content (fallback mode)', {
        content: messageContent,
      });

      // Show message in browser window
      if (typeof window !== 'undefined') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const messageHTML = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>Custom Message - Thermal Printer</title>
              <style>
                body { 
                  font-family: monospace; 
                  font-size: 12px; 
                  line-height: 1.4; 
                  margin: 20px; 
                  white-space: pre-wrap;
                }
                .message-page { 
                  border: 1px solid #ccc; 
                  padding: 20px; 
                  max-width: 400px; 
                  margin: 0 auto;
                }
                @media print { 
                  body { margin: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              <div class="message-page">
                ${messageContent.replace(/\n/g, '<br>')}
              </div>
              <div class="no-print" style="margin-top: 20px; text-align: center;">
                <button onclick="window.print()">Print Message</button>
                <button onclick="window.close()">Close</button>
              </div>
            </body>
            </html>
          `;

          printWindow.document.write(messageHTML);
          printWindow.document.close();
        }
      }

      return true;
    } catch (error) {
      logger.error('Fallback custom message failed', {
        message,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async printTestPageFallback(): Promise<boolean> {
    try {
      const testContent = [
        '================================',
        '           TEST PAGE            ',
        '================================',
        '      Xprinter XP 58          ',
        `      ${new Date().toLocaleString()}      `,
        '================================',
        '         Connection OK          ',
        '================================',
      ].join('\n');

      logger.info('Test page content (fallback mode)', {
        content: testContent,
      });

      // Show test page in browser window
      if (typeof window !== 'undefined') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const testHTML = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>Test Page - Thermal Printer</title>
              <style>
                body { 
                  font-family: monospace; 
                  font-size: 12px; 
                  line-height: 1.4; 
                  margin: 20px; 
                  white-space: pre-wrap;
                }
                .test-page { 
                  border: 1px solid #ccc; 
                  padding: 20px; 
                  max-width: 400px; 
                  margin: 0 auto;
                }
                @media print { 
                  body { margin: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              <div class="test-page">
                ${testContent.replace(/\n/g, '<br>')}
              </div>
              <div class="no-print" style="margin-top: 20px; text-align: center;">
                <button onclick="window.print()">Print Test Page</button>
                <button onclick="window.close()">Close</button>
              </div>
            </body>
            </html>
          `;

          printWindow.document.write(testHTML);
          printWindow.document.close();
        }
      }

      return true;
    } catch (error) {
      logger.error('Fallback test page failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Get available USB devices
  static getAvailableUSBDevices(): Array<{ id: string; name: string }> {
    try {
      if (!escposUSB) {
        logger.warn('USB module not available');
        return [];
      }

      const devices = escposUSB.findPrinter();
      return devices.map((device: any) => ({
        id: device.deviceDescriptor.idProduct.toString(),
        name: `USB Printer (${device.deviceDescriptor.idProduct})`,
      }));
    } catch (error) {
      logger.error('Failed to get USB devices', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  // Test network printer connection
  static async testNetworkPrinter(
    ip: string,
    port: number = 9100
  ): Promise<boolean> {
    try {
      if (!escposNetwork || !escpos) {
        logger.warn('Network printer modules not available');
        return false;
      }

      const device = new escposNetwork(ip, port);
      const printer = new escpos.Printer(device);

      // Try to send a simple command
      await printer.text('TEST').close();

      return true;
    } catch (error) {
      logger.error('Network printer test failed', {
        ip,
        port,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}

// Default configuration for Xprinter XP 58
export const defaultXprinterConfig: PrinterConfig = {
  type: 'usb',
  interface: 'USB001', // Common USB interface name
  options: {
    width: 32, // Xprinter XP 58 paper width
    characterSet: 'SLOVENIA',
    removeSpecialCharacters: false,
    lineCharacter: '-',
  },
};

// Factory function to create printer service
export function createXprinterService(
  config?: Partial<PrinterConfig>
): XprinterXP58Service {
  try {
    logger.info('Creating Xprinter service', { config });

    const finalConfig = { ...defaultXprinterConfig, ...config };

    logger.info('Final printer config', { finalConfig });

    const service = new XprinterXP58Service(finalConfig);

    logger.info('Xprinter service created successfully');
    return service;
  } catch (error) {
    logger.error('Failed to create Xprinter service', {
      config,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
