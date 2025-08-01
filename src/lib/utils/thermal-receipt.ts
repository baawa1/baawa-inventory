export interface ThermalReceiptData {
  id: string;
  transactionNumber?: string;
  items: {
    name: string;
    sku: string;
    price: number;
    quantity: number;
    coupon?: {
      code: string;
      name: string;
      type: string;
      value: number;
    } | null;
  }[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
  staffName: string;
  timestamp: Date;
  notes?: string;
}

/**
 * Generate plain text receipt for thermal printer (58mm width)
 * This avoids HTML/CSS that causes gibberish output on thermal printers
 */
export const generateThermalReceipt = (data: ThermalReceiptData): string => {
  const maxWidth = 32; // Characters that fit on 58mm thermal paper

  const center = (text: string) => {
    const padding = Math.max(0, Math.floor((maxWidth - text.length) / 2));
    return ' '.repeat(padding) + text;
  };

  const rightAlign = (text: string) => {
    const padding = Math.max(0, maxWidth - text.length);
    return ' '.repeat(padding) + text;
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
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

  let receipt = '';

  // Header
  receipt += center('BaaWA ACCESSORIES') + '\n';
  receipt += center('Quality Accessories Store') + '\n';
  receipt += center('─'.repeat(maxWidth)) + '\n';
  receipt += center(`Receipt #${data.transactionNumber || data.id}`) + '\n';
  receipt += '\n';

  // Transaction details
  receipt += `Date: ${formatDate(data.timestamp)}\n`;
  receipt += `Time: ${formatTime(data.timestamp)}\n`;
  receipt += `Staff: ${data.staffName}\n`;
  if (data.customerName) {
    receipt += `Customer: ${data.customerName}\n`;
  }
  if (data.customerPhone) {
    receipt += `Phone: ${data.customerPhone}\n`;
  }
  receipt += '\n';

  // Items
  receipt += '─'.repeat(maxWidth) + '\n';
  data.items.forEach((item, index) => {
    receipt += `${item.name}\n`;
    receipt += `SKU: ${item.sku}\n`;
    receipt += `Qty: ${item.quantity} × ${formatCurrency(item.price)}\n`;
    if (item.coupon) {
      receipt += `Coupon: ${item.coupon.code} (${item.coupon.name})\n`;
      const discountText =
        item.coupon.type === 'PERCENTAGE'
          ? `${item.coupon.value}% off`
          : `${formatCurrency(item.coupon.value)} off`;
      receipt += `Discount: ${discountText}\n`;
    }
    receipt += `${rightAlign(formatCurrency(item.price * item.quantity))}\n`;
    if (index < data.items.length - 1) {
      receipt += '─'.repeat(maxWidth) + '\n';
    }
  });
  receipt += '─'.repeat(maxWidth) + '\n';

  // Totals
  receipt += `Subtotal:${rightAlign(formatCurrency(data.subtotal))}\n`;
  if (data.discount > 0) {
    receipt += `Discount:${rightAlign(`-${formatCurrency(data.discount)}`)}\n`;
  }
  receipt += `TOTAL:${rightAlign(formatCurrency(data.total))}\n`;
  receipt += `Payment: ${data.paymentMethod}\n`;
  receipt += '\n';

  // Notes
  if (data.notes) {
    receipt += '─'.repeat(maxWidth) + '\n';
    receipt += `Notes: ${data.notes}\n`;
    receipt += '\n';
  }

  // Footer
  receipt += center('─'.repeat(maxWidth)) + '\n';
  receipt += center('Thank you for shopping with us!') + '\n';
  receipt += center('Visit us again soon') + '\n';
  receipt += '\n';
  receipt += center('.') + '\n';

  return receipt;
};

/**
 * Create HTML wrapper for thermal receipt printing
 * This ensures the receipt is formatted correctly for thermal printers
 */
export const createThermalReceiptHTML = (
  receiptText: string,
  title: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { 
          font-family: 'Courier New', monospace; 
          font-size: 10px; 
          line-height: 1.2; 
          margin: 0; 
          padding: 0;
          width: 58mm;
          max-width: 58mm;
          overflow: hidden;
        }
        pre { 
          margin: 0; 
          padding: 0; 
          white-space: pre-wrap; 
          word-wrap: break-word;
          font-family: 'Courier New', monospace;
          font-size: 10px;
          line-height: 1.2;
        }
        @media print { 
          body { margin: 0; padding: 0; }
          pre { margin: 0; padding: 0; }
        }
      </style>
    </head>
    <body>
      <pre>${receiptText}</pre>
    </body>
    </html>
  `;
};

/**
 * Create minimal HTML for thermal printing that avoids PostScript conversion
 * This uses the most basic HTML possible to prevent browser from adding PostScript
 */
export const createMinimalThermalHTML = (receiptText: string): string => {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:monospace;font-size:10px;margin:0;padding:0;width:58mm;max-width:58mm;"><pre style="margin:0;padding:0;white-space:pre-wrap;word-wrap:break-word;font-family:monospace;font-size:10px;line-height:1.2;">${receiptText}</pre></body></html>`;
};

/**
 * Alternative approach: Create a text-only print window
 * This bypasses HTML entirely and sends only text to the printer
 */
export const printThermalReceiptAsText = (receiptText: string) => {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    // Write only the text content, no HTML structure
    printWindow.document.write(receiptText);
    printWindow.document.close();

    // Set minimal styling directly on the document
    printWindow.document.body.style.fontFamily = 'monospace';
    printWindow.document.body.style.fontSize = '10px';
    printWindow.document.body.style.margin = '0';
    printWindow.document.body.style.padding = '0';
    printWindow.document.body.style.width = '58mm';
    printWindow.document.body.style.maxWidth = '58mm';
    printWindow.document.body.style.whiteSpace = 'pre-wrap';
    printWindow.document.body.style.wordWrap = 'break-word';
    printWindow.document.body.style.lineHeight = '1.2';

    printWindow.print();
    printWindow.close();
  }
};

/**
 * Create a downloadable text file for direct thermal printer use
 * This completely bypasses browser printing and creates a raw text file
 */
export const downloadThermalReceiptAsText = (
  receiptText: string,
  filename: string
) => {
  // Create a blob with the receipt text
  const blob = new Blob([receiptText], { type: 'text/plain;charset=utf-8' });

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.txt`;

  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
};

/**
 * Create a minimal HTML document that forces text-only printing
 * This uses the most basic approach possible to avoid PostScript
 */
export const createRawTextPrintWindow = (receiptText: string) => {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    // Create the most minimal HTML possible
    const minimalHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Receipt</title>
</head>
<body style="font-family:monospace;font-size:10px;margin:0;padding:0;width:58mm;max-width:58mm;">
${receiptText
  .split('\n')
  .map(line => `<div style="white-space:pre;margin:0;padding:0;">${line}</div>`)
  .join('')}
</body>
</html>`;

    printWindow.document.write(minimalHTML);
    printWindow.document.close();

    // Force immediate print without any browser processing
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 100);
  }
};
