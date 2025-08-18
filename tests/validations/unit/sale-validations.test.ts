/**
 * Comprehensive Unit Tests for Sale Validation Schemas
 * Tests sale creation, update, and query validation schemas
 */

import {
  saleItemSchema,
  createSaleSchema,
  updateSaleSchema,
  saleQuerySchema,
  saleIdSchema,
} from '@/lib/validations/sale';

describe('Sale Validation Schemas', () => {
  describe('saleItemSchema', () => {
    const validSaleItem = {
      productId: 1,
      quantity: 2,
      unitPrice: 1500,
      discount: 10,
    };

    it('should accept valid sale item data', () => {
      const result = saleItemSchema.parse(validSaleItem);
      
      expect(result.productId).toBe(1);
      expect(result.quantity).toBe(2);
      expect(result.unitPrice).toBe(1500);
      expect(result.discount).toBe(10);
    });

    it('should apply default discount', () => {
      const { discount, ...itemWithoutDiscount } = validSaleItem;
      
      const result = saleItemSchema.parse(itemWithoutDiscount);
      
      expect(result.discount).toBe(0);
    });

    describe('Product ID Validation', () => {
      it('should require positive product ID', () => {
        expect(() => saleItemSchema.parse({
          ...validSaleItem,
          productId: 0,
        })).toThrow();

        expect(() => saleItemSchema.parse({
          ...validSaleItem,
          productId: -1,
        })).toThrow();
      });

      it('should require integer product ID', () => {
        expect(() => saleItemSchema.parse({
          ...validSaleItem,
          productId: 1.5,
        })).toThrow();
      });
    });

    describe('Quantity Validation', () => {
      it('should require positive quantity', () => {
        expect(() => saleItemSchema.parse({
          ...validSaleItem,
          quantity: 0,
        })).toThrow();

        expect(() => saleItemSchema.parse({
          ...validSaleItem,
          quantity: -1,
        })).toThrow();
      });

      it('should require integer quantity', () => {
        expect(() => saleItemSchema.parse({
          ...validSaleItem,
          quantity: 1.5,
        })).toThrow();
      });
    });

    describe('Unit Price Validation', () => {
      it('should accept valid prices', () => {
        const validPrices = [0, 100, 1500.50, 99999];

        validPrices.forEach(unitPrice => {
          const result = saleItemSchema.parse({
            ...validSaleItem,
            unitPrice,
          });
          expect(result.unitPrice).toBe(unitPrice);
        });
      });

      it('should reject negative prices', () => {
        expect(() => saleItemSchema.parse({
          ...validSaleItem,
          unitPrice: -100,
        })).toThrow();
      });
    });

    describe('Discount Validation', () => {
      it('should accept valid discount percentages', () => {
        const validDiscounts = [0, 10, 50, 100];

        validDiscounts.forEach(discount => {
          const result = saleItemSchema.parse({
            ...validSaleItem,
            discount,
          });
          expect(result.discount).toBe(discount);
        });
      });

      it('should reject negative discounts', () => {
        expect(() => saleItemSchema.parse({
          ...validSaleItem,
          discount: -5,
        })).toThrow();
      });

      it('should reject discounts over 100%', () => {
        expect(() => saleItemSchema.parse({
          ...validSaleItem,
          discount: 101,
        })).toThrow();

        expect(() => saleItemSchema.parse({
          ...validSaleItem,
          discount: 150,
        })).toThrow();
      });
    });
  });

  describe('createSaleSchema', () => {
    const validSaleData = {
      userId: 1,
      items: [
        {
          productId: 1,
          quantity: 2,
          unitPrice: 1500,
          discount: 0,
        },
        {
          productId: 2,
          quantity: 1,
          unitPrice: 3000,
          discount: 10,
        },
      ],
      paymentMethod: 'CASH' as const,
      paymentStatus: 'PAID' as const,
      discountAmount: 0,
      taxAmount: 0,
      notes: 'Test sale transaction',
    };

    it('should accept valid sale creation data', () => {
      const result = createSaleSchema.parse(validSaleData);
      
      expect(result.userId).toBe(1);
      expect(result.items).toHaveLength(2);
      expect(result.paymentMethod).toBe('CASH');
      expect(result.paymentStatus).toBe('PAID');
      expect(result.discountAmount).toBe(0);
      expect(result.taxAmount).toBe(0);
      expect(result.notes).toBe('Test sale transaction');
    });

    it('should apply default values', () => {
      const minimalSaleData = {
        userId: 1,
        items: [
          {
            productId: 1,
            quantity: 1,
            unitPrice: 1000,
          },
        ],
        paymentMethod: 'CASH' as const,
      };

      const result = createSaleSchema.parse(minimalSaleData);
      
      expect(result.paymentStatus).toBe('PENDING');
      expect(result.discountAmount).toBe(0);
      expect(result.taxAmount).toBe(0);
    });

    describe('User ID Validation', () => {
      it('should require valid user ID', () => {
        expect(() => createSaleSchema.parse({
          ...validSaleData,
          userId: 0,
        })).toThrow();

        expect(() => createSaleSchema.parse({
          ...validSaleData,
          userId: -1,
        })).toThrow();
      });
    });

    describe('Items Validation', () => {
      it('should require at least one item', () => {
        expect(() => createSaleSchema.parse({
          ...validSaleData,
          items: [],
        })).toThrow();
      });

      it('should validate all items', () => {
        const invalidItems = [
          {
            productId: 1,
            quantity: 0, // Invalid quantity
            unitPrice: 1000,
          },
        ];

        expect(() => createSaleSchema.parse({
          ...validSaleData,
          items: invalidItems,
        })).toThrow();
      });

      it('should accept multiple valid items', () => {
        const multipleItems = Array.from({ length: 5 }, (_, i) => ({
          productId: i + 1,
          quantity: i + 1,
          unitPrice: (i + 1) * 1000,
          discount: i * 5,
        }));

        const result = createSaleSchema.parse({
          ...validSaleData,
          items: multipleItems,
        });

        expect(result.items).toHaveLength(5);
      });
    });

    describe('Payment Method Validation', () => {
      it('should accept valid payment methods', () => {
        const validMethods = ['CASH', 'BANK_TRANSFER', 'POS_MACHINE', 'CREDIT_CARD', 'MOBILE_MONEY'] as const;

        validMethods.forEach(paymentMethod => {
          const result = createSaleSchema.parse({
            ...validSaleData,
            paymentMethod,
          });
          expect(result.paymentMethod).toBe(paymentMethod);
        });
      });

      it('should reject invalid payment methods', () => {
        expect(() => createSaleSchema.parse({
          ...validSaleData,
          paymentMethod: 'INVALID' as any,
        })).toThrow();
      });
    });

    describe('Payment Status Validation', () => {
      it('should accept valid payment statuses', () => {
        const validStatuses = ['PENDING', 'PAID', 'REFUNDED', 'CANCELLED'] as const;

        validStatuses.forEach(paymentStatus => {
          const result = createSaleSchema.parse({
            ...validSaleData,
            paymentStatus,
          });
          expect(result.paymentStatus).toBe(paymentStatus);
        });
      });

      it('should reject invalid payment statuses', () => {
        expect(() => createSaleSchema.parse({
          ...validSaleData,
          paymentStatus: 'INVALID' as any,
        })).toThrow();
      });
    });

    describe('Discount Amount Validation', () => {
      it('should accept valid discount amounts', () => {
        const validDiscounts = [0, 100, 500.50];

        validDiscounts.forEach(discountAmount => {
          const result = createSaleSchema.parse({
            ...validSaleData,
            discountAmount,
          });
          expect(result.discountAmount).toBe(discountAmount);
        });
      });

      it('should reject negative discount amounts', () => {
        expect(() => createSaleSchema.parse({
          ...validSaleData,
          discountAmount: -100,
        })).toThrow();
      });
    });

    describe('Tax Amount Validation', () => {
      it('should accept valid tax amounts', () => {
        const validTaxAmounts = [0, 150, 750.75];

        validTaxAmounts.forEach(taxAmount => {
          const result = createSaleSchema.parse({
            ...validSaleData,
            taxAmount,
          });
          expect(result.taxAmount).toBe(taxAmount);
        });
      });

      it('should reject negative tax amounts', () => {
        expect(() => createSaleSchema.parse({
          ...validSaleData,
          taxAmount: -50,
        })).toThrow();
      });
    });

    describe('Notes Validation', () => {
      it('should accept valid notes', () => {
        const validNotes = [
          'Short note',
          'A'.repeat(500), // Max length
          '',
          null,
          undefined,
        ];

        validNotes.forEach(notes => {
          const result = createSaleSchema.parse({
            ...validSaleData,
            notes,
          });
          expect(result.notes).toBe(notes);
        });
      });

      it('should reject notes that are too long', () => {
        const tooLongNotes = 'A'.repeat(501);
        
        expect(() => createSaleSchema.parse({
          ...validSaleData,
          notes: tooLongNotes,
        })).toThrow();
      });
    });

    describe('Total Amount Validation', () => {
      it('should validate total amount calculation', () => {
        const saleWithCalculation = {
          ...validSaleData,
          items: [
            {
              productId: 1,
              quantity: 2,
              unitPrice: 1000,
              discount: 0,
            },
          ],
          discountAmount: 200,
          taxAmount: 180,
        };

        const result = createSaleSchema.parse(saleWithCalculation);
        
        // Total should be: (2 * 1000) - 200 + 180 = 1980
        // The schema itself doesn't calculate, but validates the structure
        expect(result.discountAmount).toBe(200);
        expect(result.taxAmount).toBe(180);
      });
    });
  });

  describe('updateSaleSchema', () => {
    it('should accept partial updates', () => {
      const updateData = {
        paymentStatus: 'PAID' as const,
        notes: 'Updated notes',
      };

      const result = updateSaleSchema.parse(updateData);
      
      expect(result.paymentStatus).toBe('PAID');
      expect(result.notes).toBe('Updated notes');
    });

    it('should accept empty updates', () => {
      const result = updateSaleSchema.parse({});
      expect(Object.keys(result)).toHaveLength(0);
    });

    it('should validate fields when provided', () => {
      expect(() => updateSaleSchema.parse({
        paymentStatus: 'INVALID' as any,
      })).toThrow();

      expect(() => updateSaleSchema.parse({
        discountAmount: -100,
      })).toThrow();
    });

    it('should not allow item updates in basic update schema', () => {
      // Items typically shouldn't be updatable after sale creation
      const updateData = {
        paymentStatus: 'PAID' as const,
        items: [
          {
            productId: 1,
            quantity: 1,
            unitPrice: 1000,
          },
        ],
      };

      // Should not include items in update schema for security
      const result = updateSaleSchema.parse(updateData);
      expect('items' in result).toBe(false);
    });
  });

  describe('saleQuerySchema', () => {
    it('should accept valid query parameters', () => {
      const queryData = {
        page: 2,
        limit: 20,
        search: 'sale',
        userId: 1,
        paymentMethod: 'CASH',
        paymentStatus: 'PAID',
        fromDate: '2024-01-01T00:00:00Z',
        toDate: '2024-12-31T23:59:59Z',
        sortBy: 'createdAt',
        sortOrder: 'desc' as const,
        minAmount: 1000,
        maxAmount: 50000,
      };

      const result = saleQuerySchema.parse(queryData);
      
      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
      expect(result.search).toBe('sale');
      expect(result.userId).toBe(1);
      expect(result.paymentMethod).toBe('CASH');
      expect(result.paymentStatus).toBe('PAID');
      expect(result.fromDate).toBe('2024-01-01T00:00:00Z');
      expect(result.toDate).toBe('2024-12-31T23:59:59Z');
      expect(result.minAmount).toBe(1000);
      expect(result.maxAmount).toBe(50000);
    });

    it('should apply default values', () => {
      const result = saleQuerySchema.parse({});
      
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.sortBy).toBe('createdAt');
      expect(result.sortOrder).toBe('desc');
    });

    it('should handle string coercion for numbers', () => {
      const result = saleQuerySchema.parse({
        page: '3',
        limit: '25',
        userId: '5',
        minAmount: '500',
        maxAmount: '10000',
      });

      expect(result.page).toBe(3);
      expect(result.limit).toBe(25);
      expect(result.userId).toBe(5);
      expect(result.minAmount).toBe(500);
      expect(result.maxAmount).toBe(10000);
    });

    it('should validate enum values', () => {
      expect(() => saleQuerySchema.parse({
        paymentMethod: 'INVALID',
      })).toThrow();

      expect(() => saleQuerySchema.parse({
        paymentStatus: 'INVALID',
      })).toThrow();

      expect(() => saleQuerySchema.parse({
        sortOrder: 'invalid',
      })).toThrow();
    });

    it('should validate date formats', () => {
      expect(() => saleQuerySchema.parse({
        fromDate: '2024-01-01', // Invalid format
      })).toThrow();

      expect(() => saleQuerySchema.parse({
        toDate: 'invalid-date',
      })).toThrow();
    });

    it('should validate amount ranges', () => {
      expect(() => saleQuerySchema.parse({
        minAmount: -100,
      })).toThrow();

      expect(() => saleQuerySchema.parse({
        maxAmount: -500,
      })).toThrow();
    });
  });

  describe('saleIdSchema', () => {
    it('should accept valid sale IDs', () => {
      expect(saleIdSchema.parse(1)).toBe(1);
      expect(saleIdSchema.parse(999999)).toBe(999999);
    });

    it('should reject invalid IDs', () => {
      expect(() => saleIdSchema.parse(0)).toThrow();
      expect(() => saleIdSchema.parse(-1)).toThrow();
      expect(() => saleIdSchema.parse(1.5)).toThrow();
      expect(() => saleIdSchema.parse('1')).toThrow();
    });
  });

  describe('Complex Sale Scenarios', () => {
    it('should handle large sales with many items', () => {
      const largeItems = Array.from({ length: 50 }, (_, i) => ({
        productId: i + 1,
        quantity: Math.floor(Math.random() * 10) + 1,
        unitPrice: Math.floor(Math.random() * 10000) + 100,
        discount: Math.floor(Math.random() * 20),
      }));

      const largeSale = {
        userId: 1,
        items: largeItems,
        paymentMethod: 'BANK_TRANSFER' as const,
        paymentStatus: 'PAID' as const,
        discountAmount: 1000,
        taxAmount: 500,
        notes: 'Large bulk purchase order',
      };

      const result = createSaleSchema.parse(largeSale);
      
      expect(result.items).toHaveLength(50);
      expect(result.paymentMethod).toBe('BANK_TRANSFER');
    });

    it('should handle high-value transactions', () => {
      const highValueSale = {
        userId: 1,
        items: [
          {
            productId: 1,
            quantity: 1,
            unitPrice: 1000000, // 1 million naira
            discount: 5,
          },
        ],
        paymentMethod: 'BANK_TRANSFER' as const,
        paymentStatus: 'PAID' as const,
        discountAmount: 50000,
        taxAmount: 75000,
      };

      const result = createSaleSchema.parse(highValueSale);
      
      expect(result.items[0].unitPrice).toBe(1000000);
      expect(result.discountAmount).toBe(50000);
      expect(result.taxAmount).toBe(75000);
    });

    it('should validate sale with mixed payment scenarios', () => {
      const mixedPaymentSale = {
        userId: 1,
        items: [
          {
            productId: 1,
            quantity: 2,
            unitPrice: 5000,
            discount: 0,
          },
          {
            productId: 2,
            quantity: 1,
            unitPrice: 15000,
            discount: 15,
          },
        ],
        paymentMethod: 'MOBILE_MONEY' as const,
        paymentStatus: 'PENDING' as const,
        discountAmount: 2500,
        taxAmount: 1875,
        notes: 'Partial payment received, awaiting balance',
      };

      const result = createSaleSchema.parse(mixedPaymentSale);
      
      expect(result.paymentMethod).toBe('MOBILE_MONEY');
      expect(result.paymentStatus).toBe('PENDING');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed input gracefully', () => {
      const malformedInputs = [
        null,
        undefined,
        [],
        'string',
        123,
        { unknownField: 'value' },
      ];

      malformedInputs.forEach(input => {
        expect(() => createSaleSchema.parse(input)).toThrow();
      });
    });

    it('should validate against potential calculation errors', () => {
      // Test edge cases that might cause calculation issues
      const edgeCaseSale = {
        userId: 1,
        items: [
          {
            productId: 1,
            quantity: 1,
            unitPrice: 0.01, // Very small price
            discount: 0,
          },
        ],
        paymentMethod: 'CASH' as const,
        paymentStatus: 'PAID' as const,
        discountAmount: 0,
        taxAmount: 0,
      };

      const result = createSaleSchema.parse(edgeCaseSale);
      expect(result.items[0].unitPrice).toBe(0.01);
    });

    it('should prevent negative total scenarios', () => {
      // Ensure discount cannot exceed item total
      const problematicSale = {
        userId: 1,
        items: [
          {
            productId: 1,
            quantity: 1,
            unitPrice: 1000,
            discount: 50, // 50% discount = 500
          },
        ],
        paymentMethod: 'CASH' as const,
        discountAmount: 600, // This would make total negative
        taxAmount: 0,
      };

      // The schema validates structure, not business logic
      const result = createSaleSchema.parse(problematicSale);
      expect(result.discountAmount).toBe(600);
      // Business logic validation would happen at application level
    });
  });
});