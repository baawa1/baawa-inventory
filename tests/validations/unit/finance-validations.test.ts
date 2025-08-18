/**
 * Comprehensive Unit Tests for Finance Validation Schemas
 * Tests finance transaction validation schemas and business rules
 */

import {
  baseTransactionSchema,
  incomeTransactionSchema,
  expenseTransactionSchema,
  financeQuerySchema,
  validateDateRangeSchema,
} from '@/lib/validations/finance';

// Mock the constants since they might not be properly exported
jest.mock('@/lib/constants/finance', () => ({
  FINANCIAL_TYPES: {
    INCOME: 'INCOME',
    EXPENSE: 'EXPENSE',
  },
  FINANCIAL_STATUS: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
  },
  PAYMENT_METHODS: {
    CASH: 'CASH',
    BANK_TRANSFER: 'BANK_TRANSFER',
    CARD: 'CARD',
    MOBILE_MONEY: 'MOBILE_MONEY',
  },
  EXPENSE_TYPES: {
    OPERATIONAL: 'OPERATIONAL',
    MARKETING: 'MARKETING',
    ADMINISTRATIVE: 'ADMINISTRATIVE',
    OTHER: 'OTHER',
  },
  INCOME_SOURCES: {
    SALES: 'SALES',
    SERVICES: 'SERVICES',
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
      status: 'APPROVED',
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
          '',
          '   ',
          'A'.repeat(501), // Too long
          null,
          undefined,
        ];

        invalidDescriptions.forEach(description => {
          expect(() => baseTransactionSchema.parse({
            ...validTransaction,
            description,
          })).toThrow();
        });
      });

      it('should trim whitespace from descriptions', () => {
        const result = baseTransactionSchema.parse({
          ...validTransaction,
          description: '  Sales revenue  ',
        });
        expect(result.description).toBe('Sales revenue');
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
          '',
          'invalid-date',
          '2024-13-01', // Invalid month
          '2024-02-30', // Invalid day
          '24-01-01', // Wrong format
          null,
          undefined,
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
        const validMethods = ['CASH', 'BANK_TRANSFER', 'CARD', 'MOBILE_MONEY'];

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

    describe('Status Validation', () => {
      it('should accept valid statuses', () => {
        const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];

        validStatuses.forEach(status => {
          const result = baseTransactionSchema.parse({
            ...validTransaction,
            status,
          });
          expect(result.status).toBe(status);
        });
      });

      it('should apply default status', () => {
        const { status, ...transactionWithoutStatus } = validTransaction;
        
        const result = baseTransactionSchema.parse(transactionWithoutStatus);
        expect(result.status).toBe('PENDING');
      });
    });
  });

  describe('incomeTransactionSchema', () => {
    const validIncomeTransaction = {
      type: 'INCOME',
      amount: 25000,
      description: 'Product sales revenue',
      transactionDate: '2024-01-15',
      paymentMethod: 'BANK_TRANSFER',
      status: 'APPROVED',
      source: 'SALES',
      invoiceNumber: 'INV-2024-001',
      customerName: 'ABC Company Ltd',
      taxAmount: 2500,
    };

    it('should accept valid income transaction data', () => {
      const result = incomeTransactionSchema.parse(validIncomeTransaction);
      
      expect(result.type).toBe('INCOME');
      expect(result.source).toBe('SALES');
      expect(result.invoiceNumber).toBe('INV-2024-001');
      expect(result.customerName).toBe('ABC Company Ltd');
      expect(result.taxAmount).toBe(2500);
    });

    it('should apply income-specific defaults', () => {
      const minimalIncome = {
        type: 'INCOME',
        amount: 15000,
        description: 'Sales income',
        transactionDate: '2024-01-15',
        paymentMethod: 'CASH',
      };

      const result = incomeTransactionSchema.parse(minimalIncome);
      
      expect(result.source).toBe('SALES'); // Default source
      expect(result.taxAmount).toBe(0); // Default tax amount
    });

    describe('Income Source Validation', () => {
      it('should accept valid income sources', () => {
        const validSources = ['SALES', 'SERVICES', 'OTHER'];

        validSources.forEach(source => {
          const result = incomeTransactionSchema.parse({
            ...validIncomeTransaction,
            source,
          });
          expect(result.source).toBe(source);
        });
      });

      it('should reject invalid income sources', () => {
        expect(() => incomeTransactionSchema.parse({
          ...validIncomeTransaction,
          source: 'INVALID',
        })).toThrow();
      });
    });

    describe('Invoice Number Validation', () => {
      it('should accept valid invoice numbers', () => {
        const validInvoiceNumbers = [
          'INV-2024-001',
          'INVOICE_123',
          'REC-001-2024',
          'A1B2C3D4',
        ];

        validInvoiceNumbers.forEach(invoiceNumber => {
          const result = incomeTransactionSchema.parse({
            ...validIncomeTransaction,
            invoiceNumber,
          });
          expect(result.invoiceNumber).toBe(invoiceNumber);
        });
      });

      it('should accept optional invoice number', () => {
        const { invoiceNumber, ...incomeWithoutInvoice } = validIncomeTransaction;
        
        const result = incomeTransactionSchema.parse(incomeWithoutInvoice);
        expect(result.invoiceNumber).toBeUndefined();
      });

      it('should reject invalid invoice numbers', () => {
        const invalidInvoiceNumbers = [
          '', // Empty string
          'A'.repeat(51), // Too long
        ];

        invalidInvoiceNumbers.forEach(invoiceNumber => {
          expect(() => incomeTransactionSchema.parse({
            ...validIncomeTransaction,
            invoiceNumber,
          })).toThrow();
        });
      });
    });

    describe('Customer Name Validation', () => {
      it('should accept valid customer names', () => {
        const validNames = [
          'John Doe',
          'ABC Company Ltd',
          'Customer #123',
          'A'.repeat(255), // Max length
        ];

        validNames.forEach(customerName => {
          const result = incomeTransactionSchema.parse({
            ...validIncomeTransaction,
            customerName,
          });
          expect(result.customerName).toBe(customerName);
        });
      });

      it('should accept optional customer name', () => {
        const { customerName, ...incomeWithoutCustomer } = validIncomeTransaction;
        
        const result = incomeTransactionSchema.parse(incomeWithoutCustomer);
        expect(result.customerName).toBeUndefined();
      });

      it('should reject invalid customer names', () => {
        expect(() => incomeTransactionSchema.parse({
          ...validIncomeTransaction,
          customerName: 'A'.repeat(256), // Too long
        })).toThrow();
      });
    });

    describe('Tax Amount Validation', () => {
      it('should accept valid tax amounts', () => {
        const validTaxAmounts = [0, 100, 2500.50];

        validTaxAmounts.forEach(taxAmount => {
          const result = incomeTransactionSchema.parse({
            ...validIncomeTransaction,
            taxAmount,
          });
          expect(result.taxAmount).toBe(taxAmount);
        });
      });

      it('should reject negative tax amounts', () => {
        expect(() => incomeTransactionSchema.parse({
          ...validIncomeTransaction,
          taxAmount: -100,
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
      status: 'APPROVED',
      category: 'OPERATIONAL',
      vendorName: 'Office Supplies Co.',
      receiptNumber: 'RCT-2024-015',
      isRecurring: false,
      approvedBy: 'John Manager',
    };

    it('should accept valid expense transaction data', () => {
      const result = expenseTransactionSchema.parse(validExpenseTransaction);
      
      expect(result.type).toBe('EXPENSE');
      expect(result.category).toBe('OPERATIONAL');
      expect(result.vendorName).toBe('Office Supplies Co.');
      expect(result.receiptNumber).toBe('RCT-2024-015');
      expect(result.isRecurring).toBe(false);
      expect(result.approvedBy).toBe('John Manager');
    });

    it('should apply expense-specific defaults', () => {
      const minimalExpense = {
        type: 'EXPENSE',
        amount: 5000,
        description: 'Office expense',
        transactionDate: '2024-01-10',
        paymentMethod: 'CASH',
      };

      const result = expenseTransactionSchema.parse(minimalExpense);
      
      expect(result.category).toBe('OTHER'); // Default category
      expect(result.isRecurring).toBe(false); // Default recurring
    });

    describe('Expense Category Validation', () => {
      it('should accept valid expense categories', () => {
        const validCategories = ['OPERATIONAL', 'MARKETING', 'ADMINISTRATIVE', 'OTHER'];

        validCategories.forEach(category => {
          const result = expenseTransactionSchema.parse({
            ...validExpenseTransaction,
            category,
          });
          expect(result.category).toBe(category);
        });
      });

      it('should reject invalid expense categories', () => {
        expect(() => expenseTransactionSchema.parse({
          ...validExpenseTransaction,
          category: 'INVALID',
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

    describe('Receipt Number Validation', () => {
      it('should accept valid receipt numbers', () => {
        const validReceiptNumbers = [
          'RCT-2024-015',
          'RECEIPT_789',
          'A1B2C3',
        ];

        validReceiptNumbers.forEach(receiptNumber => {
          const result = expenseTransactionSchema.parse({
            ...validExpenseTransaction,
            receiptNumber,
          });
          expect(result.receiptNumber).toBe(receiptNumber);
        });
      });

      it('should accept optional receipt number', () => {
        const { receiptNumber, ...expenseWithoutReceipt } = validExpenseTransaction;
        
        const result = expenseTransactionSchema.parse(expenseWithoutReceipt);
        expect(result.receiptNumber).toBeUndefined();
      });
    });

    describe('Recurring Transaction Validation', () => {
      it('should handle recurring flag correctly', () => {
        const recurringExpense = {
          ...validExpenseTransaction,
          isRecurring: true,
        };

        const result = expenseTransactionSchema.parse(recurringExpense);
        expect(result.isRecurring).toBe(true);
      });

      it('should apply default false for recurring', () => {
        const { isRecurring, ...expenseWithoutRecurring } = validExpenseTransaction;
        
        const result = expenseTransactionSchema.parse(expenseWithoutRecurring);
        expect(result.isRecurring).toBe(false);
      });
    });
  });

  describe('financeQuerySchema', () => {
    it('should accept valid query parameters', () => {
      const queryData = {
        page: 1,
        limit: 25,
        search: 'office',
        type: 'EXPENSE',
        status: 'APPROVED',
        paymentMethod: 'BANK_TRANSFER',
        fromDate: '2024-01-01T00:00:00Z',
        toDate: '2024-01-31T23:59:59Z',
        minAmount: 100,
        maxAmount: 10000,
        sortBy: 'transactionDate',
        sortOrder: 'asc',
      };

      const result = financeQuerySchema.parse(queryData);
      
      expect(result.page).toBe(1);
      expect(result.limit).toBe(25);
      expect(result.search).toBe('office');
      expect(result.type).toBe('EXPENSE');
      expect(result.status).toBe('APPROVED');
      expect(result.paymentMethod).toBe('BANK_TRANSFER');
      expect(result.fromDate).toBe('2024-01-01T00:00:00Z');
      expect(result.toDate).toBe('2024-01-31T23:59:59Z');
      expect(result.minAmount).toBe(100);
      expect(result.maxAmount).toBe(10000);
    });

    it('should apply default query values', () => {
      const result = financeQuerySchema.parse({});
      
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.sortBy).toBe('transactionDate');
      expect(result.sortOrder).toBe('desc');
    });

    it('should handle string coercion', () => {
      const result = financeQuerySchema.parse({
        page: '2',
        limit: '15',
        minAmount: '500',
        maxAmount: '5000',
      });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(15);
      expect(result.minAmount).toBe(500);
      expect(result.maxAmount).toBe(5000);
    });
  });

  describe('Date Range Validation', () => {
    it('should validate proper date ranges', () => {
      const validDateRange = {
        fromDate: '2024-01-01T00:00:00Z',
        toDate: '2024-01-31T23:59:59Z',
      };

      expect(() => validateDateRangeSchema.parse(validDateRange)).not.toThrow();
    });

    it('should reject invalid date ranges', () => {
      const invalidDateRange = {
        fromDate: '2024-01-31T00:00:00Z',
        toDate: '2024-01-01T23:59:59Z', // End before start
      };

      expect(() => validateDateRangeSchema.parse(invalidDateRange)).toThrow();
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
        status: 'PENDING', // High value should require approval
      };

      const result = baseTransactionSchema.parse(highValueTransaction);
      expect(result.amount).toBe(999999999.99);
      expect(result.status).toBe('PENDING');
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

    it('should validate recurring expense patterns', () => {
      const recurringExpense = {
        type: 'EXPENSE',
        amount: 5000,
        description: 'Monthly office rent',
        transactionDate: '2024-01-01',
        paymentMethod: 'BANK_TRANSFER',
        category: 'OPERATIONAL',
        isRecurring: true,
        vendorName: 'Property Management Co.',
      };

      const result = expenseTransactionSchema.parse(recurringExpense);
      expect(result.isRecurring).toBe(true);
      expect(result.category).toBe('OPERATIONAL');
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