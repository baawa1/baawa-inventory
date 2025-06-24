import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
  const options: Intl.NumberFormatOptions = {
    style: "currency",
    currency: "NGN",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  };

  // Format using Nigerian locale for proper comma separators
  const formatted = new Intl.NumberFormat("en-NG", options).format(amount);

  // Replace NGN symbol with ₦ for consistency
  return formatted.replace("NGN", "₦").replace("₦ ", "₦");
}
