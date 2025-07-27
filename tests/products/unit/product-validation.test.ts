import { describe, it, expect } from '@jest/globals';
import {
  createProductSchema,
  updateProductSchema,
} from '@/lib/validations/product';

describe('Product Validation Schemas', () => {
  describe('createProductSchema', () => {
    it('should validate a valid product', () => {
      const validProduct = {
        name: 'Test Product',
        sku: 'TEST-001',
        barcode: '1234567890123',
        description: 'A test product',
        categoryId: 1,
        brandId: 1,
        purchasePrice: 10.5,
        sellingPrice: 15.99,
        minimumStock: 5,
        maximumStock: 100,
        currentStock: 10,
        supplierId: 1,
        status: 'ACTIVE',
        unit: 'piece',
        weight: 0.5,
        dimensions: '10x5x2',
        color: 'Red',
        size: 'Medium',
        material: 'Cotton',
        tags: ['test', 'sample'],
        salePrice: 12.99,
        saleStartDate: new Date('2024-01-01T00:00:00Z'),
        saleEndDate: new Date('2024-12-31T23:59:59Z'),
        metaTitle: 'Test Product Meta Title',
        metaDescription: 'Test product meta description',
        seoKeywords: ['test', 'product', 'sample'],
        isFeatured: true,
        sortOrder: 1,
      };

      const result = createProductSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });

    it('should reject product without required fields', () => {
      const invalidProduct = {
        description: 'A test product',
        categoryId: 1,
      };

      const result = createProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(7); // name, sku, purchasePrice, sellingPrice, minimumStock, currentStock, status
      }
    });

    it('should reject invalid SKU format', () => {
      const invalidProduct = {
        name: 'Test Product',
        sku: 'test@001', // Invalid characters
        purchasePrice: 10.5,
        sellingPrice: 15.99,
        minimumStock: 5,
        currentStock: 10,
        status: 'ACTIVE',
      };

      const result = createProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
      if (!result.success) {
        const skuError = result.error.issues.find(issue =>
          issue.path.includes('sku')
        );
        expect(skuError).toBeDefined();
      }
    });

    it('should reject negative prices', () => {
      const invalidProduct = {
        name: 'Test Product',
        sku: 'TEST-001',
        purchasePrice: -10.5,
        sellingPrice: -15.99,
        minimumStock: 5,
        currentStock: 10,
        status: 'ACTIVE',
      };

      const result = createProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
      if (!result.success) {
        const priceErrors = result.error.issues.filter(
          issue =>
            issue.path.includes('purchasePrice') ||
            issue.path.includes('sellingPrice')
        );
        expect(priceErrors.length).toBeGreaterThan(0);
      }
    });

    it('should reject negative stock values', () => {
      const invalidProduct = {
        name: 'Test Product',
        sku: 'TEST-001',
        purchasePrice: 10.5,
        sellingPrice: 15.99,
        minimumStock: -5,
        currentStock: -10,
        status: 'ACTIVE',
      };

      const result = createProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
      if (!result.success) {
        const stockErrors = result.error.issues.filter(
          issue =>
            issue.path.includes('minimumStock') ||
            issue.path.includes('currentStock')
        );
        expect(stockErrors.length).toBeGreaterThan(0);
      }
    });

    it('should accept optional fields as null', () => {
      const productWithNulls = {
        name: 'Test Product',
        sku: 'TEST-001',
        barcode: null,
        description: null,
        categoryId: null,
        brandId: null,
        purchasePrice: 10.5,
        sellingPrice: 15.99,
        minimumStock: 5,
        maximumStock: null,
        currentStock: 10,
        supplierId: null,
        status: 'ACTIVE',
        imageUrl: null,
        notes: null,
        unit: 'piece',
        weight: null,
        dimensions: null,
        color: null,
        size: null,
        material: null,
        tags: [],
        salePrice: null,
        saleStartDate: null,
        saleEndDate: null,
        metaTitle: null,
        metaDescription: null,
        seoKeywords: [],
        isFeatured: false,
        sortOrder: null,
      };

      const result = createProductSchema.safeParse(productWithNulls);
      expect(result.success).toBe(true);
    });

    it('should validate field length limits', () => {
      const productWithLongFields = {
        name: 'A'.repeat(256), // Too long
        sku: 'TEST-001',
        description: 'A'.repeat(1001), // Too long
        purchasePrice: 10.5,
        sellingPrice: 15.99,
        minimumStock: 5,
        currentStock: 10,
        status: 'ACTIVE',
        unit: 'A'.repeat(21), // Too long
        dimensions: 'A'.repeat(101), // Too long
        color: 'A'.repeat(51), // Too long
        size: 'A'.repeat(51), // Too long
        material: 'A'.repeat(101), // Too long
        metaTitle: 'A'.repeat(256), // Too long
        metaDescription: 'A'.repeat(501), // Too long
      };

      const result = createProductSchema.safeParse(productWithLongFields);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it('should validate status enum values', () => {
      const validStatuses = [
        'ACTIVE',
        'INACTIVE',
        'OUT_OF_STOCK',
        'DISCONTINUED',
      ];

      validStatuses.forEach(status => {
        const product = {
          name: 'Test Product',
          sku: 'TEST-001',
          purchasePrice: 10.5,
          sellingPrice: 15.99,
          minimumStock: 5,
          currentStock: 10,
          status,
        };

        const result = createProductSchema.safeParse(product);
        expect(result.success).toBe(true);
      });

      const invalidProduct = {
        name: 'Test Product',
        sku: 'TEST-001',
        purchasePrice: 10.5,
        sellingPrice: 15.99,
        minimumStock: 5,
        currentStock: 10,
        status: 'invalid-status',
      };

      const result = createProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });
  });

  describe('updateProductSchema', () => {
    it('should validate partial updates', () => {
      const partialUpdate = {
        name: 'Updated Product Name',
        sellingPrice: 20.99,
        currentStock: 25,
      };

      const result = updateProductSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should accept all optional fields', () => {
      const fullUpdate = {
        name: 'Updated Product',
        description: 'Updated description',
        sku: 'UPDATED-001',
        barcode: '9876543210987',
        categoryId: 2,
        brandId: 2,
        supplierId: 2,
        purchasePrice: 15.5,
        sellingPrice: 25.99,
        currentStock: 20,
        minimumStock: 10,
        maximumStock: 200,
        status: 'ACTIVE',
        isArchived: false,
        unit: 'piece',
        weight: 1.0,
        dimensions: '15x10x5',
        color: 'Blue',
        size: 'Large',
        material: 'Polyester',
        tags: ['updated', 'new'],
        salePrice: 20.99,
        saleStartDate: new Date('2024-06-01T00:00:00Z'),
        saleEndDate: new Date('2024-08-31T23:59:59Z'),
        metaTitle: 'Updated Meta Title',
        metaDescription: 'Updated meta description',
        seoKeywords: ['updated', 'product'],
        isFeatured: true,
        sortOrder: 5,
      };

      const result = updateProductSchema.safeParse(fullUpdate);
      expect(result.success).toBe(true);
    });

    it('should reject invalid field values', () => {
      const invalidUpdate = {
        name: '',
        purchasePrice: -5,
        currentStock: -10,
        status: 'invalid',
      };

      const result = updateProductSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it('should validate date formats', () => {
      const updateWithInvalidDates = {
        name: 'Test Product',
        saleStartDate: 'invalid-date' as any,
        saleEndDate: '2024-13-45T25:70:99Z' as any,
      };

      const result = updateProductSchema.safeParse(updateWithInvalidDates);
      expect(result.success).toBe(false);
      if (!result.success) {
        const dateErrors = result.error.issues.filter(
          issue =>
            issue.path.includes('saleStartDate') ||
            issue.path.includes('saleEndDate')
        );
        expect(dateErrors.length).toBeGreaterThan(0);
      }
    });
  });
});
