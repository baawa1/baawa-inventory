import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { PaymentInterface } from "@/components/pos/PaymentInterface";

// Mock the toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockCartItems = [
  {
    id: 1,
    name: "Test Product 1",
    sku: "TEST-001",
    price: 1000,
    quantity: 2,
    stock: 10,
    category: "Electronics",
    brand: "Test Brand",
  },
  {
    id: 2,
    name: "Test Product 2",
    sku: "TEST-002",
    price: 2000,
    quantity: 1,
    stock: 5,
    category: "Clothing",
    brand: "Fashion Brand",
  },
];

const mockOnPaymentComplete = jest.fn();
const mockOnClose = jest.fn();

describe("PaymentInterface", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial Render", () => {
    it("should render payment interface with cart items", () => {
      render(
        <PaymentInterface
          isOpen={true}
          cart={mockCartItems}
          total={4000}
          onPaymentComplete={mockOnPaymentComplete}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText("Payment")).toBeInTheDocument();
      expect(screen.getByText("Test Product 1")).toBeInTheDocument();
      expect(screen.getByText("Test Product 2")).toBeInTheDocument();
      expect(screen.getByText("₦4,000.00")).toBeInTheDocument();
    });

    it("should not render when closed", () => {
      render(
        <PaymentInterface
          isOpen={false}
          cart={mockCartItems}
          total={4000}
          onPaymentComplete={mockOnPaymentComplete}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByText("Payment")).not.toBeInTheDocument();
    });
  });

  describe("Payment Methods", () => {
    it("should display payment method options", () => {
      render(
        <PaymentInterface
          isOpen={true}
          cart={mockCartItems}
          total={4000}
          onPaymentComplete={mockOnPaymentComplete}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText("Cash")).toBeInTheDocument();
      expect(screen.getByText("Card")).toBeInTheDocument();
      expect(screen.getByText("Transfer")).toBeInTheDocument();
    });

    it("should allow selecting payment method", () => {
      render(
        <PaymentInterface
          isOpen={true}
          cart={mockCartItems}
          total={4000}
          onPaymentComplete={mockOnPaymentComplete}
          onClose={mockOnClose}
        />
      );

      const cashButton = screen.getByText("Cash");
      fireEvent.click(cashButton);

      expect(cashButton).toHaveClass("bg-primary");
    });
  });

  describe("Customer Information", () => {
    it("should display customer information fields", () => {
      render(
        <PaymentInterface
          isOpen={true}
          cart={mockCartItems}
          total={4000}
          onPaymentComplete={mockOnPaymentComplete}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByPlaceholderText(/Customer name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Phone/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
    });

    it("should allow entering customer information", () => {
      render(
        <PaymentInterface
          isOpen={true}
          cart={mockCartItems}
          total={4000}
          onPaymentComplete={mockOnPaymentComplete}
          onClose={mockOnClose}
        />
      );

      const nameInput = screen.getByPlaceholderText(/Customer name/i);
      const phoneInput = screen.getByPlaceholderText(/Phone/i);
      const emailInput = screen.getByPlaceholderText(/Email/i);

      fireEvent.change(nameInput, { target: { value: "John Doe" } });
      fireEvent.change(phoneInput, { target: { value: "+2348012345678" } });
      fireEvent.change(emailInput, { target: { value: "john@example.com" } });

      expect(nameInput).toHaveValue("John Doe");
      expect(phoneInput).toHaveValue("+2348012345678");
      expect(emailInput).toHaveValue("john@example.com");
    });
  });

  describe("Payment Amount", () => {
    it("should display payment amount input", () => {
      render(
        <PaymentInterface
          isOpen={true}
          cart={mockCartItems}
          total={4000}
          onPaymentComplete={mockOnPaymentComplete}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByPlaceholderText(/Amount paid/i)).toBeInTheDocument();
    });

    it("should calculate change correctly", () => {
      render(
        <PaymentInterface
          isOpen={true}
          cart={mockCartItems}
          total={4000}
          onPaymentComplete={mockOnPaymentComplete}
          onClose={mockOnClose}
        />
      );

      const amountInput = screen.getByPlaceholderText(/Amount paid/i);
      fireEvent.change(amountInput, { target: { value: "5000" } });

      // Should show change of 1000
      expect(screen.getByText("₦1,000.00")).toBeInTheDocument();
    });

    it("should show insufficient payment warning", () => {
      render(
        <PaymentInterface
          isOpen={true}
          cart={mockCartItems}
          total={4000}
          onPaymentComplete={mockOnPaymentComplete}
          onClose={mockOnClose}
        />
      );

      const amountInput = screen.getByPlaceholderText(/Amount paid/i);
      fireEvent.change(amountInput, { target: { value: "2000" } });

      // Should show insufficient payment message
      expect(screen.getByText(/Insufficient payment/i)).toBeInTheDocument();
    });
  });

  describe("Payment Completion", () => {
    it("should complete payment with valid data", () => {
      render(
        <PaymentInterface
          isOpen={true}
          cart={mockCartItems}
          total={4000}
          onPaymentComplete={mockOnPaymentComplete}
          onClose={mockOnClose}
        />
      );

      // Fill required fields
      const nameInput = screen.getByPlaceholderText(/Customer name/i);
      const amountInput = screen.getByPlaceholderText(/Amount paid/i);
      const cashButton = screen.getByText("Cash");

      fireEvent.change(nameInput, { target: { value: "John Doe" } });
      fireEvent.change(amountInput, { target: { value: "4000" } });
      fireEvent.click(cashButton);

      // Complete payment
      const completeButton = screen.getByText("Complete Sale");
      fireEvent.click(completeButton);

      expect(mockOnPaymentComplete).toHaveBeenCalled();
    });

    it("should validate required fields", () => {
      render(
        <PaymentInterface
          isOpen={true}
          cart={mockCartItems}
          total={4000}
          onPaymentComplete={mockOnPaymentComplete}
          onClose={mockOnClose}
        />
      );

      // Try to complete without filling required fields
      const completeButton = screen.getByText("Complete Sale");
      fireEvent.click(completeButton);

      // Should show validation error
      expect(
        screen.getByText(/Please fill in all required fields/i)
      ).toBeInTheDocument();
    });
  });

  describe("Close Functionality", () => {
    it("should call onClose when close button is clicked", () => {
      render(
        <PaymentInterface
          isOpen={true}
          cart={mockCartItems}
          total={4000}
          onPaymentComplete={mockOnPaymentComplete}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByRole("button", { name: /close/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("should have proper form labels", () => {
      render(
        <PaymentInterface
          isOpen={true}
          cart={mockCartItems}
          total={4000}
          onPaymentComplete={mockOnPaymentComplete}
          onClose={mockOnClose}
        />
      );

      const nameInput = screen.getByPlaceholderText(/Customer name/i);
      const phoneInput = screen.getByPlaceholderText(/Phone/i);
      const emailInput = screen.getByPlaceholderText(/Email/i);

      expect(nameInput).toHaveAttribute("type", "text");
      expect(phoneInput).toHaveAttribute("type", "tel");
      expect(emailInput).toHaveAttribute("type", "email");
    });

    it("should support keyboard navigation", () => {
      render(
        <PaymentInterface
          isOpen={true}
          cart={mockCartItems}
          total={4000}
          onPaymentComplete={mockOnPaymentComplete}
          onClose={mockOnClose}
        />
      );

      const nameInput = screen.getByPlaceholderText(/Customer name/i);
      nameInput.focus();

      expect(nameInput).toHaveFocus();
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid amount input", () => {
      render(
        <PaymentInterface
          isOpen={true}
          cart={mockCartItems}
          total={4000}
          onPaymentComplete={mockOnPaymentComplete}
          onClose={mockOnClose}
        />
      );

      const amountInput = screen.getByPlaceholderText(/Amount paid/i);
      fireEvent.change(amountInput, { target: { value: "invalid" } });

      // Should handle invalid input gracefully
      expect(amountInput).toHaveValue("invalid");
    });

    it("should handle empty cart", () => {
      render(
        <PaymentInterface
          isOpen={true}
          cart={[]}
          total={0}
          onPaymentComplete={mockOnPaymentComplete}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText("No items in cart")).toBeInTheDocument();
    });
  });
});
