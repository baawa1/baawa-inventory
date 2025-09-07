import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { prisma } from '@/lib/db';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the current app base URL
 * Uses NEXT_PUBLIC_APP_URL environment variable with fallback to localhost
 * @returns The current app base URL
 */
export function getAppBaseUrl(): string {
  // Use environment variable if available
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Fallback for development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  // Production fallback
  return 'https://pos.baawa.ng';
}

/**
 * Format a number as Nigerian Naira currency with proper comma separators
 * @param amount - The amount to format
 * @param showDecimals - Whether to show decimal places (default: true)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  showDecimals: boolean = true
): string {
  // Handle NaN, null, undefined, Infinity, or -Infinity values
  if (amount === null || amount === undefined || isNaN(amount) || !isFinite(amount)) {
    return '₦0.00';
  }

  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'NGN',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  };

  // Format using Nigerian locale for proper comma separators
  const formatted = new Intl.NumberFormat('en-NG', options).format(amount);

  // Replace NGN symbol with ₦ for consistency
  return formatted.replace('NGN', '₦').replace('₦ ', '₦');
}

/**
 * Format a date string or Date object into a readable format
 * @param date - Date string, Date object, or timestamp
 * @param options - Formatting options
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date | number,
  options?: {
    includeTime?: boolean;
    dateStyle?: 'short' | 'medium' | 'long' | 'full';
    timeStyle?: 'short' | 'medium' | 'long' | 'full';
  }
): string {
  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const {
    includeTime = true,
    dateStyle = 'medium',
    timeStyle = 'short',
  } = options || {};

  if (includeTime) {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle,
      timeStyle,
    }).format(dateObj);
  } else {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle,
    }).format(dateObj);
  }
}

/**
 * Format a date as a relative time string (e.g., "2 hours ago", "3 days ago")
 * @param date - Date string, Date object, or timestamp
 * @returns Relative time string
 */
export function formatRelativeTime(date: string | Date | number): string {
  const dateObj = new Date(date);
  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  } else {
    return formatDate(date, { includeTime: false });
  }
}

/**
 * Truncate a product name to a specified length with ellipsis
 * @param name - The product name to truncate
 * @param maxLength - Maximum length (default: 30)
 * @returns Truncated product name with ellipsis if needed
 */
export function truncateProductName(name: string, maxLength: number = 30): string {
  if (!name || typeof name !== 'string') {
    return '';
  }
  
  const trimmedName = name.trim();
  if (trimmedName.length <= maxLength) {
    return trimmedName;
  }
  
  return `${trimmedName.substring(0, maxLength - 3)}...`;
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
