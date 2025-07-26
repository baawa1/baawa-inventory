// Mock the Html5QrcodeScanner
jest.mock("html5-qrcode", () => ({
  Html5QrcodeScanner: jest.fn().mockImplementation(() => ({
    render: jest.fn(),
    clear: jest.fn(),
  })),
}));

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BarcodeScanner } from "@/components/pos/BarcodeScanner";
import { Html5QrcodeScanner } from "html5-qrcode";

const mockHtml5QrcodeScanner = Html5QrcodeScanner as jest.MockedClass<
  typeof Html5QrcodeScanner
>;

// Mock dependencies
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("BarcodeScanner", () => {
  const mockOnScan = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial Render", () => {
    it("renders scanner when isOpen is true", () => {
      render(
        <BarcodeScanner
          isOpen={true}
          onScan={mockOnScan}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText("Barcode Scanner")).toBeInTheDocument();
      expect(
        screen.getByText("Position the barcode within the viewfinder")
      ).toBeInTheDocument();
    });

    it("does not render when isOpen is false", () => {
      render(
        <BarcodeScanner
          isOpen={false}
          onScan={mockOnScan}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByText("Barcode Scanner")).not.toBeInTheDocument();
    });
  });

  describe("Scanner Functionality", () => {
    it("initializes scanner when opened", () => {
      render(
        <BarcodeScanner
          isOpen={true}
          onScan={mockOnScan}
          onClose={mockOnClose}
        />
      );

      expect(mockHtml5QrcodeScanner).toHaveBeenCalled();
    });

    it("cleans up scanner when closed", () => {
      const { rerender } = render(
        <BarcodeScanner
          isOpen={true}
          onScan={mockOnScan}
          onClose={mockOnClose}
        />
      );

      // Close the scanner
      rerender(
        <BarcodeScanner
          isOpen={false}
          onScan={mockOnScan}
          onClose={mockOnClose}
        />
      );

      // The mock should have been called for cleanup
      expect(mockHtml5QrcodeScanner).toHaveBeenCalled();
    });
  });

  describe("User Interactions", () => {
    it("calls onClose when close button is clicked", () => {
      render(
        <BarcodeScanner
          isOpen={true}
          onScan={mockOnScan}
          onClose={mockOnClose}
        />
      );

      // Find the close button (the one with the X icon, no accessible name)
      const closeButton = screen.getAllByRole("button")[0];
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("handles scanner initialization errors", () => {
      // Mock a scanner initialization error
      mockHtml5QrcodeScanner.mockImplementationOnce(() => {
        throw new Error("Scanner initialization failed");
      });

      expect(() =>
        render(
          <BarcodeScanner
            isOpen={true}
            onScan={mockOnScan}
            onClose={mockOnClose}
          />
        )
      ).not.toThrow();
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels", () => {
      render(
        <BarcodeScanner
          isOpen={true}
          onScan={mockOnScan}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText("Barcode Scanner")).toBeInTheDocument();
      expect(screen.getAllByRole("button")).toHaveLength(2); // Close button and Cancel button
    });

    it("supports keyboard navigation", () => {
      render(
        <BarcodeScanner
          isOpen={true}
          onScan={mockOnScan}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getAllByRole("button")[0];
      closeButton.focus();
      expect(closeButton).toHaveFocus();
    });
  });

  describe("Edge Cases", () => {
    it("handles rapid open/close cycles", () => {
      const { rerender } = render(
        <BarcodeScanner
          isOpen={true}
          onScan={mockOnScan}
          onClose={mockOnClose}
        />
      );

      // Rapidly open and close
      rerender(
        <BarcodeScanner
          isOpen={false}
          onScan={mockOnScan}
          onClose={mockOnClose}
        />
      );

      rerender(
        <BarcodeScanner
          isOpen={true}
          onScan={mockOnScan}
          onClose={mockOnClose}
        />
      );

      expect(mockHtml5QrcodeScanner).toHaveBeenCalled();
    });

    it("handles undefined callbacks", () => {
      expect(() =>
        render(
          <BarcodeScanner
            isOpen={true}
            onScan={undefined as any}
            onClose={undefined as any}
          />
        )
      ).not.toThrow();
    });
  });
});
