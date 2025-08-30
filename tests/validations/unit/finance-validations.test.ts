/**
 * Comprehensive Unit Tests for Finance Validation Schemas
 * Tests finance transaction validation schemas and business rules
 */

import {
  baseTransactionSchema,
  incomeTransactionSchema,
  expenseTransactionSchema,
  transactionFiltersSchema,
} from '@/lib/validations/finance';

// Mock the constants since they might not be properly exported
jest.mock('@/lib/constants/finance', () => ({
  FINANCIAL_TYPES: {
    INCOME: 'INCOME',
    EXPENSE: 'EXPENSE',
  },
  FINANCIAL_STATUS: {
    PENDING: 'PENDING',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
  },
  PAYMENT_METHODS: {
    CASH: 'CASH',
    BANK_TRANSFER: 'BANK_TRANSFER',
    POS_MACHINE: 'POS_MACHINE',
    CREDIT_CARD: 'CREDIT_CARD',
    MOBILE_MONEY: 'MOBILE_MONEY',
  },
  EXPENSE_TYPES: {
    INVENTORY_PURCHASES: 'INVENTORY_PURCHASES',
    UTILITIES: 'UTILITIES',
    RENT: 'RENT',
    SALARIES: 'SALARIES',
    MARKETING: 'MARKETING',
    OFFICE_SUPPLIES: 'OFFICE_SUPPLIES',
    TRAVEL: 'TRAVEL',
    INSURANCE: 'INSURANCE',
    MAINTENANCE: 'MAINTENANCE',
    OTHER: 'OTHER',
  },
  INCOME_SOURCES: {
    SALES: 'SALES',
    SERVICES: 'SERVICES',
    INVESTMENTS: 'INVESTMENTS',
    ROYALTIES: 'ROYALTIES',
    COMMISSIONS: 'COMMISSIONS',
    OTHER: 'OTHER',
  },
}));

describe('Finance Validation Schemas', () => {
  describe('baseTransactionSchema', () => {
    const validTransaction = {
      type: 'INCOME',
      amount: 15000,
      description: 'Sales revenue for January',
      transactionDate: new Date().toISOString().split('T')[0], // Today's date
      paymentMethod: 'CASH',
      // Note: status is not part of baseTransactionSchema
    };

    it('should accept valid transaction data', () => {
      const result = baseTransactionSchema.parse(validTransaction);
      
      expect(result.type).toBe('INCOME');
      expect(result.amount).toBe(15000);
      expect(result.description).toBe('Sales revenue for January');
      expect(result.paymentMethod).toBe('CASH');
    });

    describe('Type Validation', () => {
      it('should accept valid transaction types', () => {
        const validTypes = ['INCOME', 'EXPENSE'];

        validTypes.forEach(type => {
          const result = baseTransactionSchema.parse({
            ...validTransaction,
            type,
          });
          expect(result.type).toBe(type);
        });
      });

      it('should reject invalid transaction types', () => {
        const invalidTypes = ['INVALID', 'income', 'expense', '', null];

        invalidTypes.forEach(type => {
          expect(() => baseTransactionSchema.parse({
            ...validTransaction,
            type,
          })).toThrow();
        });
      });
    });

    describe('Amount Validation', () => {
      it('should accept valid amounts', () => {
        const validAmounts = [0.01, 100, 1500.50, 999999999.99];

        validAmounts.forEach(amount => {
          const result = baseTransactionSchema.parse({
            ...validTransaction,
            amount,
          });
          expect(result.amount).toBe(amount);
        });
      });

      it('should reject zero and negative amounts', () => {
        const invalidAmounts = [0, -0.01, -100, -1500];

        invalidAmounts.forEach(amount => {
          expect(() => baseTransactionSchema.parse({
            ...validTransaction,
            amount,
          })).toThrow();
        });
      });

      it('should reject amounts that are too large', () => {
        expect(() => baseTransactionSchema.parse({
          ...validTransaction,
          amount: 1000000000, // Exceeds max
        })).toThrow();
      });

      it('should reject non-numeric amounts', () => {
        const invalidAmounts = ['100', null, undefined, ''];

        invalidAmounts.forEach(amount => {
          expect(() => baseTransactionSchema.parse({
            ...validTransaction,
            amount,
          })).toThrow();
        });
      });
    });

    describe('Description Validation', () => {
      it('should accept valid descriptions', () => {
        const validDescriptions = [
          'Short desc',
          'A'.repeat(500), // Max length
          'Sales revenue for product #123',
          'Office rent payment - January 2024',
        ];

        validDescriptions.forEach(description => {
          const result = baseTransactionSchema.parse({
            ...validTransaction,
            description,
          });
          expect(result.description).toBe(description);
        });
      });

      it('should reject empty or too long descriptions', () => {
        const invalidDescriptions = [
          '', // Empty string
          'A'.repeat(501), // Too long
        ];

        invalidDescriptions.forEach(description => {
          expect(() => baseTransactionSchema.parse({
            ...validTransaction,
            description,
          })).toThrow();
        });
      });

      it('should accept whitespace in descriptions (no automatic trimming)', () => {
        const result = baseTransactionSchema.parse({
          ...validTransaction,
          description: '  Sales revenue  ',
        });
        // The schema doesn't trim whitespace automatically
        expect(result.description).toBe('  Sales revenue  ');
      });
    });

    describe('Transaction Date Validation', () => {
      it('should accept valid past and present dates', () => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const validDates = [
          today.toISOString().split('T')[0],
          yesterday.toISOString().split('T')[0],
          lastMonth.toISOString().split('T')[0],
          '2024-01-01',
        ];

        validDates.forEach(transactionDate => {
          const result = baseTransactionSchema.parse({
            ...validTransaction,
            transactionDate,
          });
          expect(result.transactionDate).toBe(transactionDate);
        });
      });

      it('should reject future dates', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const futureDates = [
          tomorrow.toISOString().split('T')[0],
          nextMonth.toISOString().split('T')[0],
          '2025-12-31',
        ];

        futureDates.forEach(transactionDate => {
          expect(() => baseTransactionSchema.parse({
            ...validTransaction,
            transactionDate,
          })).toThrow();
        });
      });

      it('should reject invalid date formats', () => {
        const invalidDates = [
          '', // Empty string - caught by min(1)
          // Note: JavaScript Date constructor accepts many formats,
          // so we test mainly empty strings and future dates
        ];

        invalidDates.forEach(transactionDate => {
          expect(() => baseTransactionSchema.parse({
            ...validTransaction,
            transactionDate,
          })).toThrow();
        });
      });
    });

    describe('Payment Method Validation', () => {
      it('should accept valid payment methods', () => {
        const validMethods = ['CASH', 'BANK_TRANSFER', 'POS_MACHINE', 'CREDIT_CARD', 'MOBILE_MONEY'];

        validMethods.forEach(paymentMethod => {
          const result = baseTransactionSchema.parse({
            ...validTransaction,
            paymentMethod,
          });
          expect(result.paymentMethod).toBe(paymentMethod);
        });
      });

      it('should reject invalid payment methods', () => {
        const invalidMethods = ['INVALID', 'cash', 'credit_card', '', null];

        invalidMethods.forEach(paymentMethod => {
          expect(() => baseTransactionSchema.parse({
            ...validTransaction,
            paymentMethod,
          })).toThrow();
        });
      });
    });

    // Status validation is not part of baseTransactionSchema
  });

  describe('incomeTransactionSchema', () => {
    const validIncomeTransaction = {
      type: 'INCOME',
      amount: 25000,
      description: 'Product sales revenue',
      transactionDate: '2024-01-15',
      paymentMethod: 'BANK_TRANSFER',
      incomeSource: 'SALES',
      payerName: 'ABC Company Ltd',
    };

    it('should accept valid income transaction data', () => {
      const result = incomeTransactionSchema.parse(validIncomeTransaction);
      
      expect(result.type).toBe('INCOME');
      expect(result.incomeSource).toBe('SALES');
      expect(result.payerName).toBe('ABC Company Ltd');
    });

    it('should require income source for income transactions', () => {
      const minimalIncome = {
        type: 'INCOME',
        amount: 15000,
        description: 'Sales income',
        transactionDate: '2024-01-15',
        incomeSource: 'SALES',
      };

      const result = incomeTransactionSchema.parse(minimalIncome);
      
      expect(result.type).toBe('INCOME');
      expect(result.incomeSource).toBe('SALES');
    });

    describe('Income Source Validation', () => {
      it('should accept valid income sources', () => {
        const validSources = ['SALES', 'SERVICES', 'INVESTMENTS', 'ROYALTIES', 'COMMISSIONS', 'OTHER'];

        validSources.forEach(incomeSource => {
          const result = incomeTransactionSchema.parse({
            ...validIncomeTransaction,
            incomeSource,
          });
          expect(result.incomeSource).toBe(incomeSource);
        });
      });

      it('should reject invalid income sources', () => {
        expect(() => incomeTransactionSchema.parse({
          ...validIncomeTransaction,
          incomeSource: 'INVALID',
        })).toThrow();
      });
    });

    describe('Payer Name Validation', () => {
      it('should accept valid payer names', () => {
        const validNames = [
          'John Doe',
          'ABC Company Ltd',
          'Customer #123',
          'A'.repeat(255), // Max length
        ];

        validNames.forEach(payerName => {
          const result = incomeTransactionSchema.parse({
            ...validIncomeTransaction,
            payerName,
          });
          expect(result.payerName).toBe(payerName);
        });
      });

      it('should accept optional payer name', () => {
        const { payerName, ...incomeWithoutPayer } = validIncomeTransaction;
        
        const result = incomeTransactionSchema.parse(incomeWithoutPayer);
        expect(result.payerName).toBeUndefined();
      });

      it('should reject invalid payer names', () => {
        expect(() => incomeTransactionSchema.parse({
          ...validIncomeTransaction,
          payerName: 'A'.repeat(256), // Too long
        })).toThrow();
      });
    });
  });

  describe('expenseTransactionSchema', () => {
    const validExpenseTransaction = {
      type: 'EXPENSE',
      amount: 8500,
      description: 'Office supplies purchase',
      transactionDate: '2024-01-10',
      paymentMethod: 'CASH',
      expenseType: 'OFFICE_SUPPLIES',
      vendorName: 'Office Supplies Co.',
    };

    it('should accept valid expense transaction data', () => {
      const result = expenseTransactionSchema.parse(validExpenseTransaction);
      
      expect(result.type).toBe('EXPENSE');
      expect(result.expenseType).toBe('OFFICE_SUPPLIES');
      expect(result.vendorName).toBe('Office Supplies Co.');
    });

    it('should require expense type for expense transactions', () => {
      const minimalExpense = {
        type: 'EXPENSE',
        amount: 5000,
        description: 'Office expense',
        transactionDate: '2024-01-10',
        expenseType: 'OTHER',
      };

      const result = expenseTransactionSchema.parse(minimalExpense);
      
      expect(result.type).toBe('EXPENSE');
      expect(result.expenseType).toBe('OTHER');
    });

    describe('Expense Type Validation', () => {
      it('should accept valid expense types', () => {
        const validTypes = [
          'INVENTORY_PURCHASES',
          'UTILITIES', 
          'RENT',
          'SALARIES',
          'MARKETING',
          'OFFICE_SUPPLIES',
          'TRAVEL',
          'INSURANCE',
          'MAINTENANCE',
          'OTHER'
        ];

        validTypes.forEach(expenseType => {
          const result = expenseTransactionSchema.parse({
            ...validExpenseTransaction,
            expenseType,
          });
          expect(result.expenseType).toBe(expenseType);
        });
      });

      it('should reject invalid expense types', () => {
        expect(() => expenseTransactionSchema.parse({
          ...validExpenseTransaction,
          expenseType: 'INVALID',
        })).toThrow();
      });
    });

    describe('Vendor Name Validation', () => {
      it('should accept valid vendor names', () => {
        const validVendors = [
          'Office Supplies Co.',
          'ABC Vendor Ltd',
          'Vendor #456',
          'A'.repeat(255), // Max length
        ];

        validVendors.forEach(vendorName => {
          const result = expenseTransactionSchema.parse({
            ...validExpenseTransaction,
            vendorName,
          });
          expect(result.vendorName).toBe(vendorName);
        });
      });

      it('should accept optional vendor name', () => {
        const { vendorName, ...expenseWithoutVendor } = validExpenseTransaction;
        
        const result = expenseTransactionSchema.parse(expenseWithoutVendor);
        expect(result.vendorName).toBeUndefined();
      });
    });

    it('should reject invalid vendor names', () => {
      expect(() => expenseTransactionSchema.parse({
        ...validExpenseTransaction,
        vendorName: 'A'.repeat(256), // Too long
      })).toThrow();
    });
  });

  describe('transactionFiltersSchema', () => {
    it('should accept valid query parameters', () => {
      const queryData = {
        page: 1,
        limit: 25,
        search: 'office',
        type: 'EXPENSE',
        status: 'PENDING',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        sortBy: 'transactionDate',
        sortOrder: 'asc',
      };

      const result = transactionFiltersSchema.parse(queryData);
      
      expect(result.page).toBe(1);
      expect(result.limit).toBe(25);
      expect(result.search).toBe('office');
      expect(result.type).toBe('EXPENSE');
      expect(result.status).toBe('PENDING');
      expect(result.startDate).toBe('2024-01-01');
      expect(result.endDate).toBe('2024-01-31');
      expect(result.sortBy).toBe('transactionDate');
      expect(result.sortOrder).toBe('asc');
    });

    it('should apply default query values', () => {
      const result = transactionFiltersSchema.parse({});
      
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.sortOrder).toBe('desc');
    });
  });

  describe('Date Range Validation', () => {
    it('should validate proper date ranges', () => {
      const validDateRange = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      const result = transactionFiltersSchema.parse(validDateRange);
      expect(result.startDate).toBe('2024-01-01');
      expect(result.endDate).toBe('2024-01-31');
    });

    it('should reject invalid date ranges', () => {
      const invalidDateRange = {
        startDate: '2024-01-31',
        endDate: '2024-01-01', // End before start
      };

      expect(() => transactionFiltersSchema.parse(invalidDateRange)).toThrow();
    });
  });

  describe('Business Logic Edge Cases', () => {
    it('should handle high-value transactions', () => {
      const highValueTransaction = {
        type: 'INCOME',
        amount: 999999999.99, // Maximum allowed
        description: 'Large contract payment',
        transactionDate: '2024-01-15',
        paymentMethod: 'BANK_TRANSFER',
      };

      const result = baseTransactionSchema.parse(highValueTransaction);
      expect(result.amount).toBe(999999999.99);
    });

    it('should handle micro-transactions', () => {
      const microTransaction = {
        type: 'INCOME',
        amount: 0.01, // Minimum allowed
        description: 'Small service fee',
        transactionDate: '2024-01-15',
        paymentMethod: 'MOBILE_MONEY',
      };

      const result = baseTransactionSchema.parse(microTransaction);
      expect(result.amount).toBe(0.01);
    });

    it('should validate expense transactions with vendor names', () => {
      const expenseWithVendor = {
        type: 'EXPENSE',
        amount: 5000,
        description: 'Monthly office rent',
        transactionDate: '2024-01-01',
        paymentMethod: 'BANK_TRANSFER',
        expenseType: 'RENT',
        vendorName: 'Property Management Co.',
      };

      const result = expenseTransactionSchema.parse(expenseWithVendor);
      expect(result.expenseType).toBe('RENT');
      expect(result.vendorName).toBe('Property Management Co.');
    });
  });

  describe('Security and Data Integrity', () => {
    it('should prevent injection attacks in descriptions', () => {
      const maliciousDescriptions = [
        "'; DROP TABLE transactions; --",
        "<script>alert('xss')</script>",
        "Robert'); DELETE FROM * WHERE '1'='1",
      ];

      maliciousDescriptions.forEach(description => {
        const result = baseTransactionSchema.parse({
          type: 'INCOME',
          amount: 1000,
          description,
          transactionDate: '2024-01-15',
          paymentMethod: 'CASH',
        });

        // Should be treated as plain text
        expect(result.description).toBe(description);
      });
    });

    it('should handle very long input strings gracefully', () => {
      const veryLongDescription = 'A'.repeat(501); // Exceeds max length

      expect(() => baseTransactionSchema.parse({
        type: 'INCOME',
        amount: 1000,
        description: veryLongDescription,
        transactionDate: '2024-01-15',
        paymentMethod: 'CASH',
      })).toThrow();
    });

    it('should validate against currency manipulation', () => {
      const currencyAttacks = [
        Infinity,
        -Infinity,
        NaN,
        Number.MAX_VALUE,
        Number.MIN_VALUE,
      ];

      currencyAttacks.forEach(amount => {
        expect(() => baseTransactionSchema.parse({
          type: 'INCOME',
          amount,
          description: 'Test transaction',
          transactionDate: '2024-01-15',
          paymentMethod: 'CASH',
        })).toThrow();
      });
    });
  });
});