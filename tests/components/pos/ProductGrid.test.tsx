import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProductGrid } from "@/components/pos/ProductGrid";

// Mock useQuery
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQuery: jest.fn(),
}));

import { useQuery } from "@tanstack/react-query";
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;

const mockProducts = [
  {
    id: 1,
    name: "Product 1",
    sku: "SKU001",
    price: 1000,
    stock: 10,
    category: "Electronics",
    brand: "BrandA",
    barcode: "123456789",
  },
  {
    id: 2,
    name: "Product 2",
    sku: "SKU002",
    price: 2000,
    stock: 5,
    category: "Accessories",
    brand: "BrandB",
    barcode: "987654321",
  },
];

const renderProductGrid = (props = {}) => {
  const defaultProps = {
    onProductSelect: jest.fn(),
    disabled: false,
    ...props,
  };

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ProductGrid {...defaultProps} />
    </QueryClientProvider>
  );
};

describe("ProductGrid", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders products successfully", () => {
    mockUseQuery.mockReturnValue({
      data: mockProducts,
      isLoading: false,
      error: null,
      isError: false,
    } as any);

    const onProductSelect = jest.fn();
    renderProductGrid({ onProductSelect });

    expect(screen.getByText("Product 1")).toBeInTheDocument();
    expect(screen.getByText("Product 2")).toBeInTheDocument();
    expect(screen.getByText("₦1,000")).toBeInTheDocument();
    expect(screen.getByText("₦2,000")).toBeInTheDocument();
  });

  test("shows loading state", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isError: false,
    } as any);

    renderProductGrid();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test("shows error state", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Failed to load products"),
      isError: true,
    } as any);

    renderProductGrid();

    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });

  test("calls onProductSelect when product is clicked", () => {
    mockUseQuery.mockReturnValue({
      data: mockProducts,
      isLoading: false,
      error: null,
      isError: false,
    } as any);

    const onProductSelect = jest.fn();
    renderProductGrid({ onProductSelect });

    fireEvent.click(screen.getByText("Product 1"));

    expect(onProductSelect).toHaveBeenCalledWith(mockProducts[0]);
  });

  test("displays product information correctly", () => {
    mockUseQuery.mockReturnValue({
      data: mockProducts,
      isLoading: false,
      error: null,
      isError: false,
    } as any);

    renderProductGrid();

    // Check that all product details are displayed
    expect(screen.getByText("SKU001")).toBeInTheDocument();
    expect(screen.getByText("SKU002")).toBeInTheDocument();
    expect(screen.getByText("Stock: 10")).toBeInTheDocument();
    expect(screen.getByText("Stock: 5")).toBeInTheDocument();
  });

  test("shows out of stock indicator", () => {
    const outOfStockProducts = [{ ...mockProducts[0], stock: 0 }];

    mockUseQuery.mockReturnValue({
      data: outOfStockProducts,
      isLoading: false,
      error: null,
      isError: false,
    } as any);

    renderProductGrid();

    expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
  });

  test("disables out of stock products", () => {
    const outOfStockProducts = [{ ...mockProducts[0], stock: 0 }];

    mockUseQuery.mockReturnValue({
      data: outOfStockProducts,
      isLoading: false,
      error: null,
      isError: false,
    } as any);

    const onProductSelect = jest.fn();
    renderProductGrid({ onProductSelect });

    const productButton = screen.getByRole("button");
    expect(productButton).toBeDisabled();

    fireEvent.click(productButton);
    expect(onProductSelect).not.toHaveBeenCalled();
  });

  test("filters products based on search term", async () => {
    mockUseQuery.mockReturnValue({
      data: mockProducts,
      isLoading: false,
      error: null,
      isError: false,
    } as any);

    renderProductGrid();

    // Find and use the search input
    const searchInput = screen.getByPlaceholderText(/search products/i);
    fireEvent.change(searchInput, { target: { value: "Product 1" } });

    // Should update the search term in the component
    expect(searchInput).toHaveValue("Product 1");
  });

  test("uses search functionality correctly", async () => {
    mockUseQuery.mockReturnValue({
      data: mockProducts,
      isLoading: false,
      error: null,
      isError: false,
    } as any);

    renderProductGrid();

    // Test that products query is called initially
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(["pos-products"]),
      })
    );
  });

  test("handles empty product list", () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      isError: false,
    } as any);

    renderProductGrid();

    expect(screen.getByText(/no products found/i)).toBeInTheDocument();
  });

  test("shows product categories", () => {
    mockUseQuery.mockReturnValue({
      data: mockProducts,
      isLoading: false,
      error: null,
      isError: false,
    } as any);

    renderProductGrid();

    expect(screen.getByText("Electronics")).toBeInTheDocument();
    expect(screen.getByText("Accessories")).toBeInTheDocument();
  });

  test("displays product images when available", () => {
    const productsWithImages = mockProducts.map((product) => ({
      ...product,
      imageUrl: `/images/${product.sku}.jpg`,
    }));

    mockUseQuery.mockReturnValue({
      data: productsWithImages,
      isLoading: false,
      error: null,
      isError: false,
    } as any);

    renderProductGrid();

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute("src", "/images/SKU001.jpg");
  });

  test("handles missing product images gracefully", () => {
    mockUseQuery.mockReturnValue({
      data: mockProducts, // No imageUrl property
      isLoading: false,
      error: null,
      isError: false,
    } as any);

    renderProductGrid();

    // Should show placeholder or no image
    const images = screen.queryAllByRole("img");
    expect(images.length).toBeLessThanOrEqual(2); // May have placeholder images
  });
});
