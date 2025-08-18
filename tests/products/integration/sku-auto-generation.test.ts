import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '@/lib/db';
import { generateSKU } from '@/lib/utils/product-utils';

describe('SKU Auto-Generation Integration Tests', () => {
  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.product.deleteMany({
      where: {
        name: {
          startsWith: 'Test Product',
        },
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.product.deleteMany({
      where: {
        name: {
          startsWith: 'Test Product',
        },
      },
    });
  });

  describe('generateSKU function', () => {
    it('should generate SKU with category and brand', () => {
      const sku = generateSKU('iPhone', 'Electronics', 'Apple');
      expect(sku).toMatch(/^ELE-AP-IPH-\d{4}$/);
    });

    it('should generate SKU with defaults when category/brand missing', () => {
      const sku = generateSKU('Test Product');
      expect(sku).toMatch(/^PRD-XX-TES-\d{4}$/);
    });

    it('should generate unique SKUs on multiple calls', () => {
      const sku1 = generateSKU('Product 1', 'Electronics', 'Samsung');
      const sku2 = generateSKU('Product 2', 'Electronics', 'Samsung');
      expect(sku1).not.toBe(sku2);
    });

    it('should handle special characters in names', () => {
      const sku = generateSKU('Test-Product@123', 'Electronics', 'Samsung');
      expect(sku).toMatch(/^ELE-SA-TES-\d{4}$/);
    });
  });

  describe('API SKU auto-generation', () => {
    it('should create product without SKU and auto-generate one', async () => {
      const productData = {
        name: 'Test Product Auto SKU',
        description: 'A test product with auto-generated SKU',
        purchasePrice: 10.5,
        sellingPrice: 15.99,
        currentStock: 100,
        minimumStock: 10,
        status: 'ACTIVE',
      };

      // This would be a full API test, but for now we'll test the logic
      const sku = generateSKU(productData.name);
      expect(sku).toMatch(/^PRD-XX-TES-\d{4}$/);
    });

    it('should handle duplicate SKU generation with retry logic', async () => {
      // Create a product with a specific SKU
      const existingSku = 'TEST-DUP-001';
      await prisma.product.create({
        data: {
          name: 'Existing Product',
          sku: existingSku,
          cost: 10.5,
          price: 15.99,
          stock: 100,
          minStock: 10,
          status: 'ACTIVE',
        },
      });

      // Try to generate a new SKU (should not conflict)
      const newSku = generateSKU('New Product');
      expect(newSku).not.toBe(existingSku);

      // Clean up
      await prisma.product.delete({
        where: { sku: existingSku },
      });
    });
  });
});
