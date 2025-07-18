import { describe, it, expect } from "@jest/globals";
import {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  purchaseOrderQuerySchema,
  purchaseOrderIdSchema,
  fulfillPurchaseOrderSchema,
  updatePurchaseOrderStatusSchema,
  validatePurchaseOrderTotals,
  validatePurchaseOrderRules,
  validateStatusTransition,
  PURCHASE_ORDER_STATUS_TRANSITIONS,
  PURCHASE_ORDER_RULES,
} from "@/lib/validations/purchase-order";

describe("Purchase Order Validation - Comprehensive Tests", () => {
  describe("createPurchaseOrderSchema", () => {
    it("should validate a complete valid purchase order", () => {
      const validPurchaseOrder = {
        supplierId: 1,
        orderNumber: "PO-2024-001",
        orderDate: "2024-01-15T10:00:00Z",
        expectedDeliveryDate: "2024-01-20T10:00:00Z",
        subtotal: 50000,
        taxAmount: 2500,
        shippingCost: 1000,
        totalAmount: 53500,
        notes: "Urgent delivery required",
        items: [
          {
            productId: 1,
            quantityOrdered: 10,
            unitCost: 5000,
            totalCost: 50000,
          },
        ],
      };

      const result = createPurchaseOrderSchema.safeParse(validPurchaseOrder);
      expect(result.success).toBe(true);
    });

    it("should validate purchase order with minimal required fields", () => {
      const minimalPurchaseOrder = {
        supplierId: 1,
        orderNumber: "PO-2024-002",
        orderDate: "2024-01-15T10:00:00Z",
        subtotal: 1000,
        totalAmount: 1000,
        items: [
          {
            quantityOrdered: 1,
            unitCost: 1000,
            totalCost: 1000,
          },
        ],
      };

      const result = createPurchaseOrderSchema.safeParse(minimalPurchaseOrder);
      expect(result.success).toBe(true);
    });

    it("should reject purchase order without supplier", () => {
      const invalidPurchaseOrder = {
        orderNumber: "PO-2024-003",
        orderDate: "2024-01-15T10:00:00Z",
        subtotal: 1000,
        totalAmount: 1000,
        items: [
          {
            quantityOrdered: 1,
            unitCost: 1000,
            totalCost: 1000,
          },
        ],
      };

      const result = createPurchaseOrderSchema.safeParse(invalidPurchaseOrder);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("supplierId");
      }
    });

    it("should reject purchase order without order number", () => {
      const invalidPurchaseOrder = {
        supplierId: 1,
        orderDate: "2024-01-15T10:00:00Z",
        subtotal: 1000,
        totalAmount: 1000,
        items: [
          {
            quantityOrdered: 1,
            unitCost: 1000,
            totalCost: 1000,
          },
        ],
      };

      const result = createPurchaseOrderSchema.safeParse(invalidPurchaseOrder);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("orderNumber");
      }
    });

    it("should reject empty order number", () => {
      const invalidPurchaseOrder = {
        supplierId: 1,
        orderNumber: "",
        orderDate: "2024-01-15T10:00:00Z",
        subtotal: 1000,
        totalAmount: 1000,
        items: [
          {
            quantityOrdered: 1,
            unitCost: 1000,
            totalCost: 1000,
          },
        ],
      };

      const result = createPurchaseOrderSchema.safeParse(invalidPurchaseOrder);
      expect(result.success).toBe(false);
    });

    it("should reject order number longer than 50 characters", () => {
      const invalidPurchaseOrder = {
        supplierId: 1,
        orderNumber: "A".repeat(51),
        orderDate: "2024-01-15T10:00:00Z",
        subtotal: 1000,
        totalAmount: 1000,
        items: [
          {
            quantityOrdered: 1,
            unitCost: 1000,
            totalCost: 1000,
          },
        ],
      };

      const result = createPurchaseOrderSchema.safeParse(invalidPurchaseOrder);
      expect(result.success).toBe(false);
    });

    it("should reject invalid order date format", () => {
      const invalidPurchaseOrder = {
        supplierId: 1,
        orderNumber: "PO-2024-004",
        orderDate: "invalid-date",
        subtotal: 1000,
        totalAmount: 1000,
        items: [
          {
            quantityOrdered: 1,
            unitCost: 1000,
            totalCost: 1000,
          },
        ],
      };

      const result = createPurchaseOrderSchema.safeParse(invalidPurchaseOrder);
      expect(result.success).toBe(false);
    });

    it("should reject invalid expected delivery date format", () => {
      const invalidPurchaseOrder = {
        supplierId: 1,
        orderNumber: "PO-2024-005",
        orderDate: "2024-01-15T10:00:00Z",
        expectedDeliveryDate: "invalid-date",
        subtotal: 1000,
        totalAmount: 1000,
        items: [
          {
            quantityOrdered: 1,
            unitCost: 1000,
            totalCost: 1000,
          },
        ],
      };

      const result = createPurchaseOrderSchema.safeParse(invalidPurchaseOrder);
      expect(result.success).toBe(false);
    });

    it("should reject negative subtotal", () => {
      const invalidPurchaseOrder = {
        supplierId: 1,
        orderNumber: "PO-2024-006",
        orderDate: "2024-01-15T10:00:00Z",
        subtotal: -1000,
        totalAmount: 1000,
        items: [
          {
            quantityOrdered: 1,
            unitCost: 1000,
            totalCost: 1000,
          },
        ],
      };

      const result = createPurchaseOrderSchema.safeParse(invalidPurchaseOrder);
      expect(result.success).toBe(false);
    });

    it("should reject zero subtotal", () => {
      const invalidPurchaseOrder = {
        supplierId: 1,
        orderNumber: "PO-2024-007",
        orderDate: "2024-01-15T10:00:00Z",
        subtotal: 0,
        totalAmount: 1000,
        items: [
          {
            quantityOrdered: 1,
            unitCost: 1000,
            totalCost: 1000,
          },
        ],
      };

      const result = createPurchaseOrderSchema.safeParse(invalidPurchaseOrder);
      expect(result.success).toBe(false);
    });

    it("should reject negative tax amount", () => {
      const invalidPurchaseOrder = {
        supplierId: 1,
        orderNumber: "PO-2024-008",
        orderDate: "2024-01-15T10:00:00Z",
        subtotal: 1000,
        taxAmount: -100,
        totalAmount: 1000,
        items: [
          {
            quantityOrdered: 1,
            unitCost: 1000,
            totalCost: 1000,
          },
        ],
      };

      const result = createPurchaseOrderSchema.safeParse(invalidPurchaseOrder);
      expect(result.success).toBe(false);
    });

    it("should accept zero tax amount", () => {
      const validPurchaseOrder = {
        supplierId: 1,
        orderNumber: "PO-2024-009",
        orderDate: "2024-01-15T10:00:00Z",
        subtotal: 1000,
        taxAmount: 0,
        totalAmount: 1000,
        items: [
          {
            quantityOrdered: 1,
            unitCost: 1000,
            totalCost: 1000,
          },
        ],
      };

      const result = createPurchaseOrderSchema.safeParse(validPurchaseOrder);
      expect(result.success).toBe(true);
    });

    it("should reject negative shipping cost", () => {
      const invalidPurchaseOrder = {
        supplierId: 1,
        orderNumber: "PO-2024-010",
        orderDate: "2024-01-15T10:00:00Z",
        subtotal: 1000,
        shippingCost: -50,
        totalAmount: 1000,
        items: [
          {
            quantityOrdered: 1,
            unitCost: 1000,
            totalCost: 1000,
          },
        ],
      };

      const result = createPurchaseOrderSchema.safeParse(invalidPurchaseOrder);
      expect(result.success).toBe(false);
    });

    it("should accept zero shipping cost", () => {
      const validPurchaseOrder = {
        supplierId: 1,
        orderNumber: "PO-2024-011",
        orderDate: "2024-01-15T10:00:00Z",
        subtotal: 1000,
        shippingCost: 0,
        totalAmount: 1000,
        items: [
          {
            quantityOrdered: 1,
            unitCost: 1000,
            totalCost: 1000,
          },
        ],
      };

      const result = createPurchaseOrderSchema.safeParse(validPurchaseOrder);
      expect(result.success).toBe(true);
    });

    it("should reject negative total amount", () => {
      const invalidPurchaseOrder = {
        supplierId: 1,
        orderNumber: "PO-2024-012",
        orderDate: "2024-01-15T10:00:00Z",
        subtotal: 1000,
        totalAmount: -1000,
        items: [
          {
            quantityOrdered: 1,
            unitCost: 1000,
            totalCost: 1000,
          },
        ],
      };

      const result = createPurchaseOrderSchema.safeParse(invalidPurchaseOrder);
      expect(result.success).toBe(false);
    });

    it("should reject zero total amount", () => {
      const invalidPurchaseOrder = {
        supplierId: 1,
        orderNumber: "PO-2024-013",
        orderDate: "2024-01-15T10:00:00Z",
        subtotal: 1000,
        totalAmount: 0,
        items: [
          {
            quantityOrdered: 1,
            unitCost: 1000,
            totalCost: 1000,
          },
        ],
      };

      const result = createPurchaseOrderSchema.safeParse(invalidPurchaseOrder);
      expect(result.success).toBe(false);
    });

    it("should reject purchase order without items", () => {
      const invalidPurchaseOrder = {
        supplierId: 1,
        orderNumber: "PO-2024-014",
        orderDate: "2024-01-15T10:00:00Z",
        subtotal: 1000,
        totalAmount: 1000,
        items: [],
      };

      const result = createPurchaseOrderSchema.safeParse(invalidPurchaseOrder);
      expect(result.success).toBe(false);
    });

    it("should validate purchase order with multiple items", () => {
      const validPurchaseOrder = {
        supplierId: 1,
        orderNumber: "PO-2024-015",
        orderDate: "2024-01-15T10:00:00Z",
        subtotal: 15000,
        totalAmount: 15000,
        items: [
          {
            productId: 1,
            quantityOrdered: 5,
            unitCost: 2000,
            totalCost: 10000,
          },
          {
            productId: 2,
            quantityOrdered: 10,
            unitCost: 500,
            totalCost: 5000,
          },
        ],
      };

      const result = createPurchaseOrderSchema.safeParse(validPurchaseOrder);
      expect(result.success).toBe(true);
    });

    it("should validate purchase order with product variant", () => {
      const validPurchaseOrder = {
        supplierId: 1,
        orderNumber: "PO-2024-016",
        orderDate: "2024-01-15T10:00:00Z",
        subtotal: 1000,
        totalAmount: 1000,
        items: [
          {
            variantId: 1,
            quantityOrdered: 1,
            unitCost: 1000,
            totalCost: 1000,
          },
        ],
      };

      const result = createPurchaseOrderSchema.safeParse(validPurchaseOrder);
      expect(result.success).toBe(true);
    });

    it("should reject item with negative quantity", () => {
      const invalidPurchaseOrder = {
        supplierId: 1,
        orderNumber: "PO-2024-017",
        orderDate: "2024-01-15T10:00:00Z",
        subtotal: 1000,
        totalAmount: 1000,
        items: [
          {
            quantityOrdered: -1,
            unitCost: 1000,
            totalCost: 1000,
          },
        ],
      };

      const result = createPurchaseOrderSchema.safeParse(invalidPurchaseOrder);
      expect(result.success).toBe(false);
    });

    it("should reject item with zero quantity", () => {
      const invalidPurchaseOrder = {
        supplierId: 1,
        orderNumber: "PO-2024-018",
        orderDate: "2024-01-15T10:00:00Z",
        subtotal: 1000,
        totalAmount: 1000,
        items: [
          {
            quantityOrdered: 0,
            unitCost: 1000,
            totalCost: 1000,
          },
        ],
      };

      const result = createPurchaseOrderSchema.safeParse(invalidPurchaseOrder);
      expect(result.success).toBe(false);
    });

    it("should reject item with negative unit cost", () => {
      const invalidPurchaseOrder = {
        supplierId: 1,
        orderNumber: "PO-2024-019",
        orderDate: "2024-01-15T10:00:00Z",
        subtotal: 1000,
        totalAmount: 1000,
        items: [
          {
            quantityOrdered: 1,
            unitCost: -1000,
            totalCost: 1000,
          },
        ],
      };

      const result = createPurchaseOrderSchema.safeParse(invalidPurchaseOrder);
      expect(result.success).toBe(false);
    });

    it("should reject item with zero unit cost", () => {
      const invalidPurchaseOrder = {
        supplierId: 1,
        orderNumber: "PO-2024-020",
        orderDate: "2024-01-15T10:00:00Z",
        subtotal: 1000,
        totalAmount: 1000,
        items: [
          {
            quantityOrdered: 1,
            unitCost: 0,
            totalCost: 1000,
          },
        ],
      };

      const result = createPurchaseOrderSchema.safeParse(invalidPurchaseOrder);
      expect(result.success).toBe(false);
    });

    it("should reject item with negative total cost", () => {
      const invalidPurchaseOrder = {
        supplierId: 1,
        orderNumber: "PO-2024-021",
        orderDate: "2024-01-15T10:00:00Z",
        subtotal: 1000,
        totalAmount: 1000,
        items: [
          {
            quantityOrdered: 1,
            unitCost: 1000,
            totalCost: -1000,
          },
        ],
      };

      const result = createPurchaseOrderSchema.safeParse(invalidPurchaseOrder);
      expect(result.success).toBe(false);
    });

    it("should reject item with zero total cost", () => {
      const invalidPurchaseOrder = {
        supplierId: 1,
        orderNumber: "PO-2024-022",
        orderDate: "2024-01-15T10:00:00Z",
        subtotal: 1000,
        totalAmount: 1000,
        items: [
          {
            quantityOrdered: 1,
            unitCost: 1000,
            totalCost: 0,
          },
        ],
      };

      const result = createPurchaseOrderSchema.safeParse(invalidPurchaseOrder);
      expect(result.success).toBe(false);
    });
  });

  describe("validatePurchaseOrderTotals", () => {
    it("should validate correct totals", () => {
      const data = {
        subtotal: 1000,
        taxAmount: 50,
        shippingCost: 25,
        totalAmount: 1075,
        items: [{ totalCost: 600 }, { totalCost: 400 }],
      };

      const result = validatePurchaseOrderTotals(data);
      expect(result.totalsMatch).toBe(true);
      expect(result.itemsMatch).toBe(true);
      expect(result.calculatedTotal).toBe(1075);
      expect(result.itemsTotal).toBe(1000);
    });

    it("should detect total amount mismatch", () => {
      const data = {
        subtotal: 1000,
        taxAmount: 50,
        shippingCost: 25,
        totalAmount: 1100, // Should be 1075
        items: [{ totalCost: 600 }, { totalCost: 400 }],
      };

      const result = validatePurchaseOrderTotals(data);
      expect(result.totalsMatch).toBe(false);
      expect(result.calculatedTotal).toBe(1075);
    });

    it("should detect subtotal mismatch", () => {
      const data = {
        subtotal: 1000,
        taxAmount: 50,
        shippingCost: 25,
        totalAmount: 1075,
        items: [
          { totalCost: 600 },
          { totalCost: 500 }, // Should be 400
        ],
      };

      const result = validatePurchaseOrderTotals(data);
      expect(result.itemsMatch).toBe(false);
      expect(result.itemsTotal).toBe(1100);
    });

    it("should handle zero tax and shipping", () => {
      const data = {
        subtotal: 1000,
        taxAmount: 0,
        shippingCost: 0,
        totalAmount: 1000,
        items: [{ totalCost: 1000 }],
      };

      const result = validatePurchaseOrderTotals(data);
      expect(result.totalsMatch).toBe(true);
      expect(result.itemsMatch).toBe(true);
    });
  });

  describe("validatePurchaseOrderRules", () => {
    it("should validate purchase order within limits", () => {
      const data = {
        items: [{ quantityOrdered: 10 }, { quantityOrdered: 5 }],
        totalAmount: 1000,
      };

      const errors = validatePurchaseOrderRules(data);
      expect(errors).toHaveLength(0);
    });

    it("should reject too many items", () => {
      const data = {
        items: Array(101).fill({ quantityOrdered: 1 }),
        totalAmount: 1000,
      };

      const errors = validatePurchaseOrderRules(data);
      expect(errors).toContain("Maximum 100 items allowed per order");
    });

    it("should reject excessive total amount", () => {
      const data = {
        items: [{ quantityOrdered: 1 }],
        totalAmount: 10000001, // Exceeds 10 million
      };

      const errors = validatePurchaseOrderRules(data);
      expect(errors).toContain("Maximum order amount is ₦10,000,000");
    });

    it("should reject insufficient total amount", () => {
      const data = {
        items: [{ quantityOrdered: 1 }],
        totalAmount: 50, // Below 100 minimum
      };

      const errors = validatePurchaseOrderRules(data);
      expect(errors).toContain("Minimum order amount is ₦100");
    });

    it("should reject excessive quantity per item", () => {
      const data = {
        items: [{ quantityOrdered: 10001 }],
        totalAmount: 1000,
      };

      const errors = validatePurchaseOrderRules(data);
      expect(errors).toContain("Maximum quantity per item is 10000");
    });

    it("should reject insufficient quantity per item", () => {
      const data = {
        items: [{ quantityOrdered: 0 }],
        totalAmount: 1000,
      };

      const errors = validatePurchaseOrderRules(data);
      expect(errors).toContain("Minimum quantity per item is 1");
    });

    it("should handle multiple rule violations", () => {
      const data = {
        items: [{ quantityOrdered: 0 }, { quantityOrdered: 10001 }],
        totalAmount: 50,
      };

      const errors = validatePurchaseOrderRules(data);
      expect(errors).toHaveLength(4);
      expect(errors).toContain("Minimum order amount is ₦100");
      expect(errors).toContain("Minimum quantity per item is 1");
      expect(errors).toContain("Maximum quantity per item is 10000");
    });
  });

  describe("validateStatusTransition", () => {
    it("should allow valid status transitions", () => {
      expect(validateStatusTransition("draft", "ordered")).toBe(true);
      expect(validateStatusTransition("draft", "cancelled")).toBe(true);
      expect(validateStatusTransition("ordered", "partial_received")).toBe(
        true
      );
      expect(validateStatusTransition("ordered", "received")).toBe(true);
      expect(validateStatusTransition("partial_received", "received")).toBe(
        true
      );
    });

    it("should reject invalid status transitions", () => {
      expect(validateStatusTransition("draft", "received")).toBe(false);
      expect(validateStatusTransition("ordered", "draft")).toBe(false);
      expect(validateStatusTransition("received", "ordered")).toBe(false);
      expect(validateStatusTransition("cancelled", "ordered")).toBe(false);
    });

    it("should handle unknown current status", () => {
      expect(validateStatusTransition("unknown", "ordered")).toBe(false);
    });
  });

  describe("PURCHASE_ORDER_STATUS_TRANSITIONS", () => {
    it("should have correct transition rules", () => {
      expect(PURCHASE_ORDER_STATUS_TRANSITIONS.draft).toEqual([
        "ordered",
        "cancelled",
      ]);
      expect(PURCHASE_ORDER_STATUS_TRANSITIONS.ordered).toEqual([
        "partial_received",
        "received",
        "cancelled",
      ]);
      expect(PURCHASE_ORDER_STATUS_TRANSITIONS.partial_received).toEqual([
        "received",
        "cancelled",
      ]);
      expect(PURCHASE_ORDER_STATUS_TRANSITIONS.received).toEqual([]);
      expect(PURCHASE_ORDER_STATUS_TRANSITIONS.cancelled).toEqual([]);
    });
  });

  describe("PURCHASE_ORDER_RULES", () => {
    it("should have correct business rule values", () => {
      expect(PURCHASE_ORDER_RULES.MAX_ITEMS_PER_ORDER).toBe(100);
      expect(PURCHASE_ORDER_RULES.MAX_TOTAL_AMOUNT).toBe(10000000);
      expect(PURCHASE_ORDER_RULES.MIN_ORDER_AMOUNT).toBe(100);
      expect(PURCHASE_ORDER_RULES.MAX_QUANTITY_PER_ITEM).toBe(10000);
      expect(PURCHASE_ORDER_RULES.MIN_QUANTITY_PER_ITEM).toBe(1);
    });
  });

  describe("updatePurchaseOrderSchema", () => {
    it("should validate partial update", () => {
      const updateData = {
        status: "ordered",
        notes: "Updated notes",
      };

      const result = updatePurchaseOrderSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it("should reject empty update object", () => {
      const updateData = {};

      const result = updatePurchaseOrderSchema.safeParse(updateData);
      expect(result.success).toBe(false);
    });

    it("should validate single field update", () => {
      const updateData = {
        status: "received",
      };

      const result = updatePurchaseOrderSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });
  });

  describe("purchaseOrderQuerySchema", () => {
    it("should validate basic query parameters", () => {
      const query = {
        page: 1,
        limit: 10,
        search: "PO-2024",
        sortBy: "orderDate",
        sortOrder: "desc",
      };

      const result = purchaseOrderQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it("should validate query with filters", () => {
      const query = {
        page: 1,
        limit: 10,
        supplierId: 1,
        status: "ordered",
        fromDate: "2024-01-01T00:00:00Z",
        toDate: "2024-12-31T23:59:59Z",
      };

      const result = purchaseOrderQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const query = {
        page: 1,
        limit: 10,
        status: "invalid_status",
      };

      const result = purchaseOrderQuerySchema.safeParse(query);
      expect(result.success).toBe(false);
    });

    it("should reject invalid sortBy", () => {
      const query = {
        page: 1,
        limit: 10,
        sortBy: "invalid_sort",
      };

      const result = purchaseOrderQuerySchema.safeParse(query);
      expect(result.success).toBe(false);
    });
  });

  describe("purchaseOrderIdSchema", () => {
    it("should validate positive integer ID", () => {
      const data = { id: 1 };

      const result = purchaseOrderIdSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject negative ID", () => {
      const data = { id: -1 };

      const result = purchaseOrderIdSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject zero ID", () => {
      const data = { id: 0 };

      const result = purchaseOrderIdSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("fulfillPurchaseOrderSchema", () => {
    it("should validate fulfillment data", () => {
      const fulfillmentData = {
        items: [
          {
            itemId: 1,
            quantityReceived: 5,
            notes: "Received in good condition",
          },
        ],
        actualDeliveryDate: "2024-01-20T10:00:00Z",
        notes: "Partial delivery",
      };

      const result = fulfillPurchaseOrderSchema.safeParse(fulfillmentData);
      expect(result.success).toBe(true);
    });

    it("should reject empty items array", () => {
      const fulfillmentData = {
        items: [],
        actualDeliveryDate: "2024-01-20T10:00:00Z",
      };

      const result = fulfillPurchaseOrderSchema.safeParse(fulfillmentData);
      expect(result.success).toBe(false);
    });

    it("should reject negative quantity received", () => {
      const fulfillmentData = {
        items: [
          {
            itemId: 1,
            quantityReceived: -1,
          },
        ],
      };

      const result = fulfillPurchaseOrderSchema.safeParse(fulfillmentData);
      expect(result.success).toBe(false);
    });
  });

  describe("updatePurchaseOrderStatusSchema", () => {
    it("should validate status update", () => {
      const statusUpdate = {
        status: "ordered",
        notes: "Order confirmed with supplier",
      };

      const result = updatePurchaseOrderStatusSchema.safeParse(statusUpdate);
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const statusUpdate = {
        status: "invalid_status",
      };

      const result = updatePurchaseOrderStatusSchema.safeParse(statusUpdate);
      expect(result.success).toBe(false);
    });

    it("should validate status update without notes", () => {
      const statusUpdate = {
        status: "received",
      };

      const result = updatePurchaseOrderStatusSchema.safeParse(statusUpdate);
      expect(result.success).toBe(true);
    });
  });
});
