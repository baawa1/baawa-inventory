/**
 * Comprehensive Unit Tests for Badge Helper Utilities
 * Tests badge configuration and rendering patterns
 */

import {
  getDiscrepancyBadgeConfig,
  getStockStatusBadgeConfig,
  getUserStatusBadgeConfig,
  getProductStatusBadgeConfig,
  getProfitMarginBadgeConfig,
  getGenericStatusBadgeConfig,
  type BadgeConfig,
} from '@/lib/utils/badge-helpers';

// Mock the constants and UI utilities
jest.mock('@/lib/constants/ui', () => ({
  getDiscrepancyVariant: jest.fn((discrepancy: number) => {
    if (discrepancy > 0) return 'destructive';
    if (discrepancy < 0) return 'secondary';
    return 'default';
  }),
  getStockStatusInfo: jest.fn((stock: number, minStock: number) => {
    if (stock <= 0) {
      return { variant: 'destructive', label: 'Out of Stock' };
    }
    if (stock <= minStock) {
      return { variant: 'secondary', label: 'Low Stock' };
    }
    return { variant: 'default', label: 'In Stock' };
  }),
  STATUS_COLORS: {
    PENDING: 'secondary',
    APPROVED: 'default',
    REJECTED: 'destructive',
    SUSPENDED: 'destructive',
    ACTIVE: 'default',
    INACTIVE: 'secondary',
  },
}));

jest.mock('@/lib/constants', () => ({
  PRODUCT_STATUS: {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    OUT_OF_STOCK: 'OUT_OF_STOCK',
    DISCONTINUED: 'DISCONTINUED',
  },
}));

describe('Badge Helper Utilities', () => {
  describe('getDiscrepancyBadgeConfig', () => {
    it('should return correct config for positive discrepancies', () => {
      const testCases = [
        { discrepancy: 1, expectedLabel: '+1' },
        { discrepancy: 5, expectedLabel: '+5' },
        { discrepancy: 100, expectedLabel: '+100' },
      ];

      testCases.forEach(({ discrepancy, expectedLabel }) => {
        const result = getDiscrepancyBadgeConfig(discrepancy);
        
        expect(result).toEqual({
          variant: 'destructive',
          label: expectedLabel,
        });
      });
    });

    it('should return correct config for negative discrepancies', () => {
      const testCases = [
        { discrepancy: -1, expectedLabel: '-1' },
        { discrepancy: -5, expectedLabel: '-5' },
        { discrepancy: -100, expectedLabel: '-100' },
      ];

      testCases.forEach(({ discrepancy, expectedLabel }) => {
        const result = getDiscrepancyBadgeConfig(discrepancy);
        
        expect(result).toEqual({
          variant: 'secondary',
          label: expectedLabel,
        });
      });
    });

    it('should return correct config for zero discrepancy', () => {
      const result = getDiscrepancyBadgeConfig(0);
      
      expect(result).toEqual({
        variant: 'default',
        label: '0',
      });
    });

    it('should handle decimal discrepancies', () => {
      const testCases = [
        { discrepancy: 1.5, expectedLabel: '+1.5' },
        { discrepancy: -2.7, expectedLabel: '-2.7' },
        { discrepancy: 0.0, expectedLabel: '0' },
      ];

      testCases.forEach(({ discrepancy, expectedLabel }) => {
        const result = getDiscrepancyBadgeConfig(discrepancy);
        
        expect(result.label).toBe(expectedLabel);
      });
    });
  });

  describe('getStockStatusBadgeConfig', () => {
    it('should return out of stock config for zero stock', () => {
      const result = getStockStatusBadgeConfig(0, 10);
      
      expect(result).toEqual({
        variant: 'destructive',
        label: 'Out of Stock',
      });
    });

    it('should return out of stock config for negative stock', () => {
      const result = getStockStatusBadgeConfig(-5, 10);
      
      expect(result).toEqual({
        variant: 'destructive',
        label: 'Out of Stock',
      });
    });

    it('should return low stock config when at minimum threshold', () => {
      const result = getStockStatusBadgeConfig(10, 10);
      
      expect(result).toEqual({
        variant: 'secondary',
        label: 'Low Stock',
      });
    });

    it('should return low stock config when below minimum threshold', () => {
      const result = getStockStatusBadgeConfig(5, 10);
      
      expect(result).toEqual({
        variant: 'secondary',
        label: 'Low Stock',
      });
    });

    it('should return in stock config when above minimum threshold', () => {
      const result = getStockStatusBadgeConfig(15, 10);
      
      expect(result).toEqual({
        variant: 'default',
        label: 'In Stock',
      });
    });

    it('should handle edge cases with minimum stock values', () => {
      const testCases = [
        { stock: 1, minStock: 0, expectedVariant: 'default' },
        { stock: 0, minStock: 0, expectedVariant: 'destructive' },
        { stock: 100, minStock: 1, expectedVariant: 'default' },
      ];

      testCases.forEach(({ stock, minStock, expectedVariant }) => {
        const result = getStockStatusBadgeConfig(stock, minStock);
        expect(result.variant).toBe(expectedVariant);
      });
    });
  });

  describe('getUserStatusBadgeConfig', () => {
    it('should return correct config for known user statuses', () => {
      const testCases = [
        { status: 'PENDING', expectedVariant: 'secondary' },
        { status: 'APPROVED', expectedVariant: 'default' },
        { status: 'REJECTED', expectedVariant: 'destructive' },
        { status: 'SUSPENDED', expectedVariant: 'destructive' },
        { status: 'ACTIVE', expectedVariant: 'default' },
        { status: 'INACTIVE', expectedVariant: 'secondary' },
      ];

      testCases.forEach(({ status, expectedVariant }) => {
        const result = getUserStatusBadgeConfig(status);
        
        expect(result).toEqual({
          variant: expectedVariant,
          label: status,
        });
      });
    });

    it('should return outline variant for unknown statuses', () => {
      const unknownStatuses = ['UNKNOWN', 'CUSTOM_STATUS', 'NEW_STATUS'];

      unknownStatuses.forEach(status => {
        const result = getUserStatusBadgeConfig(status);
        
        expect(result).toEqual({
          variant: 'outline',
          label: status,
        });
      });
    });

    it('should handle empty or null status', () => {
      const edgeCases = ['', null, undefined];

      edgeCases.forEach(status => {
        const result = getUserStatusBadgeConfig(status as string);
        
        expect(result.variant).toBe('outline');
        expect(result.label).toBe(status);
      });
    });

    it('should handle case sensitivity', () => {
      const testCases = [
        'pending',
        'PENDING',
        'Pending',
        'approved',
        'APPROVED',
      ];

      testCases.forEach(status => {
        const result = getUserStatusBadgeConfig(status);
        
        expect(result.label).toBe(status);
        expect(['secondary', 'default', 'destructive', 'outline']).toContain(result.variant);
      });
    });
  });

  describe('getProductStatusBadgeConfig', () => {
    it('should return default variant for ACTIVE status', () => {
      const result = getProductStatusBadgeConfig('ACTIVE');
      
      expect(result).toEqual({
        variant: 'default',
        label: 'Active',
      });
    });

    it('should return secondary variant for non-ACTIVE statuses', () => {
      const nonActiveStatuses = [
        'INACTIVE',
        'OUT_OF_STOCK',
        'DISCONTINUED',
        'UNKNOWN_STATUS',
      ];

      nonActiveStatuses.forEach(status => {
        const result = getProductStatusBadgeConfig(status);
        
        expect(result).toEqual({
          variant: 'secondary',
          label: 'Inactive',
        });
      });
    });

    it('should handle edge cases', () => {
      const edgeCases = ['', null, undefined, 'active', 'Active'];

      edgeCases.forEach(status => {
        const result = getProductStatusBadgeConfig(status as string);
        
        expect(result.variant).toBe('secondary');
        expect(result.label).toBe('Inactive');
      });
    });
  });

  describe('getProfitMarginBadgeConfig', () => {
    it('should return default variant for positive profit margins', () => {
      const testCases = [
        { margin: 0.01, expectedLabel: '0.01%' },
        { margin: 15.5, expectedLabel: '15.50%' },
        { margin: 100, expectedLabel: '100.00%' },
        { margin: 250.789, expectedLabel: '250.79%' },
      ];

      testCases.forEach(({ margin, expectedLabel }) => {
        const result = getProfitMarginBadgeConfig(margin);
        
        expect(result).toEqual({
          variant: 'default',
          label: expectedLabel,
        });
      });
    });

    it('should return secondary variant for zero or negative profit margins', () => {
      const testCases = [
        { margin: 0, expectedLabel: '0.00%' },
        { margin: -5.5, expectedLabel: '-5.50%' },
        { margin: -100, expectedLabel: '-100.00%' },
      ];

      testCases.forEach(({ margin, expectedLabel }) => {
        const result = getProfitMarginBadgeConfig(margin);
        
        expect(result).toEqual({
          variant: 'secondary',
          label: expectedLabel,
        });
      });
    });

    it('should format decimal places consistently', () => {
      const testCases = [
        { margin: 1, expectedLabel: '1.00%' },
        { margin: 1.1, expectedLabel: '1.10%' },
        { margin: 1.12, expectedLabel: '1.12%' },
        { margin: 1.123, expectedLabel: '1.12%' }, // Rounded to 2 decimal places
        { margin: 1.129, expectedLabel: '1.13%' }, // Rounded up
      ];

      testCases.forEach(({ margin, expectedLabel }) => {
        const result = getProfitMarginBadgeConfig(margin);
        expect(result.label).toBe(expectedLabel);
      });
    });

    it('should handle extreme values', () => {
      const extremeValues = [
        Number.MAX_SAFE_INTEGER,
        Number.MIN_SAFE_INTEGER,
        Infinity,
        -Infinity,
        NaN,
      ];

      extremeValues.forEach(value => {
        expect(() => {
          const result = getProfitMarginBadgeConfig(value);
          expect(typeof result.label).toBe('string');
          expect(['default', 'secondary']).toContain(result.variant);
        }).not.toThrow();
      });
    });
  });

  describe('getGenericStatusBadgeConfig', () => {
    it('should use provided status mapping', () => {
      const customMapping = {
        PROCESSING: { variant: 'secondary' as const, label: 'Processing...' },
        COMPLETE: { variant: 'default' as const, label: 'Completed' },
        ERROR: { variant: 'destructive' as const, label: 'Error occurred' },
      };

      const result = getGenericStatusBadgeConfig('PROCESSING', customMapping);
      
      expect(result).toEqual({
        variant: 'secondary',
        label: 'Processing...',
      });
    });

    it('should use status as label when no custom label provided', () => {
      const customMapping = {
        PROCESSING: { variant: 'secondary' as const },
      };

      const result = getGenericStatusBadgeConfig('PROCESSING', customMapping);
      
      expect(result).toEqual({
        variant: 'secondary',
        label: 'PROCESSING',
      });
    });

    it('should return outline variant for unmapped statuses', () => {
      const customMapping = {
        MAPPED_STATUS: { variant: 'default' as const },
      };

      const result = getGenericStatusBadgeConfig('UNMAPPED_STATUS', customMapping);
      
      expect(result).toEqual({
        variant: 'outline',
        label: 'UNMAPPED_STATUS',
      });
    });

    it('should handle empty mapping', () => {
      const result = getGenericStatusBadgeConfig('ANY_STATUS', {});
      
      expect(result).toEqual({
        variant: 'outline',
        label: 'ANY_STATUS',
      });
    });

    it('should handle no mapping provided', () => {
      const result = getGenericStatusBadgeConfig('ANY_STATUS');
      
      expect(result).toEqual({
        variant: 'outline',
        label: 'ANY_STATUS',
      });
    });

    it('should handle complex custom mappings', () => {
      const orderStatusMapping = {
        PENDING: { variant: 'secondary' as const, label: 'Awaiting Payment' },
        PAID: { variant: 'default' as const, label: 'Payment Received' },
        PROCESSING: { variant: 'secondary' as const, label: 'Being Processed' },
        SHIPPED: { variant: 'default' as const, label: 'Shipped Out' },
        DELIVERED: { variant: 'default' as const, label: 'Successfully Delivered' },
        CANCELLED: { variant: 'destructive' as const, label: 'Order Cancelled' },
        REFUNDED: { variant: 'outline' as const, label: 'Amount Refunded' },
      };

      const testCases = [
        { status: 'PENDING', expected: { variant: 'secondary', label: 'Awaiting Payment' } },
        { status: 'DELIVERED', expected: { variant: 'default', label: 'Successfully Delivered' } },
        { status: 'CANCELLED', expected: { variant: 'destructive', label: 'Order Cancelled' } },
        { status: 'UNKNOWN', expected: { variant: 'outline', label: 'UNKNOWN' } },
      ];

      testCases.forEach(({ status, expected }) => {
        const result = getGenericStatusBadgeConfig(status, orderStatusMapping);
        expect(result).toEqual(expected);
      });
    });
  });

  describe('Badge Configuration Consistency', () => {
    it('should return valid BadgeConfig objects for all functions', () => {
      const validVariants = ['default', 'secondary', 'destructive', 'outline'];

      // Test all badge functions return valid configurations
      const configurations: BadgeConfig[] = [
        getDiscrepancyBadgeConfig(5),
        getStockStatusBadgeConfig(10, 5),
        getUserStatusBadgeConfig('APPROVED'),
        getProductStatusBadgeConfig('ACTIVE'),
        getProfitMarginBadgeConfig(15.5),
        getGenericStatusBadgeConfig('TEST_STATUS'),
      ];

      configurations.forEach(config => {
        expect(config).toHaveProperty('variant');
        expect(config).toHaveProperty('label');
        expect(validVariants).toContain(config.variant);
        expect(typeof config.label).toBe('string');
      });
    });

    it('should handle all badge functions with edge case inputs', () => {
      const edgeCaseInputs = [
        '',
        null,
        undefined,
        0,
        -1,
        Infinity,
        NaN,
      ];

      edgeCaseInputs.forEach(input => {
        expect(() => {
          getUserStatusBadgeConfig(input as string);
          getProductStatusBadgeConfig(input as string);
          getGenericStatusBadgeConfig(input as string);
          
          if (typeof input === 'number') {
            getDiscrepancyBadgeConfig(input);
            getProfitMarginBadgeConfig(input);
            getStockStatusBadgeConfig(input, 10);
          }
        }).not.toThrow();
      });
    });

    it('should maintain consistent label formatting across functions', () => {
      // Labels should be strings and not empty unless explicitly allowed
      const results = [
        getDiscrepancyBadgeConfig(10),
        getStockStatusBadgeConfig(50, 10),
        getUserStatusBadgeConfig('ACTIVE'),
        getProductStatusBadgeConfig('ACTIVE'),
        getProfitMarginBadgeConfig(25.5),
        getGenericStatusBadgeConfig('CUSTOM_STATUS'),
      ];

      results.forEach(result => {
        expect(typeof result.label).toBe('string');
        expect(result.label.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle rapid successive calls efficiently', () => {
      const startTime = performance.now();
      
      // Simulate many badge configurations
      for (let i = 0; i < 1000; i++) {
        getDiscrepancyBadgeConfig(i % 100 - 50);
        getStockStatusBadgeConfig(i % 50, 10);
        getUserStatusBadgeConfig(`STATUS_${i % 5}`);
        getProfitMarginBadgeConfig(i % 100);
      }

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Should process many badge configs quickly (< 50ms)
      expect(executionTime).toBeLessThan(50);
    });

    it('should not throw errors with malicious input', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'DROP TABLE badges;--',
        ''.repeat(10000), // Very long string
        'ñöñ-äŧcïï-ßþrïñg', // Unicode characters
      ];

      maliciousInputs.forEach(input => {
        expect(() => {
          getUserStatusBadgeConfig(input);
          getProductStatusBadgeConfig(input);
          getGenericStatusBadgeConfig(input);
        }).not.toThrow();
      });
    });
  });
});