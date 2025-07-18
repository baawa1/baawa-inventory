import { describe, it, expect } from "@jest/globals";
import {
  calculateStockStatus,
  calculateProfitMargin,
  calculateProfitAmount,
  generateSKU,
  validateBarcode,
  calculateSearchRelevance,
  formatCurrency,
} from "@/lib/utils/product-utils";

describe("Product Utility Functions", () => {
  describe("formatCurrency", () => {
    it("should format positive numbers correctly", () => {
      expect(formatCurrency(0)).toBe("₦0.00");
      expect(formatCurrency(10)).toBe("₦10.00");
      expect(formatCurrency(10.5)).toBe("₦10.50");
      expect(formatCurrency(10.55)).toBe("₦10.55");
      expect(formatCurrency(1000)).toBe("₦1,000.00");
      expect(formatCurrency(1000000)).toBe("₦1,000,000.00");
    });

    it("should format negative numbers correctly", () => {
      expect(formatCurrency(-10)).toBe("-₦10.00");
      expect(formatCurrency(-10.5)).toBe("-₦10.50");
      expect(formatCurrency(-1000)).toBe("-₦1,000.00");
    });

    it("should handle decimal precision correctly", () => {
      expect(formatCurrency(10.123)).toBe("₦10.12"); // Rounds down
      expect(formatCurrency(10.125)).toBe("₦10.13"); // Rounds up
      expect(formatCurrency(10.126)).toBe("₦10.13"); // Rounds up
    });

    it("should handle very large numbers", () => {
      expect(formatCurrency(999999999.99)).toBe("₦999,999,999.99");
      expect(formatCurrency(1000000000)).toBe("₦1,000,000,000.00");
    });

    it("should handle zero and edge cases", () => {
      expect(formatCurrency(0)).toBe("₦0.00");
      expect(formatCurrency(0.01)).toBe("₦0.01");
      expect(formatCurrency(0.001)).toBe("₦0.00"); // Rounds down
    });
  });

  describe("Stock Status Calculations", () => {
    it("should calculate stock status correctly", () => {
      // Out of stock
      expect(calculateStockStatus(0, 10)).toBe("out-of-stock");

      // Critical stock (50% or less of minimum)
      expect(calculateStockStatus(5, 10)).toBe("critical");
      expect(calculateStockStatus(3, 10)).toBe("critical");
      expect(calculateStockStatus(0, 10)).toBe("out-of-stock");

      // Low stock (between 50% and 100% of minimum)
      expect(calculateStockStatus(6, 10)).toBe("low");
      expect(calculateStockStatus(10, 10)).toBe("low");

      // Normal stock (above minimum)
      expect(calculateStockStatus(11, 10)).toBe("normal");
      expect(calculateStockStatus(20, 10)).toBe("normal");
    });

    it("should handle edge cases", () => {
      expect(calculateStockStatus(0, 0)).toBe("out-of-stock");
      expect(calculateStockStatus(1, 0)).toBe("normal");
      expect(calculateStockStatus(-1, 10)).toBe("out-of-stock"); // Negative stock treated as out-of-stock
    });
  });

  describe("Profit Margin Calculations", () => {
    it("should calculate profit margin correctly", () => {
      expect(calculateProfitMargin(100, 80)).toBe(25); // 25% margin
      expect(calculateProfitMargin(120, 100)).toBe(20); // 20% margin
      expect(calculateProfitMargin(50, 50)).toBe(0); // 0% margin
      expect(calculateProfitMargin(40, 50)).toBe(-20); // -20% margin (loss)
    });

    it("should calculate profit amount correctly", () => {
      expect(calculateProfitAmount(100, 80)).toBe(20);
      expect(calculateProfitAmount(120, 100)).toBe(20);
      expect(calculateProfitAmount(50, 50)).toBe(0);
      expect(calculateProfitAmount(40, 50)).toBe(-10);
    });

    it("should handle zero cost price", () => {
      expect(calculateProfitMargin(100, 0)).toBe(0);
      expect(calculateProfitAmount(100, 0)).toBe(100);
    });

    it("should handle edge cases", () => {
      expect(calculateProfitMargin(0, 100)).toBe(-100);
      expect(calculateProfitAmount(0, 100)).toBe(-100);
      expect(calculateProfitMargin(0, 0)).toBe(0);
      expect(calculateProfitAmount(0, 0)).toBe(0);
    });
  });

  describe("SKU Generation", () => {
    it("should generate valid SKU format", () => {
      const sku = generateSKU("Test Product", "Electronics", "Samsung");
      expect(sku).toMatch(/^[A-Z]{3}-[A-Z]{2}-[A-Z]{3}-\d{4}$/);
      expect(sku).toContain("ELE-SA-TES-");
    });

    it("should handle missing category and brand", () => {
      const sku = generateSKU("Test Product");
      expect(sku).toMatch(/^PRD-XX-TES-\d{4}$/);
    });

    it("should handle special characters in name", () => {
      const sku = generateSKU("Test-Product@123", "Electronics", "Samsung");
      expect(sku).toMatch(/^ELE-SA-TES-\d{4}$/);
    });

    it("should generate unique SKUs", () => {
      const sku1 = generateSKU("Product 1");
      const sku2 = generateSKU("Product 2");
      expect(sku1).not.toBe(sku2);
    });
  });

  describe("Barcode Validation", () => {
    it("should validate correct EAN-13 barcodes", () => {
      // Valid EAN-13 barcodes
      expect(validateBarcode("4006381333931")).toBe(true);
      expect(validateBarcode("9780201379624")).toBe(true);
    });

    it("should reject invalid barcodes", () => {
      expect(validateBarcode("123456789012")).toBe(false); // Too short
      expect(validateBarcode("12345678901234")).toBe(false); // Too long
      expect(validateBarcode("1234567890123")).toBe(false); // Invalid check digit
      expect(validateBarcode("123456789012a")).toBe(false); // Contains letters
      expect(validateBarcode("")).toBe(false); // Empty
    });

    it("should handle edge cases", () => {
      expect(validateBarcode("0000000000000")).toBe(true); // All zeros
      expect(validateBarcode("9999999999999")).toBe(false); // Invalid check digit
    });
  });

  describe("Product Search Relevance", () => {
    it("should calculate search relevance correctly", () => {
      const product = {
        name: "iPhone 14 Pro Max",
        sku: "IPH14PM-256GB",
        description: "Latest iPhone with advanced features",
      };

      expect(
        calculateSearchRelevance(
          "iPhone",
          product.name,
          product.sku,
          product.description
        )
      ).toBeGreaterThan(0);
      expect(
        calculateSearchRelevance(
          "IPH14PM",
          product.name,
          product.sku,
          product.description
        )
      ).toBeGreaterThan(0);
      expect(
        calculateSearchRelevance(
          "iPhone 14 Pro Max",
          product.name,
          product.sku,
          product.description
        )
      ).toBe(140);
      expect(
        calculateSearchRelevance(
          "unrelated",
          product.name,
          product.sku,
          product.description
        )
      ).toBe(0);
    });

    it("should prioritize exact matches", () => {
      const product = {
        name: "Test Product",
        sku: "TEST-001",
        description: "A test product",
      };

      const exactMatch = calculateSearchRelevance(
        "Test Product",
        product.name,
        product.sku,
        product.description
      );
      const partialMatch = calculateSearchRelevance(
        "Test",
        product.name,
        product.sku,
        product.description
      );

      expect(exactMatch).toBeGreaterThan(partialMatch);
    });
  });
});
