import { z } from 'zod';
import { CURRENCY } from '@/lib/constants';

/**
 * Price validation schema for Naira currency
 * Ensures prices are positive, have proper decimal places, and are within reasonable bounds
 */
export const nairaPriceSchema = z
  .number()
  .positive('Price must be positive')
  .min(0.01, 'Price must be at least ₦0.01')
  .max(1000000000, 'Price cannot exceed ₦1,000,000,000')
  .multipleOf(0.01, 'Price must have at most 2 decimal places')
  .refine(
    price => {
      // Ensure price is a reasonable amount for Nigerian market
      return price >= 0.01 && price <= 1000000000;
    },
    {
      message: 'Price must be between ₦0.01 and ₦1,000,000,000',
    }
  );

/**
 * Optional price schema for nullable price fields
 */
export const optionalNairaPriceSchema = nairaPriceSchema.optional().nullable();

/**
 * Cost price schema (can be 0 for free items)
 */
export const costPriceSchema = z
  .number()
  .min(0, 'Cost cannot be negative')
  .max(1000000000, 'Cost cannot exceed ₦1,000,000,000')
  .multipleOf(0.01, 'Cost must have at most 2 decimal places');

/**
 * Sale price schema (must be less than or equal to regular price)
 */
export const salePriceSchema = z
  .number()
  .positive('Sale price must be positive')
  .max(1000000000, 'Sale price cannot exceed ₦1,000,000,000')
  .multipleOf(0.01, 'Sale price must have at most 2 decimal places');

/**
 * Discount amount schema
 */
export const discountAmountSchema = z
  .number()
  .min(0, 'Discount cannot be negative')
  .max(1000000000, 'Discount cannot exceed ₦1,000,000,000')
  .multipleOf(0.01, 'Discount must have at most 2 decimal places');

/**
 * Percentage schema for discounts
 */
export const percentageSchema = z
  .number()
  .min(0, 'Percentage cannot be negative')
  .max(100, 'Percentage cannot exceed 100%')
  .multipleOf(0.01, 'Percentage must have at most 2 decimal places');

/**
 * Validate that sale price is less than or equal to regular price
 */
export const validateSalePrice = (
  salePrice: number,
  regularPrice: number
): boolean => {
  return salePrice <= regularPrice;
};

/**
 * Create a sale price schema that validates against regular price
 */
export const createSalePriceSchema = (regularPrice: number) =>
  salePriceSchema.refine(price => validateSalePrice(price, regularPrice), {
    message: `Sale price must be less than or equal to regular price (₦${regularPrice.toLocaleString()})`,
  });

/**
 * Format price for display in Naira
 */
export const formatNairaPrice = (price: number): string => {
  return `${CURRENCY.SYMBOL}${price.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Parse price string to number, handling Naira symbol and formatting
 */
export const parseNairaPrice = (priceString: string): number => {
  // Remove Naira symbol and any non-numeric characters except decimal point
  const cleaned = priceString.replace(/[₦,]/g, '').replace(/[^\d.]/g, '');

  const parsed = parseFloat(cleaned);

  if (isNaN(parsed)) {
    throw new Error('Invalid price format');
  }

  return parsed;
};

/**
 * Validate price range for bulk operations
 */
export const validatePriceRange = (
  minPrice: number,
  maxPrice: number
): boolean => {
  return minPrice >= 0 && maxPrice >= minPrice && maxPrice <= 1000000000;
};

/**
 * Price validation error messages
 */
export const PRICE_ERROR_MESSAGES = {
  INVALID_FORMAT: 'Price must be a valid number',
  TOO_SMALL: 'Price must be at least ₦0.01',
  TOO_LARGE: 'Price cannot exceed ₦1,000,000,000',
  INVALID_DECIMALS: 'Price must have at most 2 decimal places',
  NEGATIVE: 'Price cannot be negative',
  SALE_PRICE_TOO_HIGH: 'Sale price cannot be higher than regular price',
  INVALID_PERCENTAGE: 'Percentage must be between 0% and 100%',
} as const;

/**
 * Price validation utilities for forms
 */
export const priceValidationUtils = {
  /**
   * Validate price input in real-time
   */
  validatePriceInput: (value: string): { isValid: boolean; error?: string } => {
    if (!value.trim()) {
      return { isValid: false, error: PRICE_ERROR_MESSAGES.INVALID_FORMAT };
    }

    try {
      const price = parseNairaPrice(value);

      if (price < 0.01) {
        return { isValid: false, error: PRICE_ERROR_MESSAGES.TOO_SMALL };
      }

      if (price > 1000000000) {
        return { isValid: false, error: PRICE_ERROR_MESSAGES.TOO_LARGE };
      }

      // Check decimal places
      const decimalPlaces = value.split('.')[1]?.length || 0;
      if (decimalPlaces > 2) {
        return { isValid: false, error: PRICE_ERROR_MESSAGES.INVALID_DECIMALS };
      }

      return { isValid: true };
    } catch {
      return { isValid: false, error: PRICE_ERROR_MESSAGES.INVALID_FORMAT };
    }
  },

  /**
   * Format price for input field
   */
  formatForInput: (price: number): string => {
    return price.toFixed(2);
  },

  /**
   * Format price for display
   */
  formatForDisplay: (price: number): string => {
    return formatNairaPrice(price);
  },
} as const;
