import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ArchivedProductList } from "@/components/inventory/ArchivedProductList";

// Mock fetch
global.fetch = jest.fn();

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  })),
}));

// Mock sonner toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const mockArchivedProducts = {
  products: [
    {
      id: 1,
      name: "Archived Product 1",
      sku: "AP001",
      category: "Electronics",
      brand: "Samsung",
      supplier: "Tech Supplier",
      stock: 5,
      minStock: 10,
      maxStock: 100,
      price: 99.99,
      cost: 50.0,
      isArchived: true,
      archivedAt: "2023-01-01T00:00:00Z",
    },
    {
      id: 2,
      name: "Archived Product 2",
      sku: "AP002",
      category: "Accessories",
      brand: "Apple",
      supplier: "Another Supplier",
      stock: 0,
      minStock: 5,
      maxStock: 50,
      price: 49.99,
      cost: 25.0,
      isArchived: true,
      archivedAt: "2023-01-02T00:00:00Z",
    },
  ],
  pagination: {
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 2,
  },
};

describe("ArchivedProductList Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it("renders the archived products list", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockArchivedProducts,
    });

    render(<ArchivedProductList />, { wrapper: createWrapper() });

    expect(screen.getByText("Archived Products")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Archived Product 1")).toBeInTheDocument();
      expect(screen.getByText("Archived Product 2")).toBeInTheDocument();
      expect(screen.getByText("AP001")).toBeInTheDocument();
      expect(screen.getByText("AP002")).toBeInTheDocument();
    });
  });

  it("displays empty state when no archived products exist", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        products: [],
        pagination: {
          page: 1,
          limit: 10,
          totalPages: 0,
          totalItems: 0,
        },
      }),
    });

    render(<ArchivedProductList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(
        screen.getByText("No archived products found")
      ).toBeInTheDocument();
    });
  });

  it("handles search functionality", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockArchivedProducts,
    });

    render(<ArchivedProductList />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText(
      "Search archived products..."
    );
    fireEvent.change(searchInput, { target: { value: "Samsung" } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("search=Samsung")
      );
    });
  });

  it("allows unarchiving products", async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockArchivedProducts,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Product unarchived successfully" }),
      });

    const { toast } = require("sonner");

    render(<ArchivedProductList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Archived Product 1")).toBeInTheDocument();
    });

    // Find and click the unarchive button
    const unarchiveButtons = screen.getAllByText("Unarchive");
    fireEvent.click(unarchiveButtons[0]);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/products/1/archive",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ archive: false }),
        })
      );
      expect(toast.success).toHaveBeenCalledWith(
        "Product unarchived successfully"
      );
    });
  });

  it("displays product information correctly", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockArchivedProducts,
    });

    render(<ArchivedProductList />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Check product names
      expect(screen.getByText("Archived Product 1")).toBeInTheDocument();
      expect(screen.getByText("Archived Product 2")).toBeInTheDocument();

      // Check SKUs
      expect(screen.getByText("AP001")).toBeInTheDocument();
      expect(screen.getByText("AP002")).toBeInTheDocument();

      // Check categories
      expect(screen.getByText("Electronics")).toBeInTheDocument();
      expect(screen.getByText("Accessories")).toBeInTheDocument();

      // Check brands
      expect(screen.getByText("Samsung")).toBeInTheDocument();
      expect(screen.getByText("Apple")).toBeInTheDocument();

      // Check stock levels
      expect(screen.getByText("5")).toBeInTheDocument(); // stock for first product
      expect(screen.getByText("0")).toBeInTheDocument(); // stock for second product

      // Check prices
      expect(screen.getByText("₦99.99")).toBeInTheDocument();
      expect(screen.getByText("₦49.99")).toBeInTheDocument();
    });
  });

  it("handles pagination", async () => {
    const multiPageData = {
      products: mockArchivedProducts.products,
      pagination: {
        page: 1,
        limit: 10,
        totalPages: 3,
        totalItems: 25,
      },
    };

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => multiPageData,
    });

    render(<ArchivedProductList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument(); // Current page
      expect(screen.getByText("3")).toBeInTheDocument(); // Total pages
    });

    // Test next page navigation
    const nextButton = screen.getByText("Next");
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining("page=2"));
    });
  });

  it("handles API errors gracefully", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    render(<ArchivedProductList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load archived products")
      ).toBeInTheDocument();
    });
  });

  it("shows loading state while fetching data", () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<ArchivedProductList />, { wrapper: createWrapper() });

    expect(
      screen.getByText("Loading archived products...")
    ).toBeInTheDocument();
  });

  it("handles unarchive errors", async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockArchivedProducts,
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

    const { toast } = require("sonner");

    render(<ArchivedProductList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Archived Product 1")).toBeInTheDocument();
    });

    const unarchiveButtons = screen.getAllByText("Unarchive");
    fireEvent.click(unarchiveButtons[0]);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to unarchive product");
    });
  });

  it("filters by category correctly", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockArchivedProducts,
    });

    render(<ArchivedProductList />, { wrapper: createWrapper() });

    // Assuming there's a category filter dropdown
    const categoryFilter = screen.getByRole("combobox", { name: /category/i });
    fireEvent.click(categoryFilter);

    const electronicsOption = screen.getByText("Electronics");
    fireEvent.click(electronicsOption);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("category=Electronics")
      );
    });
  });

  it("sorts products correctly", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockArchivedProducts,
    });

    render(<ArchivedProductList />, { wrapper: createWrapper() });

    // Assuming there's a sort dropdown
    const sortSelect = screen.getByRole("combobox", { name: /sort/i });
    fireEvent.click(sortSelect);

    const nameAscOption = screen.getByText("Name (A-Z)");
    fireEvent.click(nameAscOption);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("sort=name&order=asc")
      );
    });
  });

  it("shows stock status badges correctly", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockArchivedProducts,
    });

    render(<ArchivedProductList />, { wrapper: createWrapper() });

    await waitFor(() => {
      // First product should show low stock badge (5 <= 10)
      expect(screen.getByText("Low Stock")).toBeInTheDocument();
      // Second product should show out of stock badge (0 stock)
      expect(screen.getByText("Out of Stock")).toBeInTheDocument();
    });
  });

  it("calculates and displays stock values correctly", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockArchivedProducts,
    });

    render(<ArchivedProductList />, { wrapper: createWrapper() });

    await waitFor(() => {
      // First product: 5 * 50 = 250
      expect(screen.getByText("₦250.00")).toBeInTheDocument();
      // Second product: 0 * 25 = 0
      expect(screen.getByText("₦0.00")).toBeInTheDocument();
    });
  });
});
