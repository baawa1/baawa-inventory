import {
  calculateOrderTotals,
  calculateDiscountAmount,
  validatePaymentAmount,
  validateSplitPayments,
  calculateChange,
} from '../calculations';

describe('POS Calculation Utilities', () => {
  const mockItems = [
    {
      id: 1,
      name: 'Product 1',
      sku: 'SKU1',
      price: 100,
      quantity: 2,
      stock: 10,
    },
    { id: 2, name: 'Product 2', sku: 'SKU2', price: 50, quantity: 1, stock: 5 },
  ];

  describe('calculateOrderTotals', () => {
    it('should calculate subtotal correctly', () => {
      const result = calculateOrderTotals(mockItems, 0);
      expect(result.subtotal).toBe(250); // (100 * 2) + (50 * 1) = 250
      expect(result.total).toBe(250); // subtotal - 0 discount = 250
    });

    it('should apply discount correctly', () => {
      const result = calculateOrderTotals(mockItems, 25);
      expect(result.subtotal).toBe(250);
      expect(result.total).toBe(225); // 250 - 25 = 225
    });

    it('should not allow negative total', () => {
      const result = calculateOrderTotals(mockItems, 300);
      expect(result.subtotal).toBe(250);
      expect(result.total).toBe(0); // 250 - 300 = 0 (minimum)
    });
  });

  describe('calculateDiscountAmount', () => {
    it('should calculate percentage discount correctly', () => {
      const result = calculateDiscountAmount(100, 10, 'percentage');
      expect(result).toBe(10); // 10% of 100 = 10
    });

    it('should calculate fixed discount correctly', () => {
      const result = calculateDiscountAmount(100, 15, 'fixed');
      expect(result).toBe(15);
    });

    it('should not exceed subtotal for percentage discount', () => {
      const result = calculateDiscountAmount(100, 150, 'percentage');
      expect(result).toBe(100); // Should cap at subtotal
    });

    it('should not exceed subtotal for fixed discount', () => {
      const result = calculateDiscountAmount(100, 150, 'fixed');
      expect(result).toBe(100); // Should cap at subtotal
    });
  });

  describe('validatePaymentAmount', () => {
    it('should validate sufficient cash payment', () => {
      const result = validatePaymentAmount(100, 80, 'cash');
      expect(result.isValid).toBe(true);
    });

    it('should reject insufficient cash payment', () => {
      const result = validatePaymentAmount(50, 80, 'cash');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Insufficient payment amount');
    });

    it('should allow any amount for non-cash payments', () => {
      const result = validatePaymentAmount(50, 80, 'pos');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateSplitPayments', () => {
    it('should validate sufficient split payments', () => {
      const splitPayments = [
        { id: '1', amount: 50, method: 'cash' },
        { id: '2', amount: 30, method: 'pos' },
      ];
      const result = validateSplitPayments(splitPayments, 80);
      expect(result.isValid).toBe(true);
    });

    it('should reject insufficient split payments', () => {
      const splitPayments = [
        { id: '1', amount: 50, method: 'cash' },
        { id: '2', amount: 20, method: 'pos' },
      ];
      const result = validateSplitPayments(splitPayments, 80);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        'Split payment total is less than the required amount'
      );
    });

    it('should handle floating-point precision issues', () => {
      const splitPayments = [
        { id: '1', amount: 200000, method: 'cash' },
        { id: '2', amount: 200000, method: 'bank_transfer' },
        { id: '3', amount: 56697.86, method: 'mobile_money' },
      ];
      const result = validateSplitPayments(splitPayments, 456697.86);
      expect(result.isValid).toBe(true);
    });

    it('should handle edge case floating-point precision', () => {
      const splitPayments = [
        { id: '1', amount: 0.1, method: 'cash' },
        { id: '2', amount: 0.2, method: 'pos' },
      ];
      const result = validateSplitPayments(splitPayments, 0.3);
      expect(result.isValid).toBe(true);
    });

    it('should reject payments with zero or negative amounts', () => {
      const splitPayments = [
        { id: '1', amount: 50, method: 'cash' },
        { id: '2', amount: 0, method: 'pos' },
      ];
      const result = validateSplitPayments(splitPayments, 50);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Split payments must have positive amounts');
    });
  });

  describe('calculateChange', () => {
    it('should calculate change correctly', () => {
      const result = calculateChange(100, 80);
      expect(result).toBe(20);
    });

    it('should return zero when exact payment', () => {
      const result = calculateChange(80, 80);
      expect(result).toBe(0);
    });

    it('should return zero when insufficient payment', () => {
      const result = calculateChange(50, 80);
      expect(result).toBe(0);
    });
  });
});
