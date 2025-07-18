import { describe, it, expect } from "@jest/globals";
import {
  createSupplierSchema,
  updateSupplierSchema,
  supplierQuerySchema,
  supplierIdSchema,
  supplierPerformanceQuerySchema,
  bulkUpdateSupplierStatusSchema,
} from "@/lib/validations/supplier";

describe("Supplier Validation - Comprehensive Tests", () => {
  describe("createSupplierSchema", () => {
    it("should validate a complete valid supplier", () => {
      const validSupplier = {
        name: "Tech Supplies Ltd",
        contactPerson: "John Doe",
        email: "john@techsupplies.com",
        phone: "+2348012345678",
        address: "123 Main Street, Victoria Island",
        city: "Lagos",
        state: "Lagos",
        country: "Nigeria",
        postalCode: "100001",
        website: "https://techsupplies.com",
        taxNumber: "TAX123456789",
        paymentTerms: "Net 30",
        creditLimit: 500000,
        isActive: true,
        notes: "Reliable supplier for electronics",
      };

      const result = createSupplierSchema.safeParse(validSupplier);
      expect(result.success).toBe(true);
    });

    it("should validate supplier with minimal required fields", () => {
      const minimalSupplier = {
        name: "Minimal Supplier",
        isActive: true,
      };

      const result = createSupplierSchema.safeParse(minimalSupplier);
      expect(result.success).toBe(true);
    });

    it("should reject supplier without name", () => {
      const invalidSupplier = {
        contactPerson: "John Doe",
        email: "john@example.com",
        isActive: true,
      };

      const result = createSupplierSchema.safeParse(invalidSupplier);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("name");
      }
    });

    it("should reject supplier without isActive field", () => {
      const invalidSupplier = {
        name: "Test Supplier",
        contactPerson: "John Doe",
      };

      const result = createSupplierSchema.safeParse(invalidSupplier);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("isActive");
      }
    });

    it("should reject empty name", () => {
      const invalidSupplier = {
        name: "",
        isActive: true,
      };

      const result = createSupplierSchema.safeParse(invalidSupplier);
      expect(result.success).toBe(false);
    });

    it("should reject name with only whitespace", () => {
      const invalidSupplier = {
        name: "   ",
        isActive: true,
      };

      const result = createSupplierSchema.safeParse(invalidSupplier);
      expect(result.success).toBe(false);
    });

    it("should reject name longer than 100 characters", () => {
      const invalidSupplier = {
        name: "A".repeat(101),
        isActive: true,
      };

      const result = createSupplierSchema.safeParse(invalidSupplier);
      expect(result.success).toBe(false);
    });

    it("should validate name with special characters", () => {
      const validSupplier = {
        name: "Tech-Supplies & Co. (Ltd)",
        isActive: true,
      };

      const result = createSupplierSchema.safeParse(validSupplier);
      expect(result.success).toBe(true);
    });

    it("should validate contact person with special characters", () => {
      const validSupplier = {
        name: "Test Supplier",
        contactPerson: "John-Doe O'Connor",
        isActive: true,
      };

      const result = createSupplierSchema.safeParse(validSupplier);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email format", () => {
      const invalidSupplier = {
        name: "Test Supplier",
        email: "invalid-email",
        isActive: true,
      };

      const result = createSupplierSchema.safeParse(invalidSupplier);
      expect(result.success).toBe(false);
    });

    it("should validate valid email format", () => {
      const validSupplier = {
        name: "Test Supplier",
        email: "test@example.com",
        isActive: true,
      };

      const result = createSupplierSchema.safeParse(validSupplier);
      expect(result.success).toBe(true);
    });

    it("should validate email with subdomain", () => {
      const validSupplier = {
        name: "Test Supplier",
        email: "contact@test.example.com",
        isActive: true,
      };

      const result = createSupplierSchema.safeParse(validSupplier);
      expect(result.success).toBe(true);
    });

    it("should reject invalid phone format", () => {
      const invalidSupplier = {
        name: "Test Supplier",
        phone: "invalid-phone",
        isActive: true,
      };

      const result = createSupplierSchema.safeParse(invalidSupplier);
      expect(result.success).toBe(false);
    });

    it("should validate Nigerian phone format", () => {
      const validSupplier = {
        name: "Test Supplier",
        phone: "+2348012345678",
        isActive: true,
      };

      const result = createSupplierSchema.safeParse(validSupplier);
      expect(result.success).toBe(true);
    });

    it("should validate international phone format", () => {
      const validSupplier = {
        name: "Test Supplier",
        phone: "+1-555-123-4567",
        isActive: true,
      };

      const result = createSupplierSchema.safeParse(validSupplier);
      expect(result.success).toBe(true);
    });

    it("should reject address longer than 500 characters", () => {
      const invalidSupplier = {
        name: "Test Supplier",
        address: "A".repeat(501),
        isActive: true,
      };

      const result = createSupplierSchema.safeParse(invalidSupplier);
      expect(result.success).toBe(false);
    });

    it("should validate address with special characters", () => {
      const validSupplier = {
        name: "Test Supplier",
        address: "123 Main St., Suite #100, Building A",
        isActive: true,
      };

      const result = createSupplierSchema.safeParse(validSupplier);
      expect(result.success).toBe(true);
    });

    it("should reject city longer than 100 characters", () => {
      const invalidSupplier = {
        name: "Test Supplier",
        city: "A".repeat(101),
        isActive: true,
      };

      const result = createSupplierSchema.safeParse(invalidSupplier);
      expect(result.success).toBe(false);
    });

    it("should reject state longer than 100 characters", () => {
      const invalidSupplier = {
        name: "Test Supplier",
        state: "A".repeat(101),
        isActive: true,
      };

      const result = createSupplierSchema.safeParse(invalidSupplier);
      expect(result.success).toBe(false);
    });

    it("should reject country longer than 100 characters", () => {
      const invalidSupplier = {
        name: "Test Supplier",
        country: "A".repeat(101),
        isActive: true,
      };

      const result = createSupplierSchema.safeParse(invalidSupplier);
      expect(result.success).toBe(false);
    });

    it("should reject postal code longer than 20 characters", () => {
      const invalidSupplier = {
        name: "Test Supplier",
        postalCode: "A".repeat(21),
        isActive: true,
      };

      const result = createSupplierSchema.safeParse(invalidSupplier);
      expect(result.success).toBe(false);
    });

    it("should reject invalid website URL", () => {
      const invalidSupplier = {
        name: "Test Supplier",
        website: "not-a-url",
        isActive: true,
      };

      const result = createSupplierSchema.safeParse(invalidSupplier);
      expect(result.success).toBe(false);
    });

    it("should validate valid website URL", () => {
      const validSupplier = {
        name: "Test Supplier",
        website: "https://example.com",
        isActive: true,
      };

      const result = createSupplierSchema.safeParse(validSupplier);
      expect(result.success).toBe(true);
    });

    it("should validate website URL with subdomain", () => {
      const validSupplier = {
        name: "Test Supplier",
        website: "https://www.example.com",
        isActive: true,
      };

      const result = createSupplierSchema.safeParse(validSupplier);
      expect(result.success).toBe(true);
    });

    it("should reject website URL longer than 255 characters", () => {
      const invalidSupplier = {
        name: "Test Supplier",
        website: `https://${"a".repeat(250)}.com`,
        isActive: true,
      };

      const result = createSupplierSchema.safeParse(invalidSupplier);
      expect(result.success).toBe(false);
    });

    it("should reject tax number longer than 100 characters", () => {
      const invalidSupplier = {
        name: "Test Supplier",
        taxNumber: "A".repeat(101),
        isActive: true,
      };

      const result = createSupplierSchema.safeParse(invalidSupplier);
      expect(result.success).toBe(false);
    });

    it("should reject payment terms longer than 255 characters", () => {
      const invalidSupplier = {
        name: "Test Supplier",
        paymentTerms: "A".repeat(256),
        isActive: true,
      };

      const result = createSupplierSchema.safeParse(invalidSupplier);
      expect(result.success).toBe(false);
    });

    it("should reject negative credit limit", () => {
      const invalidSupplier = {
        name: "Test Supplier",
        creditLimit: -1000,
        isActive: true,
      };

      const result = createSupplierSchema.safeParse(invalidSupplier);
      expect(result.success).toBe(false);
    });

    it("should reject zero credit limit", () => {
      const invalidSupplier = {
        name: "Test Supplier",
        creditLimit: 0,
        isActive: true,
      };

      const result = createSupplierSchema.safeParse(invalidSupplier);
      expect(result.success).toBe(false);
    });

    it("should validate positive credit limit", () => {
      const validSupplier = {
        name: "Test Supplier",
        creditLimit: 1000000,
        isActive: true,
      };

      const result = createSupplierSchema.safeParse(validSupplier);
      expect(result.success).toBe(true);
    });

    it("should reject notes longer than 1000 characters", () => {
      const invalidSupplier = {
        name: "Test Supplier",
        notes: "A".repeat(1001),
        isActive: true,
      };

      const result = createSupplierSchema.safeParse(invalidSupplier);
      expect(result.success).toBe(false);
    });

    it("should validate notes with special characters", () => {
      const validSupplier = {
        name: "Test Supplier",
        notes: "Special notes with @#$%^&*() characters and line\nbreaks",
        isActive: true,
      };

      const result = createSupplierSchema.safeParse(validSupplier);
      expect(result.success).toBe(true);
    });

    it("should handle null values for optional fields", () => {
      const validSupplier = {
        name: "Test Supplier",
        contactPerson: null,
        email: null,
        phone: null,
        address: null,
        city: null,
        state: null,
        country: null,
        postalCode: null,
        website: null,
        taxNumber: null,
        paymentTerms: null,
        creditLimit: null,
        notes: null,
        isActive: true,
      };

      const result = createSupplierSchema.safeParse(validSupplier);
      expect(result.success).toBe(true);
    });

    it("should handle undefined values for optional fields", () => {
      const validSupplier = {
        name: "Test Supplier",
        isActive: true,
      };

      const result = createSupplierSchema.safeParse(validSupplier);
      expect(result.success).toBe(true);
    });
  });

  describe("updateSupplierSchema", () => {
    it("should validate partial update with single field", () => {
      const updateData = {
        name: "Updated Supplier Name",
      };

      const result = updateSupplierSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it("should validate partial update with multiple fields", () => {
      const updateData = {
        contactPerson: "Jane Doe",
        email: "jane@example.com",
        phone: "+2348098765432",
      };

      const result = updateSupplierSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it("should reject empty update object", () => {
      const updateData = {};

      const result = updateSupplierSchema.safeParse(updateData);
      expect(result.success).toBe(false);
    });

    it("should reject update with all undefined values", () => {
      const updateData = {
        name: undefined,
        contactPerson: undefined,
      };

      const result = updateSupplierSchema.safeParse(updateData);
      expect(result.success).toBe(false);
    });

    it("should validate update with mixed defined and undefined values", () => {
      const updateData = {
        name: "Updated Name",
        contactPerson: undefined,
        email: "updated@example.com",
      };

      const result = updateSupplierSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });
  });

  describe("supplierQuerySchema", () => {
    it("should validate basic query parameters", () => {
      const query = {
        page: 1,
        limit: 10,
        search: "test",
        sortBy: "name",
        sortOrder: "asc",
      };

      const result = supplierQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it("should validate query with boolean isActive", () => {
      const query = {
        page: 1,
        limit: 10,
        isActive: true,
      };

      const result = supplierQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it("should validate query with string isActive", () => {
      const query = {
        page: 1,
        limit: 10,
        isActive: "true",
      };

      const result = supplierQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it("should validate query with location filters", () => {
      const query = {
        page: 1,
        limit: 10,
        city: "Lagos",
        state: "Lagos",
        country: "Nigeria",
      };

      const result = supplierQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it("should reject invalid page number", () => {
      const query = {
        page: 0,
        limit: 10,
      };

      const result = supplierQuerySchema.safeParse(query);
      expect(result.success).toBe(false);
    });

    it("should reject invalid limit", () => {
      const query = {
        page: 1,
        limit: 0,
      };

      const result = supplierQuerySchema.safeParse(query);
      expect(result.success).toBe(false);
    });

    it("should reject limit exceeding maximum", () => {
      const query = {
        page: 1,
        limit: 101,
      };

      const result = supplierQuerySchema.safeParse(query);
      expect(result.success).toBe(false);
    });
  });

  describe("supplierIdSchema", () => {
    it("should validate positive integer ID", () => {
      const data = { id: 1 };

      const result = supplierIdSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject negative ID", () => {
      const data = { id: -1 };

      const result = supplierIdSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject zero ID", () => {
      const data = { id: 0 };

      const result = supplierIdSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject non-integer ID", () => {
      const data = { id: 1.5 };

      const result = supplierIdSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("supplierPerformanceQuerySchema", () => {
    it("should validate basic performance query", () => {
      const query = {
        supplierId: 1,
      };

      const result = supplierPerformanceQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it("should validate performance query with date range", () => {
      const query = {
        supplierId: 1,
        fromDate: "2024-01-01T00:00:00Z",
        toDate: "2024-12-31T23:59:59Z",
      };

      const result = supplierPerformanceQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it("should validate performance query with include flags", () => {
      const query = {
        supplierId: 1,
        includeProducts: true,
        includePurchaseOrders: false,
      };

      const result = supplierPerformanceQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it("should reject invalid supplier ID", () => {
      const query = {
        supplierId: 0,
      };

      const result = supplierPerformanceQuerySchema.safeParse(query);
      expect(result.success).toBe(false);
    });

    it("should reject invalid date format", () => {
      const query = {
        supplierId: 1,
        fromDate: "invalid-date",
      };

      const result = supplierPerformanceQuerySchema.safeParse(query);
      expect(result.success).toBe(false);
    });
  });

  describe("bulkUpdateSupplierStatusSchema", () => {
    it("should validate bulk update with single supplier", () => {
      const data = {
        supplierIds: [1],
        isActive: true,
      };

      const result = bulkUpdateSupplierStatusSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should validate bulk update with multiple suppliers", () => {
      const data = {
        supplierIds: [1, 2, 3, 4, 5],
        isActive: false,
      };

      const result = bulkUpdateSupplierStatusSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject empty supplier IDs array", () => {
      const data = {
        supplierIds: [],
        isActive: true,
      };

      const result = bulkUpdateSupplierStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject invalid supplier ID in array", () => {
      const data = {
        supplierIds: [1, -1, 3],
        isActive: true,
      };

      const result = bulkUpdateSupplierStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject missing isActive field", () => {
      const data = {
        supplierIds: [1, 2, 3],
      };

      const result = bulkUpdateSupplierStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
