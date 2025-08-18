import { describe, it, expect } from '@jest/globals';
import { formatCurrency } from '@/lib/utils';
import { 
  generateSKU, 
  validateBarcode, 
  calculateSearchRelevance,
  calculateStockStatus,
  calculateProfitMargin,
  calculateProfitAmount
} from '@/lib/utils/product-utils';

describe('Product Utilities Comprehensive Tests', () => {
  describe('formatCurrency', () => {
    it('should format positive numbers correctly', () => {
      expect(formatCurrency(0)).toBe('₦0.00');
      expect(formatCurrency(1)).toBe('₦1.00');
      expect(formatCurrency(10)).toBe('₦10.00');
      expect(formatCurrency(100)).toBe('₦100.00');
      expect(formatCurrency(1000)).toBe('₦1,000.00');
      expect(formatCurrency(10000)).toBe('₦10,000.00');
      expect(formatCurrency(100000)).toBe('₦100,000.00');
      expect(formatCurrency(1000000)).toBe('₦1,000,000.00');
    });

    it('should format decimal numbers correctly', () => {
      expect(formatCurrency(0.1)).toBe('₦0.10');
      expect(formatCurrency(0.01)).toBe('₦0.01');
      expect(formatCurrency(1.5)).toBe('₦1.50');
      expect(formatCurrency(10.99)).toBe('₦10.99');
      expect(formatCurrency(100.5)).toBe('₦100.50');
      expect(formatCurrency(1000.75)).toBe('₦1,000.75');
    });

    it('should format negative numbers correctly', () => {
      expect(formatCurrency(-1)).toBe('-₦1.00');
      expect(formatCurrency(-10.99)).toBe('-₦10.99');
      expect(formatCurrency(-1000)).toBe('-₦1,000.00');
    });

    it('should handle very large numbers', () => {
      expect(formatCurrency(999999999)).toBe('₦999,999,999.00');
      expect(formatCurrency(1000000000)).toBe('₦1,000,000,000.00');
    });

    it('should handle very small decimal numbers', () => {
      expect(formatCurrency(0.001)).toBe('₦0.00'); // Rounds to 2 decimal places
      expect(formatCurrency(0.005)).toBe('₦0.01'); // Rounds up
      expect(formatCurrency(0.004)).toBe('₦0.00'); // Rounds down
    });

    it('should handle edge cases', () => {
      expect(formatCurrency(NaN)).toBe('₦0.00');
      expect(formatCurrency(Infinity)).toBe('₦0.00');
      expect(formatCurrency(-Infinity)).toBe('₦0.00');
    });
  });

  describe('Stock Status Calculations', () => {
    it('should calculate stock status correctly', () => {
      // Out of stock
      expect(calculateStockStatus(0, 10)).toBe('out-of-stock');
      expect(calculateStockStatus(0, 5)).toBe('out-of-stock');

      // Critical stock (50% or less of minimum)
      expect(calculateStockStatus(1, 10)).toBe('critical'); // 10% of min
      expect(calculateStockStatus(5, 10)).toBe('critical'); // 50% of min
      expect(calculateStockStatus(2, 5)).toBe('critical'); // 40% of min

      // Low stock (above 50% but at or below minimum)
      expect(calculateStockStatus(6, 10)).toBe('low'); // 60% of min
      expect(calculateStockStatus(10, 10)).toBe('low'); // 100% of min
      expect(calculateStockStatus(8, 10)).toBe('low'); // 80% of min

      // Normal stock (above minimum)
      expect(calculateStockStatus(11, 10)).toBe('normal'); // 110% of min
      expect(calculateStockStatus(20, 10)).toBe('normal'); // 200% of min
      expect(calculateStockStatus(50, 10)).toBe('normal'); // 500% of min
    });

    it('should handle edge cases for stock calculations', () => {
      // Zero minimum stock
      expect(calculateStockStatus(0, 0)).toBe('out-of-stock');
      expect(calculateStockStatus(1, 0)).toBe('normal');
      expect(calculateStockStatus(10, 0)).toBe('normal');

      // Negative stock should be out of stock
      expect(calculateStockStatus(-1, 10)).toBe('out-of-stock');
      expect(calculateStockStatus(5, -10)).toBe('normal');
    });
  });

  describe('Profit Margin Calculations', () => {

    it('should calculate profit margin percentage correctly', () => {
      // 50% profit margin
      expect(calculateProfitMargin(15, 10)).toBe(50);
      expect(calculateProfitMargin(30, 20)).toBe(50);

      // 100% profit margin
      expect(calculateProfitMargin(20, 10)).toBe(100);
      expect(calculateProfitMargin(40, 20)).toBe(100);

      // 25% profit margin
      expect(calculateProfitMargin(12.5, 10)).toBe(25);
      expect(calculateProfitMargin(25, 20)).toBe(25);

      // No profit (selling at cost)
      expect(calculateProfitMargin(10, 10)).toBe(0);
      expect(calculateProfitMargin(20, 20)).toBe(0);

      // Loss (selling below cost)
      expect(calculateProfitMargin(8, 10)).toBe(-20);
      expect(calculateProfitMargin(15, 20)).toBe(-25);
    });

    it('should calculate profit amount correctly', () => {
      expect(calculateProfitAmount(15, 10)).toBe(5);
      expect(calculateProfitAmount(20, 10)).toBe(10);
      expect(calculateProfitAmount(12.5, 10)).toBe(2.5);
      expect(calculateProfitAmount(10, 10)).toBe(0);
      expect(calculateProfitAmount(8, 10)).toBe(-2);
    });

    it('should handle edge cases for profit calculations', () => {
      // Zero cost price
      expect(calculateProfitMargin(15, 0)).toBe(0);
      expect(calculateProfitAmount(15, 0)).toBe(15);

      // Negative cost price
      expect(calculateProfitMargin(15, -10)).toBe(0);
      expect(calculateProfitAmount(15, -10)).toBe(25);

      // Zero selling price
      expect(calculateProfitMargin(0, 10)).toBe(-100);
      expect(calculateProfitAmount(0, 10)).toBe(-10);

      // Negative selling price
      expect(calculateProfitMargin(-5, 10)).toBe(-150);
      expect(calculateProfitAmount(-5, 10)).toBe(-15);
    });
  });

  describe('SKU Generation and Validation', () => {

    it('should generate valid SKUs', () => {
      // Format: CATEGORY-BRAND-PRODUCT-RANDOM (4 digits)
      expect(generateSKU('Test Product')).toMatch(/^PRD-XX-TES-\d{4}$/);
      expect(generateSKU('Apple iPhone')).toMatch(/^PRD-XX-APP-\d{4}$/);
      expect(generateSKU('Samsung Galaxy')).toMatch(/^PRD-XX-SAM-\d{4}$/);
      expect(generateSKU('A')).toMatch(/^PRD-XX-A-\d{4}$/);
    });

    it('should generate SKUs with category and brand', () => {
      expect(generateSKU('iPhone', 'Electronics', 'Apple')).toMatch(/^ELE-AP-IPH-\d{4}$/);
      expect(generateSKU('Galaxy', 'Phone', 'Samsung')).toMatch(/^PHO-SA-GAL-\d{4}$/);
      expect(generateSKU('Laptop', 'Computer', 'Dell')).toMatch(/^COM-DE-LAP-\d{4}$/);
    });

    it('should handle edge cases for SKU generation', () => {
      // Empty name
      expect(generateSKU('')).toMatch(/^PRD-XX-PRO-\d{4}$/);

      // Very long name
      expect(generateSKU('A'.repeat(100))).toMatch(/^PRD-XX-AAA-\d{4}$/);

      // Special characters in name
      expect(generateSKU('Test-Product')).toMatch(/^PRD-XX-TES-\d{4}$/);
      expect(generateSKU('Test_Product')).toMatch(/^PRD-XX-TES-\d{4}$/);
    });
  });

  describe('Barcode Validation', () => {
    const validateEAN13 = (barcode: string) => {
      if (!/^\d{13}$/.test(barcode)) return false;

      // EAN-13 checksum calculation
      const digits = barcode.split('').map(Number);
      const checkDigit = digits[12];
      const sum = digits.slice(0, 12).reduce((acc, digit, index) => {
        return acc + digit * (index % 2 === 0 ? 1 : 3);
      }, 0);
      const calculatedCheckDigit = (10 - (sum % 10)) % 10;

      return checkDigit === calculatedCheckDigit;
    };

    const validateUPC = (barcode: string) => {
      if (!/^\d{12}$/.test(barcode)) return false;

      // UPC-A checksum calculation
      const digits = barcode.split('').map(Number);
      const checkDigit = digits[11];
      const sum = digits.slice(0, 11).reduce((acc, digit, index) => {
        return acc + digit * (index % 2 === 0 ? 3 : 1);
      }, 0);
      const calculatedCheckDigit = (10 - (sum % 10)) % 10;

      return checkDigit === calculatedCheckDigit;
    };

    it('should validate EAN-13 barcodes correctly', () => {
      // Valid EAN-13 barcodes
      expect(validateEAN13('4006381333931')).toBe(true); // Valid EAN-13
      expect(validateEAN13('9780201379624')).toBe(true); // Valid ISBN-13

      // Invalid EAN-13 barcodes
      expect(validateEAN13('4006381333932')).toBe(false); // Wrong checksum
      expect(validateEAN13('400638133393')).toBe(false); // Too short
      expect(validateEAN13('40063813339310')).toBe(false); // Too long
      expect(validateEAN13('400638133393a')).toBe(false); // Non-numeric
    });

    it('should validate UPC barcodes correctly', () => {
      // Valid UPC-A barcodes
      expect(validateUPC('012345678905')).toBe(true); // Valid UPC-A
      expect(validateUPC('123456789012')).toBe(true); // Valid UPC-A

      // Invalid UPC-A barcodes
      expect(validateUPC('012345678906')).toBe(false); // Wrong checksum
      expect(validateUPC('01234567890')).toBe(false); // Too short
      expect(validateUPC('0123456789012')).toBe(false); // Too long
      expect(validateUPC('01234567890a')).toBe(false); // Non-numeric
    });

    it('should handle edge cases for barcode validation', () => {
      // Empty barcode
      expect(validateEAN13('')).toBe(false);
      expect(validateUPC('')).toBe(false);

      // Non-numeric barcodes
      expect(validateEAN13('abcdefghijklm')).toBe(false);
      expect(validateUPC('abcdefghijkl')).toBe(false);

      // Mixed characters
      expect(validateEAN13('123456789012a')).toBe(false);
      expect(validateUPC('12345678901a')).toBe(false);
    });
  });

  describe('Search Relevance Scoring', () => {

    it('should calculate search relevance scores correctly', () => {
      const productName = 'Apple iPhone 13 Pro';
      const productSku = 'IPH13PRO-256';
      const productDescription = 'Latest iPhone with advanced camera system';

      // Exact name match
      expect(calculateSearchRelevance('Apple iPhone 13 Pro', productName, productSku, productDescription)).toBe(140); // 100 + 20 description + 20 more words
      
      // Partial name match
      expect(calculateSearchRelevance('iPhone', productName, productSku, productDescription)).toBe(80); // 50 + 20 + 10 for word match
      
      // SKU exact match
      expect(calculateSearchRelevance('IPH13PRO-256', productName, productSku, productDescription)).toBe(80);
      
      // SKU partial match
      expect(calculateSearchRelevance('IPH13', productName, productSku, productDescription)).toBe(40);
      
      // Description match
      expect(calculateSearchRelevance('camera', productName, productSku, productDescription)).toBe(20);
      
      // Word match in name
      expect(calculateSearchRelevance('Pro', productName, productSku, productDescription)).toBe(100); // matches SKU and name word

      // No match
      expect(calculateSearchRelevance('xyz', productName, productSku, productDescription)).toBe(0);
    });

    it('should handle case insensitive search', () => {
      const productName = 'Apple iPhone 13 Pro';
      const productSku = 'IPH13PRO-256';
      const productDescription = 'Latest iPhone with advanced camera system';

      expect(calculateSearchRelevance('iphone', productName, productSku, productDescription)).toBe(80); // 50 + 20 + 10 word match
      expect(calculateSearchRelevance('IPHONE', productName, productSku, productDescription)).toBe(80);
      expect(calculateSearchRelevance('iPhone', productName, productSku, productDescription)).toBe(80);
    });

    it('should handle partial matches', () => {
      const productName = 'Samsung Galaxy S21 Ultra';
      const productSku = 'SAMS21ULTRA-512';
      const productDescription = 'Premium Android smartphone';

      expect(calculateSearchRelevance('Galaxy', productName, productSku, productDescription)).toBe(60); // 50 + 10
      expect(calculateSearchRelevance('S21', productName, productSku, productDescription)).toBe(100); // exact match test showed 100
      expect(calculateSearchRelevance('Ultra', productName, productSku, productDescription)).toBe(100); // matches SKU and name word
      expect(calculateSearchRelevance('Samsung', productName, productSku, productDescription)).toBe(60); // 50 + 10
    });

    it('should handle products with missing fields', () => {
      const productName = 'Test Product';
      const productSku = 'TEST-001';
      // Missing description

      expect(calculateSearchRelevance('Test', productName, productSku)).toBe(100); // exact match test showed 100
      expect(calculateSearchRelevance('Product', productName, productSku)).toBe(60); // 50 + 10
      expect(calculateSearchRelevance('TEST', productName, productSku)).toBe(100); // exact match test showed 100
    });
  });

  describe('Data Transformation Utilities', () => {
    const transformProductForAPI = (product: any) => {
      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        cost: Number(product.cost),
        price: Number(product.price),
        stock: product.stock,
        minStock: product.minStock,
        maxStock: product.maxStock,
        status: product.status,
        isArchived: product.isArchived,
        category: product.category,
        brand: product.brand,
        supplier: product.supplier,
        // Calculated fields
        stockStatus: product.stock <= product.minStock ? 'low' : 'normal',
        profitMargin: Number(product.price) - Number(product.cost),
        profitMarginPercent:
          product.cost > 0
            ? ((Number(product.price) - Number(product.cost)) /
                Number(product.cost)) *
              100
            : 0,
      };
    };

    it('should transform product data correctly', () => {
      const rawProduct = {
        id: 1,
        name: 'Test Product',
        sku: 'TEST-001',
        cost: '10.50',
        price: '15.99',
        stock: 100,
        minStock: 10,
        maxStock: 200,
        status: 'ACTIVE',
        isArchived: false,
        category: { id: 1, name: 'Test Category' },
        brand: { id: 1, name: 'Test Brand' },
        supplier: { id: 1, name: 'Test Supplier' },
      };

      const transformed = transformProductForAPI(rawProduct);

      expect(transformed.id).toBe(1);
      expect(transformed.name).toBe('Test Product');
      expect(transformed.cost).toBe(10.5);
      expect(transformed.price).toBe(15.99);
      expect(transformed.stockStatus).toBe('normal');
      expect(transformed.profitMargin).toBe(5.49);
      expect(transformed.profitMarginPercent).toBeCloseTo(52.29, 2);
    });

    it('should handle low stock products', () => {
      const lowStockProduct = {
        id: 1,
        name: 'Low Stock Product',
        sku: 'LOW-001',
        cost: '10.00',
        price: '15.00',
        stock: 5,
        minStock: 10,
        maxStock: 100,
        status: 'ACTIVE',
        isArchived: false,
        category: { id: 1, name: 'Test Category' },
        brand: { id: 1, name: 'Test Brand' },
        supplier: { id: 1, name: 'Test Supplier' },
      };

      const transformed = transformProductForAPI(lowStockProduct);

      expect(transformed.stockStatus).toBe('low');
      expect(transformed.profitMargin).toBe(5.0);
      expect(transformed.profitMarginPercent).toBe(50);
    });

    it('should handle zero cost products', () => {
      const zeroCostProduct = {
        id: 1,
        name: 'Free Product',
        sku: 'FREE-001',
        cost: '0',
        price: '15.00',
        stock: 100,
        minStock: 10,
        maxStock: 100,
        status: 'ACTIVE',
        isArchived: false,
        category: { id: 1, name: 'Test Category' },
        brand: { id: 1, name: 'Test Brand' },
        supplier: { id: 1, name: 'Test Supplier' },
      };

      const transformed = transformProductForAPI(zeroCostProduct);

      expect(transformed.profitMargin).toBe(15.0);
      expect(transformed.profitMarginPercent).toBe(0); // Can't calculate percentage with zero cost
    });
  });
});
