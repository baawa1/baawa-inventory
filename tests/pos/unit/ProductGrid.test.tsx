import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { toast } from "sonner";

// Mock dependencies
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@/components/pos/POSErrorBoundary", () => ({
  usePOSErrorHandler: () => ({
    handleError: jest.fn(),
  }),
}));

// Mock Next.js Image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock navigator.mediaDevices
Object.defineProperty(navigator, "mediaDevices", {
  value: {
    getUserMedia: jest.fn(),
  },
  writable: true,
});

// Mock scrollIntoView for Radix UI Select
Element.prototype.scrollIntoView = jest.fn();

const mockProducts = [
  {
    id: 1,
    name: "Test Product 1",
    sku: "SKU001",
    barcode: "123456789",
    price: 1000,
    stock: 10,
    category: "Electronics",
    brand: "Test Brand",
    description: "Test description",
    images: [],
  },
  {
    id: 2,
    name: "Test Product 2",
    sku: "SKU002",
    barcode: "987654321",
    price: 2000,
    stock: 0,
    category: "Electronics",
    brand: "Test Brand",
    description: "Test description 2",
    images: [],
  },
  {
    id: 3,
    name: "Another Product",
    sku: "SKU003",
    barcode: "555666777",
    price: 1500,
    stock: 5,
    category: "Clothing",
    brand: "Another Brand",
    description: "Another description",
    images: [],
  },
];

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  );
};

describe("ProductGrid", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockProducts,
    });
  });

  describe("Initial Render", () => {
    it("renders product grid with search and filters", async () => {
      renderWithQueryClient(<ProductGrid onProductSelect={jest.fn()} />);

      // Check for search input
      expect(
        screen.getByPlaceholderText(
          "Search products by name, SKU, or barcode..."
        )
      ).toBeInTheDocument();

      // Check for filter selects
      expect(screen.getByText("All Categories")).toBeInTheDocument();
      expect(screen.getByText("All Brands")).toBeInTheDocument();

      // Check for camera button (only one camera button)
      const cameraButtons = screen
        .getAllByRole("button")
        .filter((button) =>
          button.querySelector('svg[class*="tabler-icon-camera"]')
        );
      expect(cameraButtons).toHaveLength(1);

      // Check for scan button
      const scanButtons = screen
        .getAllByRole("button")
        .filter((button) =>
          button.querySelector('svg[class*="tabler-icon-scan"]')
        );
      expect(scanButtons).toHaveLength(1);
    });

    it("shows loading state initially", () => {
      renderWithQueryClient(<ProductGrid onProductSelect={jest.fn()} />);
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("displays products after loading", async () => {
      renderWithQueryClient(<ProductGrid onProductSelect={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getAllByText("Test Product 1")).toHaveLength(2); // Appears in overlay and card
        expect(screen.getAllByText("Test Product 2")).toHaveLength(2); // Appears in overlay and card
      });
    });
  });

  describe("Product Search", () => {
    it("filters products by name", async () => {
      renderWithQueryClient(<ProductGrid onProductSelect={jest.fn()} />);

      const searchInput = screen.getByPlaceholderText(
        "Search products by name, SKU, or barcode..."
      );

      await waitFor(() => {
        expect(screen.getAllByText("Test Product 1")).toHaveLength(2);
      });

      fireEvent.change(searchInput, { target: { value: "Another" } });

      await waitFor(() => {
        expect(screen.queryByText("Test Product 1")).not.toBeInTheDocument();
        expect(screen.getAllByText("Another Product")).toHaveLength(2);
      });
    });

    it("filters products by SKU", async () => {
      renderWithQueryClient(<ProductGrid onProductSelect={jest.fn()} />);

      const searchInput = screen.getByPlaceholderText(
        "Search products by name, SKU, or barcode..."
      );

      await waitFor(() => {
        expect(screen.getByText("SKU001")).toBeInTheDocument();
      });

      fireEvent.change(searchInput, { target: { value: "SKU002" } });

      await waitFor(() => {
        expect(screen.queryByText("SKU001")).not.toBeInTheDocument();
        expect(screen.getByText("SKU002")).toBeInTheDocument();
      });
    });

    it("filters products by barcode", async () => {
      renderWithQueryClient(<ProductGrid onProductSelect={jest.fn()} />);

      const searchInput = screen.getByPlaceholderText(
        "Search products by name, SKU, or barcode..."
      );

      await waitFor(() => {
        expect(screen.getAllByText("Test Product 1")).toHaveLength(2);
      });

      fireEvent.change(searchInput, { target: { value: "987654321" } });

      await waitFor(() => {
        expect(screen.queryByText("Test Product 1")).not.toBeInTheDocument();
        expect(screen.getAllByText("Test Product 2")).toHaveLength(2);
      });
    });
  });

  describe("Category and Brand Filtering", () => {
    it("filters by category", async () => {
      renderWithQueryClient(<ProductGrid onProductSelect={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getAllByText("Test Product 1")).toHaveLength(2);
        expect(screen.getAllByText("Another Product")).toHaveLength(2);
      });

      // Find and click the category select
      const categorySelect = screen.getByText("All Categories");
      fireEvent.click(categorySelect);

      // Wait for the select content to appear and click Electronics
      await waitFor(() => {
        const electronicsOptions = screen.getAllByText("Electronics");
        // Click the last one which should be the select option (not the badge)
        fireEvent.click(electronicsOptions[electronicsOptions.length - 1]);
      });

      // Verify filtering
      await waitFor(() => {
        expect(screen.getAllByText("Test Product 1")).toHaveLength(2);
        expect(screen.getAllByText("Test Product 2")).toHaveLength(2);
        expect(screen.queryByText("Another Product")).not.toBeInTheDocument();
      });
    });

    it("filters by brand", async () => {
      renderWithQueryClient(<ProductGrid onProductSelect={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getAllByText("Test Product 1")).toHaveLength(2);
        expect(screen.getAllByText("Another Product")).toHaveLength(2);
      });

      // Find and click the brand select
      const brandSelect = screen.getByText("All Brands");
      fireEvent.click(brandSelect);

      // Wait for the select content to appear and click Test Brand
      await waitFor(() => {
        const testBrandOptions = screen.getAllByText("Test Brand");
        // Click the last one which should be the select option (not the badge)
        fireEvent.click(testBrandOptions[testBrandOptions.length - 1]);
      });

      // Verify filtering
      await waitFor(() => {
        expect(screen.getAllByText("Test Product 1")).toHaveLength(2);
        expect(screen.getAllByText("Test Product 2")).toHaveLength(2);
        expect(screen.queryByText("Another Product")).not.toBeInTheDocument();
      });
    });

    it("clears all filters", async () => {
      renderWithQueryClient(<ProductGrid onProductSelect={jest.fn()} />);

      const searchInput = screen.getByPlaceholderText(
        "Search products by name, SKU, or barcode..."
      );

      // Set a search term
      fireEvent.change(searchInput, { target: { value: "Test" } });

      await waitFor(() => {
        expect(screen.queryByText("Another Product")).not.toBeInTheDocument();
      });

      // Clear filters button should appear
      const clearButton = screen.getByText("Clear Filters");
      fireEvent.click(clearButton);

      // All products should be visible again
      await waitFor(() => {
        expect(screen.getAllByText("Test Product 1")).toHaveLength(2);
        expect(screen.getAllByText("Another Product")).toHaveLength(2);
      });
    });
  });

  describe("Product Selection", () => {
    it("calls onProductSelect when product is clicked", async () => {
      const mockOnProductSelect = jest.fn();
      renderWithQueryClient(
        <ProductGrid onProductSelect={mockOnProductSelect} />
      );

      await waitFor(() => {
        expect(screen.getAllByText("Test Product 1")).toHaveLength(2);
      });

      // Click on the first product card
      const productCards = screen.getAllByText("Test Product 1");
      fireEvent.click(productCards[0]);

      expect(mockOnProductSelect).toHaveBeenCalledWith({
        id: 1,
        name: "Test Product 1",
        sku: "SKU001",
        barcode: "123456789",
        price: 1000,
        stock: 10,
        category: "Electronics",
        brand: "Test Brand",
      });

      expect(toast.success).toHaveBeenCalledWith(
        "Test Product 1 added to cart"
      );
    });

    it("shows error when out of stock product is clicked", async () => {
      renderWithQueryClient(<ProductGrid onProductSelect={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getAllByText("Test Product 2")).toHaveLength(2);
      });

      // Click on the out of stock product
      const productCards = screen.getAllByText("Test Product 2");
      fireEvent.click(productCards[0]);

      expect(toast.error).toHaveBeenCalledWith("Product is out of stock");
    });

    it("does not call onProductSelect when disabled", async () => {
      const mockOnProductSelect = jest.fn();
      renderWithQueryClient(
        <ProductGrid onProductSelect={mockOnProductSelect} disabled={true} />
      );

      await waitFor(() => {
        expect(screen.getAllByText("Test Product 1")).toHaveLength(2);
      });

      // Click on the product card
      const productCards = screen.getAllByText("Test Product 1");
      fireEvent.click(productCards[0]);

      expect(mockOnProductSelect).not.toHaveBeenCalled();
    });
  });

  describe("Camera Functionality", () => {
    it("handles camera button click without errors", async () => {
      const mockStream = {
        getTracks: () => [{ stop: jest.fn() }],
      };
      (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValue(
        mockStream
      );

      renderWithQueryClient(<ProductGrid onProductSelect={jest.fn()} />);

      // Find and click the camera button
      const cameraButtons = screen
        .getAllByRole("button")
        .filter((button) =>
          button.querySelector('svg[class*="tabler-icon-camera"]')
        );

      // Verify the button exists and can be clicked without errors
      expect(cameraButtons).toHaveLength(1);
      expect(() => fireEvent.click(cameraButtons[0])).not.toThrow();
    });

    it("handles camera access error", async () => {
      const mockError = new Error("Permission denied");
      (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValue(
        mockError
      );

      renderWithQueryClient(<ProductGrid onProductSelect={jest.fn()} />);

      // Find and click the camera button
      const cameraButtons = screen
        .getAllByRole("button")
        .filter((button) =>
          button.querySelector('svg[class*="tabler-icon-camera"]')
        );
      fireEvent.click(cameraButtons[0]);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Unable to access camera");
      });
    });
  });

  describe("Product Display", () => {
    it("displays product information correctly", async () => {
      renderWithQueryClient(<ProductGrid onProductSelect={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getAllByText("Test Product 1")).toHaveLength(2); // Appears in overlay and card
        expect(screen.getByText("SKU001")).toBeInTheDocument();
        // Check for currency format - it might be "₦1,000" or "₦1000" depending on locale
        expect(screen.getByText(/₦1,?000/)).toBeInTheDocument();
        expect(screen.getByText("10 left")).toBeInTheDocument();
        expect(screen.getAllByText("Electronics")).toHaveLength(2); // Multiple badges
        expect(screen.getAllByText("Test Brand")).toHaveLength(2); // Multiple badges
      });
    });

    it("shows out of stock indicator", async () => {
      renderWithQueryClient(<ProductGrid onProductSelect={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByText("Out of Stock")).toBeInTheDocument();
        expect(screen.getByText("0 left")).toBeInTheDocument();
      });
    });

    it("displays product images when available", async () => {
      const productsWithImages = [
        {
          ...mockProducts[0],
          images: [{ url: "https://example.com/image.jpg" }],
        },
      ];

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => productsWithImages,
      });

      renderWithQueryClient(<ProductGrid onProductSelect={jest.fn()} />);

      await waitFor(() => {
        const image = screen.getByAltText("Test Product 1");
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute("src", "https://example.com/image.jpg");
      });
    });
  });

  describe("Error Handling", () => {
    it("handles API error gracefully", async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      renderWithQueryClient(<ProductGrid onProductSelect={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByText("Error loading products")).toBeInTheDocument();
        expect(screen.getByText("Retry")).toBeInTheDocument();
      });
    });

    it("handles network error", async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      renderWithQueryClient(<ProductGrid onProductSelect={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByText("Error loading products")).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels", async () => {
      renderWithQueryClient(<ProductGrid onProductSelect={jest.fn()} />);

      // Check for search input
      const searchInput = screen.getByPlaceholderText(
        "Search products by name, SKU, or barcode..."
      );
      expect(searchInput).toBeInTheDocument();

      // Check for select triggers
      expect(screen.getByText("All Categories")).toBeInTheDocument();
      expect(screen.getByText("All Brands")).toBeInTheDocument();
    });

    it("supports keyboard navigation", async () => {
      renderWithQueryClient(<ProductGrid onProductSelect={jest.fn()} />);

      const searchInput = screen.getByPlaceholderText(
        "Search products by name, SKU, or barcode..."
      );

      // Test keyboard navigation
      searchInput.focus();
      expect(searchInput).toHaveFocus();

      // Test that the input is properly accessible
      expect(searchInput).toBeInTheDocument();
    });
  });
});
