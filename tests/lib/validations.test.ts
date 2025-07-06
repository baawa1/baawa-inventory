import { describe, it, expect } from "@jest/globals";
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  createUserSchema,
  updateUserSchema,
  userQuerySchema,
  createSupplierSchema,
  updateSupplierSchema,
  supplierQuerySchema,
  createSaleSchema,
  updateSaleSchema,
  saleQuerySchema,
  validateRequest,
  formatZodError,
} from "@/lib/validations";

describe("Zod Validation Schemas", () => {
  describe("Product Validation", () => {
    it("should validate valid product creation data", () => {
      const validProduct = {
        name: "Test Product",
        sku: "TEST-001",
        category: "Electronics",
        purchasePrice: 10.99,
        sellingPrice: 19.99,
        supplierId: 1,
      };

      const result = validateRequest(createProductSchema, validProduct);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it("should reject invalid product creation data", () => {
      const invalidProduct = {
        name: "", // Empty name should fail
        sku: "invalid sku with spaces", // Invalid SKU format
        category: "Electronics",
        purchasePrice: -10, // Negative price should fail
        sellingPrice: 19.99,
        supplierId: "not-a-number", // Invalid supplier ID
      };

      const result = validateRequest(createProductSchema, invalidProduct);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it("should validate product query parameters", () => {
      const queryParams = {
        page: "1",
        limit: "10",
        search: "test",
        category: "Electronics",
        status: "ACTIVE",
      };

      const result = validateRequest(productQuerySchema, queryParams);
      expect(result.success).toBe(true);
      expect(result.data?.page).toBe(1);
      expect(result.data?.limit).toBe(10);
    });

    it("should validate product update data", () => {
      const updateData = {
        name: "Updated Product Name",
        sellingPrice: 29.99,
      };

      const result = validateRequest(updateProductSchema, updateData);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe("User Validation", () => {
    it("should validate valid user creation data", () => {
      const validUser = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        password: "password123",
        phone: "+1234567890",
        role: "STAFF",
      };

      const result = validateRequest(createUserSchema, validUser);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it("should reject invalid user creation data", () => {
      const invalidUser = {
        firstName: "",
        lastName: "Doe",
        email: "invalid-email",
        phone: "invalid-phone",
        role: "INVALID_ROLE",
      };

      const result = validateRequest(createUserSchema, invalidUser);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it("should validate user query parameters", () => {
      const queryParams = {
        page: "1",
        limit: "20",
        role: "ADMIN",
        isActive: "true",
      };

      // Test the schema directly instead of through validateRequest
      const result = userQuerySchema.safeParse(queryParams);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe("ADMIN");
        expect(result.data.isActive).toBe(true);
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });
  });

  describe("Supplier Validation", () => {
    it("should validate valid supplier creation data", () => {
      const validSupplier = {
        name: "Test Supplier",
        contactPerson: "Jane Smith",
        email: "jane@supplier.com",
        phone: "+1987654321",
      };

      const result = validateRequest(createSupplierSchema, validSupplier);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it("should reject invalid supplier creation data", () => {
      const invalidSupplier = {
        name: "", // Empty name should fail
        email: "invalid-email",
        phone: "invalid-phone-number",
      };

      const result = validateRequest(createSupplierSchema, invalidSupplier);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe("Sale Validation", () => {
    it("should validate valid sale creation data", () => {
      const validSale = {
        userId: 1,
        items: [
          {
            productId: 1,
            quantity: 2,
            unitPrice: 19.99,
            discount: 0,
          },
          {
            productId: 2,
            quantity: 1,
            unitPrice: 29.99,
            discount: 10,
          },
        ],
        paymentMethod: "CASH",
        paymentStatus: "PAID",
        discountAmount: 5.0,
        taxAmount: 3.5,
      };

      const result = validateRequest(createSaleSchema, validSale);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it("should reject sale with invalid discount", () => {
      const invalidSale = {
        userId: 1,
        items: [
          {
            productId: 1,
            quantity: 1,
            unitPrice: 10.0,
            discount: 0,
          },
        ],
        paymentMethod: "CASH",
        discountAmount: 50.0, // Discount exceeds item total
      };

      const result = validateRequest(createSaleSchema, invalidSale);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it("should validate sale query parameters", () => {
      const queryParams = {
        page: "1",
        limit: "10",
        paymentMethod: "CASH",
        paymentStatus: "PAID",
        fromDate: "2024-01-01T00:00:00Z",
        toDate: "2024-12-31T23:59:59Z",
      };

      const result = validateRequest(saleQuerySchema, queryParams);
      expect(result.success).toBe(true);
      expect(result.data?.paymentMethod).toBe("CASH");
    });
  });

  describe("Utility Functions", () => {
    it("should format Zod errors correctly", () => {
      const invalidData = {
        name: "",
        email: "invalid-email",
        age: -5,
      };

      const schema = createUserSchema;
      const result = validateRequest(schema, invalidData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(typeof result.errors).toBe("object");
    });

    it("should handle validation success", () => {
      const validData = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "password123",
        role: "STAFF",
      };

      const result = validateRequest(createUserSchema, validData);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toBeUndefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty objects for update schemas", () => {
      const emptyUpdate = {};

      const result = validateRequest(updateProductSchema, emptyUpdate);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it("should handle optional fields correctly", () => {
      const minimalProduct = {
        name: "Minimal Product",
        sku: "MIN-001",
        category: "Test",
        purchasePrice: 1.0,
        sellingPrice: 2.0,
        supplierId: 1,
      };

      const result = validateRequest(createProductSchema, minimalProduct);
      expect(result.success).toBe(true);
      expect(result.data?.currentStock).toBe(0); // Default value
      expect(result.data?.minimumStock).toBe(0); // Default value
      expect(result.data?.status).toBe("ACTIVE"); // Default value
    });

    it("should validate price precision", () => {
      const productWithPrecisePrice = {
        name: "Precise Product",
        sku: "PREC-001",
        category: "Test",
        purchasePrice: 10.99,
        sellingPrice: 19.999, // Too many decimal places
        supplierId: 1,
      };

      const result = validateRequest(
        createProductSchema,
        productWithPrecisePrice
      );
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
});
