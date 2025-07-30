export interface CartItem {
  id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  stock: number;
  category?: string;
  brand?: string;
}

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
  const totalPaid = roundCurrency(
    splitPayments.reduce((sum, p) => sum + p.amount, 0)
  );
  const roundedTotal = roundCurrency(total);

  if (totalPaid < roundedTotal) {
    return {
      isValid: false,
      error: 'Split payment total is less than the required amount',
    };
  }

  if (splitPayments.some(payment => payment.amount <= 0)) {
    return {
      isValid: false,
      error: 'Split payments must have positive amounts',
    };
  }

  return { isValid: true };
};
