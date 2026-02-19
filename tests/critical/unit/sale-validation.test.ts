import { createSaleSchema } from '@/lib/validations/sale';

const baseSale = {
  userId: 1,
  paymentMethod: 'CASH' as const,
  items: [
    {
      productId: 1,
      quantity: 2,
      unitPrice: 100,
      discount: 0,
    },
  ],
};

describe('sale validation', () => {
  it('rejects discount amounts that exceed items total', () => {
    const result = createSaleSchema.safeParse({
      ...baseSale,
      discountAmount: 500,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.path).toContain('discountAmount');
      expect(result.error.errors[0]?.message).toBe(
        'Discount amount cannot exceed items total'
      );
    }
  });

  it('accepts discount amounts within items total', () => {
    const result = createSaleSchema.safeParse({
      ...baseSale,
      discountAmount: 50,
    });

    expect(result.success).toBe(true);
  });

  it('rejects negative discount amounts', () => {
    const result = createSaleSchema.safeParse({
      ...baseSale,
      discountAmount: -10,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.path).toContain('discountAmount');
      expect(result.error.errors[0]?.message).toBe(
        'Discount amount cannot be negative'
      );
    }
  });
});
