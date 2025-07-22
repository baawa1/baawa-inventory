import { describe, it, expect } from "@jest/globals";
import { formatCurrency } from "@/lib/utils";

describe("Product Utilities Comprehensive Tests", () => {
  describe("formatCurrency", () => {
    it("should format positive numbers correctly", () => {
      expect(formatCurrency(0)).toBe("₦0.00");
      expect(formatCurrency(1)).toBe("₦1.00");
      expect(formatCurrency(10)).toBe("₦10.00");
      expect(formatCurrency(100)).toBe("₦100.00");
      expect(formatCurrency(1000)).toBe("₦1,000.00");
      expect(formatCurrency(10000)).toBe("₦10,000.00");
      expect(formatCurrency(100000)).toBe("₦100,000.00");
      expect(formatCurrency(1000000)).toBe("₦1,000,000.00");
    });

    it("should format decimal numbers correctly", () => {
      expect(formatCurrency(0.1)).toBe("₦0.10");
      expect(formatCurrency(0.01)).toBe("₦0.01");
      expect(formatCurrency(1.5)).toBe("₦1.50");
      expect(formatCurrency(10.99)).toBe("₦10.99");
      expect(formatCurrency(100.5)).toBe("₦100.50");
      expect(formatCurrency(1000.75)).toBe("₦1,000.75");
    });

    it("should format negative numbers correctly", () => {
      expect(formatCurrency(-1)).toBe("-₦1.00");
      expect(formatCurrency(-10.99)).toBe("-₦10.99");
      expect(formatCurrency(-1000)).toBe("-₦1,000.00");
    });

    it("should handle very large numbers", () => {
      expect(formatCurrency(999999999)).toBe("₦999,999,999.00");
      expect(formatCurrency(1000000000)).toBe("₦1,000,000,000.00");
    });

    it("should handle very small decimal numbers", () => {
      expect(formatCurrency(0.001)).toBe("₦0.00"); // Rounds to 2 decimal places
      expect(formatCurrency(0.005)).toBe("₦0.01"); // Rounds up
      expect(formatCurrency(0.004)).toBe("₦0.00"); // Rounds down
    });

    it("should handle edge cases", () => {
      expect(formatCurrency(NaN)).toBe("₦0.00");
      expect(formatCurrency(Infinity)).toBe("₦0.00");
      expect(formatCurrency(-Infinity)).toBe("₦0.00");
    });
  });

  describe("Stock Status Calculations", () => {
    const calculateStockStatus = (currentStock: number, minStock: number) => {
      if (currentStock === 0) return "OUT_OF_STOCK";
      if (currentStock <= minStock * 0.5) return "CRITICAL";
      if (currentStock <= minStock) return "LOW";
      return "NORMAL";
    };

    const getStockStatusColor = (currentStock: number, minStock: number) => {
      if (currentStock === 0) return "destructive";
      if (currentStock <= minStock * 0.5) return "destructive";
      if (currentStock <= minStock) return "secondary";
      return "default";
    };

    it("should calculate stock status correctly", () => {
      // Out of stock
      expect(calculateStockStatus(0, 10)).toBe("OUT_OF_STOCK");
      expect(calculateStockStatus(0, 5)).toBe("OUT_OF_STOCK");

      // Critical stock (50% or less of minimum)
      expect(calculateStockStatus(1, 10)).toBe("CRITICAL"); // 10% of min
      expect(calculateStockStatus(5, 10)).toBe("CRITICAL"); // 50% of min
      expect(calculateStockStatus(2, 5)).toBe("CRITICAL"); // 40% of min

      // Low stock (above 50% but at or below minimum)
      expect(calculateStockStatus(6, 10)).toBe("LOW"); // 60% of min
      expect(calculateStockStatus(10, 10)).toBe("LOW"); // 100% of min
      expect(calculateStockStatus(8, 10)).toBe("LOW"); // 80% of min

      // Normal stock (above minimum)
      expect(calculateStockStatus(11, 10)).toBe("NORMAL"); // 110% of min
      expect(calculateStockStatus(20, 10)).toBe("NORMAL"); // 200% of min
      expect(calculateStockStatus(50, 10)).toBe("NORMAL"); // 500% of min
    });

    it("should return correct stock status colors", () => {
      // Destructive (out of stock or critical)
      expect(getStockStatusColor(0, 10)).toBe("destructive");
      expect(getStockStatusColor(1, 10)).toBe("destructive");
      expect(getStockStatusColor(5, 10)).toBe("destructive");

      // Secondary (low stock)
      expect(getStockStatusColor(6, 10)).toBe("secondary");
      expect(getStockStatusColor(10, 10)).toBe("secondary");

      // Default (normal stock)
      expect(getStockStatusColor(11, 10)).toBe("default");
      expect(getStockStatusColor(20, 10)).toBe("default");
    });

    it("should handle edge cases for stock calculations", () => {
      // Zero minimum stock
      expect(calculateStockStatus(0, 0)).toBe("OUT_OF_STOCK");
      expect(calculateStockStatus(1, 0)).toBe("NORMAL");
      expect(calculateStockStatus(10, 0)).toBe("NORMAL");

      // Negative values (should handle gracefully)
      expect(calculateStockStatus(-1, 10)).toBe("CRITICAL");
      expect(calculateStockStatus(5, -10)).toBe("NORMAL");
    });
  });

  describe("Profit Margin Calculations", () => {
    const calculateProfitMargin = (sellingPrice: number, costPrice: number) => {
      if (costPrice <= 0) return 0;
      return ((sellingPrice - costPrice) / costPrice) * 100;
    };

    const calculateProfitAmount = (sellingPrice: number, costPrice: number) => {
      return sellingPrice - costPrice;
    };

    it("should calculate profit margin percentage correctly", () => {
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

    it("should calculate profit amount correctly", () => {
      expect(calculateProfitAmount(15, 10)).toBe(5);
      expect(calculateProfitAmount(20, 10)).toBe(10);
      expect(calculateProfitAmount(12.5, 10)).toBe(2.5);
      expect(calculateProfitAmount(10, 10)).toBe(0);
      expect(calculateProfitAmount(8, 10)).toBe(-2);
    });

    it("should handle edge cases for profit calculations", () => {
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

  describe("SKU Generation and Validation", () => {
    const generateSKU = (name: string, id?: number) => {
      const prefix = name.substring(0, 3).toUpperCase();
      const timestamp = Date.now().toString().slice(-6);
      const suffix = id ? id.toString().padStart(3, "0") : timestamp;
      return `${prefix}-${suffix}`;
    };

    const validateSKU = (sku: string) => {
      // SKU should be 3-100 characters, alphanumeric with hyphens and underscores
      const skuRegex = /^[A-Z0-9_-]{3,100}$/;
      return skuRegex.test(sku);
    };

    it("should generate valid SKUs", () => {
      expect(generateSKU("Test Product")).toMatch(/^TES-\d{6}$/);
      expect(generateSKU("Apple iPhone")).toMatch(/^APP-\d{6}$/);
      expect(generateSKU("Samsung Galaxy")).toMatch(/^SAM-\d{6}$/);
      expect(generateSKU("A")).toMatch(/^A--\d{6}$/);
    });

    it("should generate SKUs with custom IDs", () => {
      expect(generateSKU("Test Product", 1)).toBe("TES-001");
      expect(generateSKU("Apple iPhone", 123)).toBe("APP-123");
      expect(generateSKU("Samsung Galaxy", 999)).toBe("SAM-999");
    });

    it("should validate SKU format correctly", () => {
      // Valid SKUs
      expect(validateSKU("TEST-001")).toBe(true);
      expect(validateSKU("PROD_123")).toBe(true);
      expect(validateSKU("SKU123")).toBe(true);
      expect(validateSKU("A-B-C")).toBe(true);
      expect(validateSKU("123456")).toBe(true);

      // Invalid SKUs
      expect(validateSKU("")).toBe(false); // Too short
      expect(validateSKU("AB")).toBe(false); // Too short
      expect(validateSKU("a".repeat(101))).toBe(false); // Too long
      expect(validateSKU("test-001")).toBe(false); // Lowercase
      expect(validateSKU("TEST 001")).toBe(false); // Space not allowed
      expect(validateSKU("TEST@001")).toBe(false); // Special character not allowed
    });

    it("should handle edge cases for SKU generation", () => {
      // Empty name
      expect(generateSKU("")).toMatch(/^---\d{6}$/);

      // Very long name
      expect(generateSKU("A".repeat(100))).toMatch(/^AAA-\d{6}$/);

      // Special characters in name
      expect(generateSKU("Test-Product")).toMatch(/^TES-\d{6}$/);
      expect(generateSKU("Test_Product")).toMatch(/^TES-\d{6}$/);
    });
  });

  describe("Barcode Validation", () => {
    const validateEAN13 = (barcode: string) => {
      if (!/^\d{13}$/.test(barcode)) return false;

      // EAN-13 checksum calculation
      const digits = barcode.split("").map(Number);
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
      const digits = barcode.split("").map(Number);
      const checkDigit = digits[11];
      const sum = digits.slice(0, 11).reduce((acc, digit, index) => {
        return acc + digit * (index % 2 === 0 ? 3 : 1);
      }, 0);
      const calculatedCheckDigit = (10 - (sum % 10)) % 10;

      return checkDigit === calculatedCheckDigit;
    };

    it("should validate EAN-13 barcodes correctly", () => {
      // Valid EAN-13 barcodes
      expect(validateEAN13("4006381333931")).toBe(true); // Valid EAN-13
      expect(validateEAN13("9780201379624")).toBe(true); // Valid ISBN-13

      // Invalid EAN-13 barcodes
      expect(validateEAN13("4006381333932")).toBe(false); // Wrong checksum
      expect(validateEAN13("400638133393")).toBe(false); // Too short
      expect(validateEAN13("40063813339310")).toBe(false); // Too long
      expect(validateEAN13("400638133393a")).toBe(false); // Non-numeric
    });

    it("should validate UPC barcodes correctly", () => {
      // Valid UPC-A barcodes
      expect(validateUPC("012345678905")).toBe(true); // Valid UPC-A
      expect(validateUPC("123456789012")).toBe(true); // Valid UPC-A

      // Invalid UPC-A barcodes
      expect(validateUPC("012345678906")).toBe(false); // Wrong checksum
      expect(validateUPC("01234567890")).toBe(false); // Too short
      expect(validateUPC("0123456789012")).toBe(false); // Too long
      expect(validateUPC("01234567890a")).toBe(false); // Non-numeric
    });

    it("should handle edge cases for barcode validation", () => {
      // Empty barcode
      expect(validateEAN13("")).toBe(false);
      expect(validateUPC("")).toBe(false);

      // Non-numeric barcodes
      expect(validateEAN13("abcdefghijklm")).toBe(false);
      expect(validateUPC("abcdefghijkl")).toBe(false);

      // Mixed characters
      expect(validateEAN13("123456789012a")).toBe(false);
      expect(validateUPC("12345678901a")).toBe(false);
    });
  });

  describe("Search Relevance Scoring", () => {
    const calculateSearchScore = (product: any, searchTerm: string) => {
      const term = searchTerm.toLowerCase();
      let score = 0;

      // Exact name match (highest priority)
      if (product.name.toLowerCase().includes(term)) {
        score += 100;
        if (product.name.toLowerCase().startsWith(term)) {
          score += 50; // Bonus for starting with search term
        }
      }

      // SKU match (high priority)
      if (product.sku.toLowerCase().includes(term)) {
        score += 80;
        if (product.sku.toLowerCase().startsWith(term)) {
          score += 40;
        }
      }

      // Barcode match (medium priority)
      if (product.barcode && product.barcode.toLowerCase().includes(term)) {
        score += 60;
      }

      // Category match (low priority)
      if (
        product.category &&
        product.category.name.toLowerCase().includes(term)
      ) {
        score += 30;
      }

      // Brand match (low priority)
      if (product.brand && product.brand.name.toLowerCase().includes(term)) {
        score += 30;
      }

      // Description match (very low priority)
      if (
        product.description &&
        product.description.toLowerCase().includes(term)
      ) {
        score += 10;
      }

      return score;
    };

    it("should calculate search relevance scores correctly", () => {
      const product = {
        name: "Apple iPhone 13 Pro",
        sku: "IPH13PRO-256",
        barcode: "1234567890123",
        category: { name: "Smartphones" },
        brand: { name: "Apple" },
        description: "Latest iPhone with advanced camera system",
      };

      // Exact name match
      expect(calculateSearchScore(product, "iPhone")).toBe(150); // 100 + 50 for starts with
      expect(calculateSearchScore(product, "Apple")).toBe(130); // 100 + 30 for brand
      expect(calculateSearchScore(product, "13")).toBe(100); // 100 for name match

      // SKU match
      expect(calculateSearchScore(product, "IPH13")).toBe(120); // 80 + 40 for starts with
      expect(calculateSearchScore(product, "PRO")).toBe(80); // 80 for SKU match

      // Barcode match
      expect(calculateSearchScore(product, "123456")).toBe(60); // 60 for barcode match

      // Category match
      expect(calculateSearchScore(product, "Smartphone")).toBe(30); // 30 for category match

      // Brand match
      expect(calculateSearchScore(product, "Apple")).toBe(130); // 100 + 30 for brand

      // Description match
      expect(calculateSearchScore(product, "camera")).toBe(110); // 100 + 10 for description

      // No match
      expect(calculateSearchScore(product, "xyz")).toBe(0);
    });

    it("should handle case insensitive search", () => {
      const product = {
        name: "Apple iPhone 13 Pro",
        sku: "IPH13PRO-256",
        barcode: "1234567890123",
        category: { name: "Smartphones" },
        brand: { name: "Apple" },
        description: "Latest iPhone with advanced camera system",
      };

      expect(calculateSearchScore(product, "iphone")).toBe(150);
      expect(calculateSearchScore(product, "IPHONE")).toBe(150);
      expect(calculateSearchScore(product, "iPhone")).toBe(150);
    });

    it("should handle partial matches", () => {
      const product = {
        name: "Samsung Galaxy S21 Ultra",
        sku: "SAMS21ULTRA-512",
        barcode: "9876543210987",
        category: { name: "Smartphones" },
        brand: { name: "Samsung" },
        description: "Premium Android smartphone",
      };

      expect(calculateSearchScore(product, "Galaxy")).toBe(150);
      expect(calculateSearchScore(product, "S21")).toBe(100);
      expect(calculateSearchScore(product, "Ultra")).toBe(100);
      expect(calculateSearchScore(product, "Samsung")).toBe(130);
    });

    it("should handle products with missing fields", () => {
      const product = {
        name: "Test Product",
        sku: "TEST-001",
        // Missing barcode, category, brand, description
      };

      expect(calculateSearchScore(product, "Test")).toBe(150);
      expect(calculateSearchScore(product, "TEST")).toBe(120);
      expect(calculateSearchScore(product, "Product")).toBe(100);
    });
  });

  describe("Data Transformation Utilities", () => {
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
        stockStatus: product.stock <= product.minStock ? "low" : "normal",
        profitMargin: Number(product.price) - Number(product.cost),
        profitMarginPercent:
          product.cost > 0
            ? ((Number(product.price) - Number(product.cost)) /
                Number(product.cost)) *
              100
            : 0,
      };
    };

    it("should transform product data correctly", () => {
      const rawProduct = {
        id: 1,
        name: "Test Product",
        sku: "TEST-001",
        cost: "10.50",
        price: "15.99",
        stock: 100,
        minStock: 10,
        maxStock: 200,
        status: "ACTIVE",
        isArchived: false,
        category: { id: 1, name: "Test Category" },
        brand: { id: 1, name: "Test Brand" },
        supplier: { id: 1, name: "Test Supplier" },
      };

      const transformed = transformProductForAPI(rawProduct);

      expect(transformed.id).toBe(1);
      expect(transformed.name).toBe("Test Product");
      expect(transformed.cost).toBe(10.5);
      expect(transformed.price).toBe(15.99);
      expect(transformed.stockStatus).toBe("normal");
      expect(transformed.profitMargin).toBe(5.49);
      expect(transformed.profitMarginPercent).toBeCloseTo(52.29, 2);
    });

    it("should handle low stock products", () => {
      const lowStockProduct = {
        id: 1,
        name: "Low Stock Product",
        sku: "LOW-001",
        cost: "10.00",
        price: "15.00",
        stock: 5,
        minStock: 10,
        maxStock: 100,
        status: "ACTIVE",
        isArchived: false,
        category: { id: 1, name: "Test Category" },
        brand: { id: 1, name: "Test Brand" },
        supplier: { id: 1, name: "Test Supplier" },
      };

      const transformed = transformProductForAPI(lowStockProduct);

      expect(transformed.stockStatus).toBe("low");
      expect(transformed.profitMargin).toBe(5.0);
      expect(transformed.profitMarginPercent).toBe(50);
    });

    it("should handle zero cost products", () => {
      const zeroCostProduct = {
        id: 1,
        name: "Free Product",
        sku: "FREE-001",
        cost: "0",
        price: "15.00",
        stock: 100,
        minStock: 10,
        maxStock: 100,
        status: "ACTIVE",
        isArchived: false,
        category: { id: 1, name: "Test Category" },
        brand: { id: 1, name: "Test Brand" },
        supplier: { id: 1, name: "Test Supplier" },
      };

      const transformed = transformProductForAPI(zeroCostProduct);

      expect(transformed.profitMargin).toBe(15.0);
      expect(transformed.profitMarginPercent).toBe(0); // Can't calculate percentage with zero cost
    });
  });
});
