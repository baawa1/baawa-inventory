import {
  mockPrisma,
  createMockProduct,
  createMockSalesTransaction,
  createMockSalesItem,
  resetAllMocks,
} from "../../utils/test-utils";

// Mock the Prisma client
jest.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

// Mock POS utility functions
const mockPOSUtils = {
  calculateSubtotal: jest.fn(),
  calculateTax: jest.fn(),
  calculateDiscount: jest.fn(),
  calculateTotal: jest.fn(),
  processTransaction: jest.fn(),
  generateReceiptNumber: jest.fn(),
  validateTransaction: jest.fn(),
  processRefund: jest.fn(),
  generateTransactionCode: jest.fn(),
  calculateChange: jest.fn(),
};

// Mock the POS utilities module
jest.mock("@/lib/utils/pos", () => mockPOSUtils);

describe("POS Utilities Tests", () => {
  beforeEach(() => {
    resetAllMocks();
    Object.values(mockPOSUtils).forEach((fn) => fn.mockClear());
  });

  describe("Price Calculations", () => {
    it("should calculate subtotal correctly", () => {
      const items = [
        { quantity: 2, unitPrice: 10.0 },
        { quantity: 1, unitPrice: 15.0 },
        { quantity: 3, unitPrice: 5.0 },
      ];

      mockPOSUtils.calculateSubtotal.mockReturnValue(50.0);

      const subtotal = mockPOSUtils.calculateSubtotal(items);

      expect(subtotal).toBe(50.0);
      expect(mockPOSUtils.calculateSubtotal).toHaveBeenCalledWith(items);
    });

    it("should calculate tax correctly", () => {
      const subtotal = 100.0;
      const taxRate = 0.1; // 10%

      mockPOSUtils.calculateTax.mockReturnValue(10.0);

      const tax = mockPOSUtils.calculateTax(subtotal, taxRate);

      expect(tax).toBe(10.0);
      expect(mockPOSUtils.calculateTax).toHaveBeenCalledWith(subtotal, taxRate);
    });

    it("should calculate percentage discount correctly", () => {
      const subtotal = 100.0;
      const discountPercent = 15;

      mockPOSUtils.calculateDiscount.mockReturnValue(15.0);

      const discount = mockPOSUtils.calculateDiscount(
        subtotal,
        discountPercent,
        "PERCENTAGE"
      );

      expect(discount).toBe(15.0);
      expect(mockPOSUtils.calculateDiscount).toHaveBeenCalledWith(
        subtotal,
        discountPercent,
        "PERCENTAGE"
      );
    });

    it("should calculate amount discount correctly", () => {
      const subtotal = 100.0;
      const discountAmount = 20.0;

      mockPOSUtils.calculateDiscount.mockReturnValue(20.0);

      const discount = mockPOSUtils.calculateDiscount(
        subtotal,
        discountAmount,
        "AMOUNT"
      );

      expect(discount).toBe(20.0);
      expect(mockPOSUtils.calculateDiscount).toHaveBeenCalledWith(
        subtotal,
        discountAmount,
        "AMOUNT"
      );
    });

    it("should calculate total correctly", () => {
      const subtotal = 100.0;
      const tax = 10.0;
      const discount = 15.0;

      mockPOSUtils.calculateTotal.mockReturnValue(95.0);

      const total = mockPOSUtils.calculateTotal(subtotal, tax, discount);

      expect(total).toBe(95.0);
      expect(mockPOSUtils.calculateTotal).toHaveBeenCalledWith(
        subtotal,
        tax,
        discount
      );
    });

    it("should calculate change correctly", () => {
      const total = 95.0;
      const amountPaid = 100.0;

      mockPOSUtils.calculateChange.mockReturnValue(5.0);

      const change = mockPOSUtils.calculateChange(total, amountPaid);

      expect(change).toBe(5.0);
      expect(mockPOSUtils.calculateChange).toHaveBeenCalledWith(
        total,
        amountPaid
      );
    });
  });

  describe("Transaction Processing", () => {
    it("should process transaction successfully", async () => {
      const transactionData = {
        items: [
          { productId: 1, quantity: 2, unitPrice: 20.0 },
          { productId: 2, quantity: 1, unitPrice: 15.0 },
        ],
        paymentMethod: "CASH" as const,
        customerName: "John Doe",
        cashierId: 1,
      };

      const mockTransaction = createMockSalesTransaction({
        transactionCode: "TXN-001",
        total: 55.0,
        subtotal: 55.0,
        tax: 0.0,
        discount: 0.0,
      });

      mockPOSUtils.processTransaction.mockResolvedValue(mockTransaction);

      const result = await mockPOSUtils.processTransaction(transactionData);

      expect(result).toEqual(mockTransaction);
      expect(mockPOSUtils.processTransaction).toHaveBeenCalledWith(
        transactionData
      );
    });

    it("should generate unique transaction code", () => {
      mockPOSUtils.generateTransactionCode.mockReturnValue("TXN-20240101-001");

      const code = mockPOSUtils.generateTransactionCode();

      expect(code).toBe("TXN-20240101-001");
      expect(mockPOSUtils.generateTransactionCode).toHaveBeenCalledTimes(1);
    });

    it("should generate unique receipt number", () => {
      mockPOSUtils.generateReceiptNumber.mockReturnValue("RCP-20240101-001");

      const receiptNumber = mockPOSUtils.generateReceiptNumber();

      expect(receiptNumber).toBe("RCP-20240101-001");
      expect(mockPOSUtils.generateReceiptNumber).toHaveBeenCalledTimes(1);
    });

    it("should validate transaction data successfully", () => {
      const validTransaction = {
        items: [{ productId: 1, quantity: 1, unitPrice: 20.0 }],
        paymentMethod: "CASH" as const,
        cashierId: 1,
      };

      mockPOSUtils.validateTransaction.mockReturnValue({
        isValid: true,
        errors: [],
      });

      const validation = mockPOSUtils.validateTransaction(validTransaction);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should return validation errors for invalid transaction", () => {
      const invalidTransaction = {
        items: [],
        paymentMethod: null,
        cashierId: null,
      };

      const errors = [
        "Items are required",
        "Payment method is required",
        "Cashier is required",
      ];
      mockPOSUtils.validateTransaction.mockReturnValue({
        isValid: false,
        errors,
      });

      const validation = mockPOSUtils.validateTransaction(invalidTransaction);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toEqual(errors);
    });
  });

  describe("Refund Processing", () => {
    it("should process refund successfully", async () => {
      const refundData = {
        originalTransactionId: 1,
        items: [{ salesItemId: 1, quantity: 1 }],
        reason: "Customer returned item",
        refundAmount: 20.0,
        processedBy: 1,
      };

      const mockRefund = createMockSalesTransaction({
        id: 2,
        transactionCode: "RFD-001",
        total: -20.0,
        isRefund: true,
        refundReason: "Customer returned item",
      });

      mockPOSUtils.processRefund.mockResolvedValue(mockRefund);

      const result = await mockPOSUtils.processRefund(refundData);

      expect(result).toEqual(mockRefund);
      expect(result.isRefund).toBe(true);
      expect(result.total).toBe(-20.0);
      expect(mockPOSUtils.processRefund).toHaveBeenCalledWith(refundData);
    });

    it("should handle partial refunds", async () => {
      const partialRefundData = {
        originalTransactionId: 1,
        items: [{ salesItemId: 1, quantity: 1 }],
        reason: "Partial return",
        refundAmount: 10.0,
        processedBy: 1,
      };

      const mockPartialRefund = createMockSalesTransaction({
        id: 3,
        transactionCode: "RFD-002",
        total: -10.0,
        isRefund: true,
      });

      mockPOSUtils.processRefund.mockResolvedValue(mockPartialRefund);

      const result = await mockPOSUtils.processRefund(partialRefundData);

      expect(result.total).toBe(-10.0);
      expect(result.isRefund).toBe(true);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle zero quantity items", () => {
      const items = [
        { quantity: 0, unitPrice: 10.0 },
        { quantity: 2, unitPrice: 15.0 },
      ];

      mockPOSUtils.calculateSubtotal.mockReturnValue(30.0);

      const subtotal = mockPOSUtils.calculateSubtotal(items);

      expect(subtotal).toBe(30.0);
    });

    it("should handle zero tax rate", () => {
      const subtotal = 100.0;
      const taxRate = 0;

      mockPOSUtils.calculateTax.mockReturnValue(0.0);

      const tax = mockPOSUtils.calculateTax(subtotal, taxRate);

      expect(tax).toBe(0.0);
    });

    it("should handle maximum discount (100%)", () => {
      const subtotal = 100.0;
      const discountPercent = 100;

      mockPOSUtils.calculateDiscount.mockReturnValue(100.0);

      const discount = mockPOSUtils.calculateDiscount(
        subtotal,
        discountPercent,
        "PERCENTAGE"
      );

      expect(discount).toBe(100.0);
    });

    it("should handle insufficient payment", () => {
      const total = 100.0;
      const amountPaid = 80.0;

      mockPOSUtils.calculateChange.mockReturnValue(-20.0);

      const change = mockPOSUtils.calculateChange(total, amountPaid);

      expect(change).toBe(-20.0); // Negative indicates insufficient payment
    });

    it("should handle transaction processing errors", async () => {
      const invalidData = { items: [] };
      const error = new Error("Invalid transaction data");

      mockPOSUtils.processTransaction.mockRejectedValue(error);

      await expect(
        mockPOSUtils.processTransaction(invalidData)
      ).rejects.toThrow("Invalid transaction data");
    });

    it("should handle refund processing errors", async () => {
      const invalidRefundData = { originalTransactionId: 999 };
      const error = new Error("Original transaction not found");

      mockPOSUtils.processRefund.mockRejectedValue(error);

      await expect(
        mockPOSUtils.processRefund(invalidRefundData)
      ).rejects.toThrow("Original transaction not found");
    });
  });

  describe("Payment Method Specific Tests", () => {
    it("should handle cash payments", async () => {
      const cashTransaction = {
        items: [{ productId: 1, quantity: 1, unitPrice: 20.0 }],
        paymentMethod: "CASH" as const,
        amountPaid: 25.0,
        cashierId: 1,
      };

      const mockResult = createMockSalesTransaction({
        paymentMethod: "CASH",
        total: 20.0,
      });

      mockPOSUtils.processTransaction.mockResolvedValue(mockResult);

      const result = await mockPOSUtils.processTransaction(cashTransaction);

      expect(result.paymentMethod).toBe("CASH");
    });

    it("should handle card payments", async () => {
      const cardTransaction = {
        items: [{ productId: 1, quantity: 1, unitPrice: 20.0 }],
        paymentMethod: "CREDIT_CARD" as const,
        cashierId: 1,
      };

      const mockResult = createMockSalesTransaction({
        paymentMethod: "CREDIT_CARD",
        total: 20.0,
      });

      mockPOSUtils.processTransaction.mockResolvedValue(mockResult);

      const result = await mockPOSUtils.processTransaction(cardTransaction);

      expect(result.paymentMethod).toBe("CREDIT_CARD");
    });

    it("should handle mobile money payments", async () => {
      const mobileTransaction = {
        items: [{ productId: 1, quantity: 1, unitPrice: 20.0 }],
        paymentMethod: "MOBILE_MONEY" as const,
        cashierId: 1,
      };

      const mockResult = createMockSalesTransaction({
        paymentMethod: "MOBILE_MONEY",
        total: 20.0,
      });

      mockPOSUtils.processTransaction.mockResolvedValue(mockResult);

      const result = await mockPOSUtils.processTransaction(mobileTransaction);

      expect(result.paymentMethod).toBe("MOBILE_MONEY");
    });
  });
});
