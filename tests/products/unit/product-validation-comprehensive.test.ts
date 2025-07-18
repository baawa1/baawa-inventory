import { describe, it, expect } from "@jest/globals";
import { z } from "zod";
import { createProductSchema } from "@/lib/validations/product";

describe("Product Validation Comprehensive Tests", () => {
  describe("createProductSchema", () => {
    const validProductData = {
      name: "Test Product",
      description: "Test Description",
      sku: "TEST-001",
      barcode: "1234567890123",
      purchasePrice: 10.5,
      sellingPrice: 15.99,
      currentStock: 100,
      minimumStock: 10,
      maximumStock: 200,
      unit: "piece",
      status: "active",
      categoryId: 1,
      brandId: 1,
      supplierId: 1,
      weight: 1.5,
      dimensions: "10x5x2 cm",
      color: "Red",
      size: "Medium",
      material: "Cotton",
      tags: ["tag1", "tag2"],
      salePrice: 12.99,
      saleStartDate: "2024-01-01T00:00:00Z",
      saleEndDate: "2024-12-31T23:59:59Z",
      metaTitle: "SEO Title",
      metaDescription: "SEO Description",
      seoKeywords: ["keyword1", "keyword2"],
      isFeatured: true,
      sortOrder: 1,
    };

    it("should validate complete product data", () => {
      const result = createProductSchema.safeParse(validProductData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validProductData);
      }
    });

    it("should validate minimal product data", () => {
      const minimalData = {
        name: "Minimal Product",
        sku: "MIN-001",
        purchasePrice: 10.5,
        sellingPrice: 15.99,
        currentStock: 100,
        minimumStock: 10,
        status: "active",
      };

      const result = createProductSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });

    describe("name validation", () => {
      it("should require name", () => {
        const dataWithoutName = { ...validProductData };
        delete (dataWithoutName as any).name;

        const result = createProductSchema.safeParse(dataWithoutName);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["name"]);
          expect(result.error.issues[0].code).toBe("invalid_type");
        }
      });

      it("should reject empty name", () => {
        const dataWithEmptyName = { ...validProductData, name: "" };

        const result = createProductSchema.safeParse(dataWithEmptyName);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["name"]);
          expect(result.error.issues[0].code).toBe("too_small");
        }
      });

      it("should reject name longer than 255 characters", () => {
        const longName = "a".repeat(256);
        const dataWithLongName = { ...validProductData, name: longName };

        const result = createProductSchema.safeParse(dataWithLongName);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["name"]);
          expect(result.error.issues[0].code).toBe("too_big");
        }
      });

      it("should accept name with 255 characters", () => {
        const maxLengthName = "a".repeat(255);
        const dataWithMaxLengthName = {
          ...validProductData,
          name: maxLengthName,
        };

        const result = createProductSchema.safeParse(dataWithMaxLengthName);
        expect(result.success).toBe(true);
      });
    });

    describe("SKU validation", () => {
      it("should require SKU", () => {
        const dataWithoutSku = { ...validProductData };
        delete (dataWithoutSku as any).sku;

        const result = createProductSchema.safeParse(dataWithoutSku);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["sku"]);
          expect(result.error.issues[0].code).toBe("invalid_type");
        }
      });

      it("should reject empty SKU", () => {
        const dataWithEmptySku = { ...validProductData, sku: "" };

        const result = createProductSchema.safeParse(dataWithEmptySku);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["sku"]);
          expect(result.error.issues[0].code).toBe("too_small");
        }
      });

      it("should reject SKU longer than 100 characters", () => {
        const longSku = "a".repeat(101);
        const dataWithLongSku = { ...validProductData, sku: longSku };

        const result = createProductSchema.safeParse(dataWithLongSku);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["sku"]);
          expect(result.error.issues[0].code).toBe("too_big");
        }
      });

      it("should accept valid SKU formats", () => {
        const validSkus = [
          "TEST-001",
          "PROD123",
          "SKU_ABC_123",
          "123456789",
          "A-Z-0-9",
        ];

        validSkus.forEach((sku) => {
          const dataWithSku = { ...validProductData, sku };
          const result = createProductSchema.safeParse(dataWithSku);
          expect(result.success).toBe(true);
        });
      });
    });

    describe("barcode validation", () => {
      it("should accept valid barcode", () => {
        const validBarcodes = [
          "1234567890123", // EAN-13
          "123456789012", // EAN-12
          "12345678901", // UPC-A
          "1234567890", // UPC-E
          "123456789012345", // Custom format
        ];

        validBarcodes.forEach((barcode) => {
          const dataWithBarcode = { ...validProductData, barcode };
          const result = createProductSchema.safeParse(dataWithBarcode);
          expect(result.success).toBe(true);
        });
      });

      it("should reject barcode longer than 100 characters", () => {
        const longBarcode = "1".repeat(101);
        const dataWithLongBarcode = {
          ...validProductData,
          barcode: longBarcode,
        };

        const result = createProductSchema.safeParse(dataWithLongBarcode);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["barcode"]);
          expect(result.error.issues[0].code).toBe("too_big");
        }
      });

      it("should accept null barcode", () => {
        const dataWithNullBarcode = { ...validProductData, barcode: null };

        const result = createProductSchema.safeParse(dataWithNullBarcode);
        expect(result.success).toBe(true);
      });
    });

    describe("price validation", () => {
      it("should require purchasePrice", () => {
        const dataWithoutPurchasePrice = { ...validProductData };
        delete (dataWithoutPurchasePrice as any).purchasePrice;

        const result = createProductSchema.safeParse(dataWithoutPurchasePrice);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["purchasePrice"]);
          expect(result.error.issues[0].code).toBe("invalid_type");
        }
      });

      it("should require sellingPrice", () => {
        const dataWithoutSellingPrice = { ...validProductData };
        delete (dataWithoutSellingPrice as any).sellingPrice;

        const result = createProductSchema.safeParse(dataWithoutSellingPrice);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["sellingPrice"]);
          expect(result.error.issues[0].code).toBe("invalid_type");
        }
      });

      it("should reject negative prices", () => {
        const dataWithNegativePrices = {
          ...validProductData,
          purchasePrice: -10.5,
          sellingPrice: -15.99,
        };

        const result = createProductSchema.safeParse(dataWithNegativePrices);
        expect(result.success).toBe(false);
        if (!result.success) {
          const errors = result.error.issues.map((issue) => issue.path[0]);
          expect(errors).toContain("purchasePrice");
          expect(errors).toContain("sellingPrice");
        }
      });

      it("should accept zero prices", () => {
        const dataWithZeroPrices = {
          ...validProductData,
          purchasePrice: 0,
          sellingPrice: 0,
        };

        const result = createProductSchema.safeParse(dataWithZeroPrices);
        expect(result.success).toBe(true);
      });

      it("should accept decimal prices", () => {
        const dataWithDecimalPrices = {
          ...validProductData,
          purchasePrice: 10.99,
          sellingPrice: 15.5,
        };

        const result = createProductSchema.safeParse(dataWithDecimalPrices);
        expect(result.success).toBe(true);
      });
    });

    describe("stock validation", () => {
      it("should require currentStock", () => {
        const dataWithoutCurrentStock = { ...validProductData };
        delete (dataWithoutCurrentStock as any).currentStock;

        const result = createProductSchema.safeParse(dataWithoutCurrentStock);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["currentStock"]);
          expect(result.error.issues[0].code).toBe("invalid_type");
        }
      });

      it("should require minimumStock", () => {
        const dataWithoutMinimumStock = { ...validProductData };
        delete (dataWithoutMinimumStock as any).minimumStock;

        const result = createProductSchema.safeParse(dataWithoutMinimumStock);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["minimumStock"]);
          expect(result.error.issues[0].code).toBe("invalid_type");
        }
      });

      it("should reject negative stock values", () => {
        const dataWithNegativeStock = {
          ...validProductData,
          currentStock: -10,
          minimumStock: -5,
        };

        const result = createProductSchema.safeParse(dataWithNegativeStock);
        expect(result.success).toBe(false);
        if (!result.success) {
          const errors = result.error.issues.map((issue) => issue.path[0]);
          expect(errors).toContain("currentStock");
          expect(errors).toContain("minimumStock");
        }
      });

      it("should accept zero stock values", () => {
        const dataWithZeroStock = {
          ...validProductData,
          currentStock: 0,
          minimumStock: 0,
        };

        const result = createProductSchema.safeParse(dataWithZeroStock);
        expect(result.success).toBe(true);
      });

      it("should accept maximumStock as null", () => {
        const dataWithNullMaxStock = {
          ...validProductData,
          maximumStock: null,
        };

        const result = createProductSchema.safeParse(dataWithNullMaxStock);
        expect(result.success).toBe(true);
      });

      it("should reject negative maximumStock", () => {
        const dataWithNegativeMaxStock = {
          ...validProductData,
          maximumStock: -10,
        };

        const result = createProductSchema.safeParse(dataWithNegativeMaxStock);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["maximumStock"]);
          expect(result.error.issues[0].code).toBe("too_small");
        }
      });
    });

    describe("status validation", () => {
      it("should require status", () => {
        const dataWithoutStatus = { ...validProductData };
        delete (dataWithoutStatus as any).status;

        const result = createProductSchema.safeParse(dataWithoutStatus);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["status"]);
          expect(result.error.issues[0].code).toBe("invalid_type");
        }
      });

      it("should accept valid status values", () => {
        const validStatuses = ["active", "inactive", "draft", "discontinued"];

        validStatuses.forEach((status) => {
          const dataWithStatus = { ...validProductData, status };
          const result = createProductSchema.safeParse(dataWithStatus);
          expect(result.success).toBe(true);
        });
      });

      it("should reject invalid status values", () => {
        const invalidStatuses = ["invalid", "unknown", "test"];

        invalidStatuses.forEach((status) => {
          const dataWithStatus = { ...validProductData, status };
          const result = createProductSchema.safeParse(dataWithStatus);
          expect(result.success).toBe(false);
        });
      });
    });

    describe("unit validation", () => {
      it("should accept valid unit values", () => {
        const validUnits = [
          "piece",
          "kg",
          "g",
          "l",
          "ml",
          "m",
          "cm",
          "mm",
          "box",
          "pack",
          "set",
        ];

        validUnits.forEach((unit) => {
          const dataWithUnit = { ...validProductData, unit };
          const result = createProductSchema.safeParse(dataWithUnit);
          expect(result.success).toBe(true);
        });
      });

      it("should reject unit longer than 20 characters", () => {
        const longUnit = "a".repeat(21);
        const dataWithLongUnit = { ...validProductData, unit: longUnit };

        const result = createProductSchema.safeParse(dataWithLongUnit);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["unit"]);
          expect(result.error.issues[0].code).toBe("too_big");
        }
      });
    });

    describe("ID validation", () => {
      it("should accept valid categoryId", () => {
        const dataWithCategoryId = { ...validProductData, categoryId: 1 };

        const result = createProductSchema.safeParse(dataWithCategoryId);
        expect(result.success).toBe(true);
      });

      it("should accept null categoryId", () => {
        const dataWithNullCategoryId = {
          ...validProductData,
          categoryId: null,
        };

        const result = createProductSchema.safeParse(dataWithNullCategoryId);
        expect(result.success).toBe(true);
      });

      it("should reject negative categoryId", () => {
        const dataWithNegativeCategoryId = {
          ...validProductData,
          categoryId: -1,
        };

        const result = createProductSchema.safeParse(
          dataWithNegativeCategoryId
        );
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["categoryId"]);
          expect(result.error.issues[0].code).toBe("too_small");
        }
      });

      it("should accept valid brandId", () => {
        const dataWithBrandId = { ...validProductData, brandId: 1 };

        const result = createProductSchema.safeParse(dataWithBrandId);
        expect(result.success).toBe(true);
      });

      it("should accept null brandId", () => {
        const dataWithNullBrandId = { ...validProductData, brandId: null };

        const result = createProductSchema.safeParse(dataWithNullBrandId);
        expect(result.success).toBe(true);
      });

      it("should accept valid supplierId", () => {
        const dataWithSupplierId = { ...validProductData, supplierId: 1 };

        const result = createProductSchema.safeParse(dataWithSupplierId);
        expect(result.success).toBe(true);
      });

      it("should accept null supplierId", () => {
        const dataWithNullSupplierId = {
          ...validProductData,
          supplierId: null,
        };

        const result = createProductSchema.safeParse(dataWithNullSupplierId);
        expect(result.success).toBe(true);
      });
    });

    describe("optional fields validation", () => {
      it("should accept valid weight", () => {
        const dataWithWeight = { ...validProductData, weight: 1.5 };

        const result = createProductSchema.safeParse(dataWithWeight);
        expect(result.success).toBe(true);
      });

      it("should accept null weight", () => {
        const dataWithNullWeight = { ...validProductData, weight: null };

        const result = createProductSchema.safeParse(dataWithNullWeight);
        expect(result.success).toBe(true);
      });

      it("should reject negative weight", () => {
        const dataWithNegativeWeight = { ...validProductData, weight: -1.5 };

        const result = createProductSchema.safeParse(dataWithNegativeWeight);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["weight"]);
          expect(result.error.issues[0].code).toBe("too_small");
        }
      });

      it("should accept valid dimensions", () => {
        const dataWithDimensions = {
          ...validProductData,
          dimensions: "10x5x2 cm",
        };

        const result = createProductSchema.safeParse(dataWithDimensions);
        expect(result.success).toBe(true);
      });

      it("should reject dimensions longer than 100 characters", () => {
        const longDimensions = "a".repeat(101);
        const dataWithLongDimensions = {
          ...validProductData,
          dimensions: longDimensions,
        };

        const result = createProductSchema.safeParse(dataWithLongDimensions);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["dimensions"]);
          expect(result.error.issues[0].code).toBe("too_big");
        }
      });

      it("should accept valid color", () => {
        const dataWithColor = { ...validProductData, color: "Red" };

        const result = createProductSchema.safeParse(dataWithColor);
        expect(result.success).toBe(true);
      });

      it("should reject color longer than 50 characters", () => {
        const longColor = "a".repeat(51);
        const dataWithLongColor = { ...validProductData, color: longColor };

        const result = createProductSchema.safeParse(dataWithLongColor);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["color"]);
          expect(result.error.issues[0].code).toBe("too_big");
        }
      });

      it("should accept valid tags array", () => {
        const dataWithTags = {
          ...validProductData,
          tags: ["tag1", "tag2", "tag3"],
        };

        const result = createProductSchema.safeParse(dataWithTags);
        expect(result.success).toBe(true);
      });

      it("should accept empty tags array", () => {
        const dataWithEmptyTags = { ...validProductData, tags: [] };

        const result = createProductSchema.safeParse(dataWithEmptyTags);
        expect(result.success).toBe(true);
      });

      it("should reject tags with invalid strings", () => {
        const dataWithInvalidTags = {
          ...validProductData,
          tags: ["tag1", "", "tag3"],
        };

        const result = createProductSchema.safeParse(dataWithInvalidTags);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["tags", 1]);
          expect(result.error.issues[0].code).toBe("too_small");
        }
      });
    });

    describe("sale price validation", () => {
      it("should accept valid salePrice", () => {
        const dataWithSalePrice = { ...validProductData, salePrice: 12.99 };

        const result = createProductSchema.safeParse(dataWithSalePrice);
        expect(result.success).toBe(true);
      });

      it("should accept null salePrice", () => {
        const dataWithNullSalePrice = { ...validProductData, salePrice: null };

        const result = createProductSchema.safeParse(dataWithNullSalePrice);
        expect(result.success).toBe(true);
      });

      it("should reject negative salePrice", () => {
        const dataWithNegativeSalePrice = {
          ...validProductData,
          salePrice: -12.99,
        };

        const result = createProductSchema.safeParse(dataWithNegativeSalePrice);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["salePrice"]);
          expect(result.error.issues[0].code).toBe("too_small");
        }
      });

      it("should accept valid sale dates", () => {
        const dataWithSaleDates = {
          ...validProductData,
          saleStartDate: "2024-01-01T00:00:00Z",
          saleEndDate: "2024-12-31T23:59:59Z",
        };

        const result = createProductSchema.safeParse(dataWithSaleDates);
        expect(result.success).toBe(true);
      });

      it("should accept null sale dates", () => {
        const dataWithNullSaleDates = {
          ...validProductData,
          saleStartDate: null,
          saleEndDate: null,
        };

        const result = createProductSchema.safeParse(dataWithNullSaleDates);
        expect(result.success).toBe(true);
      });

      it("should reject invalid date format", () => {
        const dataWithInvalidDate = {
          ...validProductData,
          saleStartDate: "invalid-date",
        };

        const result = createProductSchema.safeParse(dataWithInvalidDate);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["saleStartDate"]);
          expect(result.error.issues[0].code).toBe("invalid_string");
        }
      });
    });

    describe("SEO fields validation", () => {
      it("should accept valid metaTitle", () => {
        const dataWithMetaTitle = {
          ...validProductData,
          metaTitle: "SEO Title",
        };

        const result = createProductSchema.safeParse(dataWithMetaTitle);
        expect(result.success).toBe(true);
      });

      it("should reject metaTitle longer than 255 characters", () => {
        const longMetaTitle = "a".repeat(256);
        const dataWithLongMetaTitle = {
          ...validProductData,
          metaTitle: longMetaTitle,
        };

        const result = createProductSchema.safeParse(dataWithLongMetaTitle);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["metaTitle"]);
          expect(result.error.issues[0].code).toBe("too_big");
        }
      });

      it("should accept valid metaDescription", () => {
        const dataWithMetaDescription = {
          ...validProductData,
          metaDescription: "SEO Description",
        };

        const result = createProductSchema.safeParse(dataWithMetaDescription);
        expect(result.success).toBe(true);
      });

      it("should reject metaDescription longer than 500 characters", () => {
        const longMetaDescription = "a".repeat(501);
        const dataWithLongMetaDescription = {
          ...validProductData,
          metaDescription: longMetaDescription,
        };

        const result = createProductSchema.safeParse(
          dataWithLongMetaDescription
        );
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["metaDescription"]);
          expect(result.error.issues[0].code).toBe("too_big");
        }
      });

      it("should accept valid seoKeywords array", () => {
        const dataWithSeoKeywords = {
          ...validProductData,
          seoKeywords: ["keyword1", "keyword2"],
        };

        const result = createProductSchema.safeParse(dataWithSeoKeywords);
        expect(result.success).toBe(true);
      });

      it("should accept empty seoKeywords array", () => {
        const dataWithEmptySeoKeywords = {
          ...validProductData,
          seoKeywords: [],
        };

        const result = createProductSchema.safeParse(dataWithEmptySeoKeywords);
        expect(result.success).toBe(true);
      });
    });

    describe("boolean fields validation", () => {
      it("should accept valid isFeatured", () => {
        const dataWithIsFeatured = { ...validProductData, isFeatured: true };

        const result = createProductSchema.safeParse(dataWithIsFeatured);
        expect(result.success).toBe(true);
      });

      it("should accept false isFeatured", () => {
        const dataWithFalseIsFeatured = {
          ...validProductData,
          isFeatured: false,
        };

        const result = createProductSchema.safeParse(dataWithFalseIsFeatured);
        expect(result.success).toBe(true);
      });
    });

    describe("sortOrder validation", () => {
      it("should accept valid sortOrder", () => {
        const dataWithSortOrder = { ...validProductData, sortOrder: 1 };

        const result = createProductSchema.safeParse(dataWithSortOrder);
        expect(result.success).toBe(true);
      });

      it("should accept null sortOrder", () => {
        const dataWithNullSortOrder = { ...validProductData, sortOrder: null };

        const result = createProductSchema.safeParse(dataWithNullSortOrder);
        expect(result.success).toBe(true);
      });

      it("should reject non-integer sortOrder", () => {
        const dataWithNonIntegerSortOrder = {
          ...validProductData,
          sortOrder: 1.5,
        };

        const result = createProductSchema.safeParse(
          dataWithNonIntegerSortOrder
        );
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["sortOrder"]);
          expect(result.error.issues[0].code).toBe("invalid_type");
        }
      });
    });

    describe("complex validation scenarios", () => {
      it("should handle multiple validation errors", () => {
        const invalidData = {
          name: "", // Empty name
          sku: "a".repeat(101), // Too long SKU
          purchasePrice: -10, // Negative price
          sellingPrice: -15, // Negative price
          currentStock: -5, // Negative stock
          minimumStock: -2, // Negative stock
          status: "invalid", // Invalid status
        };

        const result = createProductSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThan(1);
          const errorPaths = result.error.issues.map((issue) => issue.path[0]);
          expect(errorPaths).toContain("name");
          expect(errorPaths).toContain("sku");
          expect(errorPaths).toContain("purchasePrice");
          expect(errorPaths).toContain("sellingPrice");
          expect(errorPaths).toContain("currentStock");
          expect(errorPaths).toContain("minimumStock");
          expect(errorPaths).toContain("status");
        }
      });

      it("should handle edge case values", () => {
        const edgeCaseData = {
          name: "a".repeat(255), // Maximum length name
          sku: "a".repeat(100), // Maximum length SKU
          barcode: "1".repeat(100), // Maximum length barcode
          purchasePrice: 0, // Zero price
          sellingPrice: 0, // Zero price
          currentStock: 0, // Zero stock
          minimumStock: 0, // Zero stock
          maximumStock: null, // Null max stock
          unit: "a".repeat(20), // Maximum length unit
          status: "active",
          weight: 0.001, // Very small weight
          dimensions: "a".repeat(100), // Maximum length dimensions
          color: "a".repeat(50), // Maximum length color
          size: "a".repeat(50), // Maximum length size
          material: "a".repeat(100), // Maximum length material
          tags: ["a".repeat(50)], // Long tag
          salePrice: 0, // Zero sale price
          saleStartDate: "2024-01-01T00:00:00Z",
          saleEndDate: "2024-12-31T23:59:59Z",
          metaTitle: "a".repeat(255), // Maximum length meta title
          metaDescription: "a".repeat(500), // Maximum length meta description
          seoKeywords: ["a".repeat(50)], // Long keyword
          isFeatured: false,
          sortOrder: 0, // Zero sort order
        };

        const result = createProductSchema.safeParse(edgeCaseData);
        expect(result.success).toBe(true);
      });
    });
  });
});
