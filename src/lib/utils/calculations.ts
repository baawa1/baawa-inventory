import type { CartItem } from '@/types/pos';

/**
 * Helper function to handle currency calculations with proper precision
 * Rounds to 2 decimal places to avoid floating-point precision issues
 */
export const roundCurrency = (amount: number): number => {
  return Math.round(amount * 100) / 100;
};

export interface OrderTotals {
  subtotal: number;
  discount: number;
  total: number;
}

/**
 * Calculate order totals consistently across all POS components
 */
export const calculateOrderTotals = (
  items: CartItem[],
  discount: number
): OrderTotals => {
  const subtotal = roundCurrency(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );
  const total = roundCurrency(Math.max(0, subtotal - discount));
  return { subtotal, discount, total };
};

/**
 * Calculate discount amount based on type and value
 */
export const calculateDiscountAmount = (
  subtotal: number,
  discountValue: number,
  discountType: 'percentage' | 'fixed'
): number => {
  if (discountType === 'percentage') {
    return roundCurrency(Math.min((subtotal * discountValue) / 100, subtotal));
  }
  return roundCurrency(Math.min(discountValue, subtotal));
};

/**
 * Validate payment amounts for different payment methods
 */
export const validatePaymentAmount = (
  amountPaid: number,
  total: number,
  paymentMethod: string
): { isValid: boolean; error?: string } => {
  if (amountPaid < 0) {
    return {
      isValid: false,
      error: 'Payment amount cannot be negative',
    };
  }

  if (paymentMethod === 'debt') {
    if (amountPaid > total) {
      return {
        isValid: false,
        error: 'Deposit cannot exceed total amount',
      };
    }
    return { isValid: true };
  }

  if (paymentMethod === 'cash' && amountPaid < total) {
    return {
      isValid: false,
      error: 'Insufficient payment amount',
    };
  }
  return { isValid: true };
};

/**
 * Calculate change amount for cash payments
 */
export const calculateChange = (amountPaid: number, total: number): number => {
  return roundCurrency(Math.max(0, amountPaid - total));
};

/**
 * Validate split payments
 */
export const validateSplitPayments = (
  splitPayments: Array<{ id: string; amount: number; method: string }>,
  total: number
): { isValid: boolean; error?: string } => {
  if (splitPayments.some(payment => payment.amount <= 0)) {
    return {
      isValid: false,
      error: 'Split payments must have positive amounts',
    };
  }

  const roundedTotal = roundCurrency(total);
  const tolerance = 0.01;

  const nonDebtTotal = roundCurrency(
    splitPayments
      .filter(payment => payment.method !== 'debt')
      .reduce((sum, payment) => sum + payment.amount, 0)
  );

  if (nonDebtTotal + tolerance < roundedTotal) {
    const hasDebtPayment = splitPayments.some(
      payment => payment.method === 'debt'
    );
    if (!hasDebtPayment) {
      return {
        isValid: false,
        error: 'Split payment total is less than the required amount',
      };
    }
  }

  if (nonDebtTotal - roundedTotal > tolerance) {
    return {
      isValid: false,
      error: 'Collected split payments exceed the total due',
    };
  }

  const expectedDebtPortion = roundCurrency(
    Math.max(0, roundedTotal - nonDebtTotal)
  );
  const declaredDebtPortion = roundCurrency(
    splitPayments
      .filter(payment => payment.method === 'debt')
      .reduce((sum, payment) => sum + payment.amount, 0)
  );

  if (
    splitPayments.some(payment => payment.method === 'debt') &&
    Math.abs(declaredDebtPortion - expectedDebtPortion) > tolerance
  ) {
    return {
      isValid: false,
      error: 'Debt portion must match the outstanding balance',
    };
  }

  return { isValid: true };
};

/**
 * Validate discount amount to prevent excessive discounts
 */
export const validateDiscountAmount = (
  discountAmount: number,
  subtotal: number,
  discountType: 'percentage' | 'fixed'
): { isValid: boolean; error?: string } => {
  if (discountType === 'percentage') {
    if (discountAmount > 100) {
      return {
        isValid: false,
        error: 'Discount percentage cannot exceed 100%',
      };
    }
  }

  if (discountAmount < 0) {
    return {
      isValid: false,
      error: 'Discount amount cannot be negative',
    };
  }

  if (discountAmount > subtotal) {
    return {
      isValid: false,
      error: 'Discount cannot exceed subtotal amount',
    };
  }

  return { isValid: true };
};
