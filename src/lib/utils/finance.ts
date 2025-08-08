import { prisma } from '@/lib/db';

// ===== TYPE DEFINITIONS =====

export interface FinancialTransactionData {
  id: number;
  type: 'INCOME' | 'EXPENSE';
  amount: number | string;
  transactionDate?: Date;
  description?: string;
  category?: {
    name: string;
  } | null;
  status: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  transactionCount: number;
}

export interface ReportPeriod {
  start: string;
  end: string;
}

export interface ProcessedTransactionData {
  id: number;
  date: Date | undefined;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string | undefined;
  category: string | undefined;
  status: string;
}

export interface ReportDataStructure {
  reportType: string;
  period: ReportPeriod;
  summary: FinancialSummary;
  transactions: ProcessedTransactionData[];
  generatedAt: string;
}



export interface ExportableData {
  [key: string]: string | number | boolean | Date | null | undefined;
}

/**
 * Generate a unique transaction number
 * Format: FIN-YYYYMMDD-XXXX (e.g., FIN-20241201-0001)
 */
export async function generateTransactionNumber(): Promise<string> {
  const today = new Date();
  const dateString = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `FIN-${dateString}`;

  // Get the count of transactions for today
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const endOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1
  );

  const count = await prisma.financialTransaction.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });

  // Format the sequence number with leading zeros
  const sequence = (count + 1).toString().padStart(4, '0');
  return `${prefix}-${sequence}`;
}

/**
 * Calculate net amount after tax deduction
 */
export function calculateNetAmount(
  amount: number,
  taxAmount: number = 0
): number {
  return amount - taxAmount;
}

/**
 * Calculate tax amount based on rate
 */
export function calculateTaxAmount(amount: number, taxRate: number): number {
  return (amount * taxRate) / 100;
}

/**
 * Format currency amount for display
 */
export function formatCurrency(
  amount: number | string | null | undefined
): string {
  if (amount === null || amount === undefined) return '₦0.00';

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '₦0.00';

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(numAmount);
}

/**
 * Get financial summary from transactions array
 */
export function getFinancialSummary(
  transactions: FinancialTransactionData[]
): FinancialSummary {
  const summary: FinancialSummary = {
    totalIncome: 0,
    totalExpense: 0,
    netAmount: 0,
    transactionCount: transactions.length,
  };

  transactions.forEach(transaction => {
    if (transaction.type === 'INCOME') {
      summary.totalIncome += Number(transaction.amount);
    } else {
      summary.totalExpense += Number(transaction.amount);
    }
  });

  summary.netAmount = summary.totalIncome - summary.totalExpense;
  return summary;
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Format percentage with sign
 */
export function formatPercentage(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Get date range for period type
 */
export function getDateRangeForPeriod(
  periodType: 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
  referenceDate: Date = new Date()
): { startDate: Date; endDate: Date } {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  switch (periodType) {
    case 'MONTHLY':
      return {
        startDate: new Date(year, month, 1),
        endDate: new Date(year, month + 1, 0),
      };
    case 'QUARTERLY':
      const quarter = Math.floor(month / 3);
      const quarterStartMonth = quarter * 3;
      return {
        startDate: new Date(year, quarterStartMonth, 1),
        endDate: new Date(year, quarterStartMonth + 3, 0),
      };
    case 'YEARLY':
      return {
        startDate: new Date(year, 0, 1),
        endDate: new Date(year, 11, 31),
      };
    default:
      throw new Error('Invalid period type');
  }
}

/**
 * Validate transaction amount
 */
export function validateTransactionAmount(amount: number): boolean {
  return amount > 0 && amount <= 999999999.99; // Max amount based on Decimal(15,2)
}

/**
 * Sanitize file upload URL
 */
export function sanitizeFileUrl(url: string | null | undefined): string | null {
  if (!url || url.trim() === '') return null;

  try {
    new URL(url);
    return url;
  } catch {
    return null;
  }
}

/**
 * Generate financial report data structure
 */
export function generateReportDataStructure(
  transactions: FinancialTransactionData[],
  reportType: string,
  periodStart: Date,
  periodEnd: Date
): ReportDataStructure {
  const summary = getFinancialSummary(transactions);

  return {
    reportType,
    period: {
      start: periodStart.toISOString(),
      end: periodEnd.toISOString(),
    },
    summary,
    transactions: transactions.map(
      (t): ProcessedTransactionData => ({
        id: t.id,
        date: t.transactionDate,
        type: t.type,
        amount: Number(t.amount),
        description: t.description,
        category: t.category?.name,
        status: t.status,
      })
    ),
    generatedAt: new Date().toISOString(),
  };
}



/**
 * Get status badge variant for financial transactions
 */
export function getStatusBadgeVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'COMPLETED':
    case 'APPROVED':
      return 'default';
    case 'PENDING':
      return 'secondary';
    case 'REJECTED':
    case 'CANCELLED':
      return 'destructive';
    default:
      return 'outline';
  }
}

/**
 * Get type badge variant for financial transactions
 */
export function getTypeBadgeVariant(
  type: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (type) {
    case 'INCOME':
      return 'default';
    case 'EXPENSE':
      return 'destructive';
    default:
      return 'outline';
  }
}

/**
 * Export financial data to CSV format
 */
export function exportToCSV(data: ExportableData[], filename: string): void {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers
        .map(header => {
          const value = row[header];
          // Handle values that need quotes (contain commas, quotes, or newlines)
          if (
            typeof value === 'string' &&
            (value.includes(',') || value.includes('"') || value.includes('\n'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(',')
    ),
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export financial data to JSON format
 */
export function exportToJSON(data: unknown, filename: string): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], {
    type: 'application/json;charset=utf-8;',
  });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Format date for export filenames
 */
export function formatDateForExport(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

/**
 * Generate export filename with date
 */
export function generateExportFilename(
  baseName: string,
  reportType?: string
): string {
  const date = formatDateForExport();
  const type = reportType
    ? `-${reportType.toLowerCase().replace(/\s+/g, '-')}`
    : '';
  return `${baseName}${type}-${date}`;
}
