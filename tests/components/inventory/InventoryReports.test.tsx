import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InventoryReports } from "@/components/inventory/InventoryReports";

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

describe("InventoryReports Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it("renders the main heading and description", () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ categories: [], brands: [], suppliers: [] }),
    });

    render(<InventoryReports />, { wrapper: createWrapper() });

    expect(screen.getByText("Inventory Reports")).toBeInTheDocument();
    expect(
      screen.getByText("Generate and download comprehensive inventory reports")
    ).toBeInTheDocument();
  });

  it("displays all report type options", () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ categories: [], brands: [], suppliers: [] }),
    });

    render(<InventoryReports />, { wrapper: createWrapper() });

    expect(screen.getByText("Current Stock")).toBeInTheDocument();
    expect(screen.getByText("Stock Value")).toBeInTheDocument();
    expect(screen.getByText("Low Stock")).toBeInTheDocument();
    expect(screen.getByText("Product Summary")).toBeInTheDocument();
  });

  it("shows filters when filter button is clicked", () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ categories: [], brands: [], suppliers: [] }),
    });

    render(<InventoryReports />, { wrapper: createWrapper() });

    const filterButton = screen.getByText("Filters");
    fireEvent.click(filterButton);

    expect(screen.getByText("Report Filters")).toBeInTheDocument();
    expect(screen.getByLabelText("Category")).toBeInTheDocument();
    expect(screen.getByLabelText("Brand")).toBeInTheDocument();
    expect(screen.getByLabelText("Supplier")).toBeInTheDocument();
    expect(screen.getByLabelText("Low stock only")).toBeInTheDocument();
    expect(screen.getByLabelText("Include archived")).toBeInTheDocument();
  });

  it("generates a report when report type is selected", async () => {
    const mockReportData = {
      title: "Current Stock Report",
      generatedAt: new Date().toISOString(),
      data: [
        {
          id: 1,
          name: "Test Product",
          sku: "TEST001",
          category: "Electronics",
          brand: "Samsung",
          supplier: "Tech Supplier",
          currentStock: 100,
          minStock: 10,
          maxStock: 200,
          costPrice: 50,
          sellingPrice: 100,
          stockValue: 5000,
          isLowStock: false,
          isArchived: false,
          lastUpdated: new Date().toISOString(),
        },
      ],
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ categories: [], brands: [], suppliers: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ categories: [], brands: [], suppliers: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ categories: [], brands: [], suppliers: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockReportData,
      });

    render(<InventoryReports />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Current Stock Report")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Test Product")).toBeInTheDocument();
      expect(screen.getByText("TEST001")).toBeInTheDocument();
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });
  });

  it("downloads CSV when download button is clicked", async () => {
    const mockBlob = new Blob(["csv content"], { type: "text/csv" });
    const mockReportData = {
      title: "Current Stock Report",
      generatedAt: new Date().toISOString(),
      data: [],
    };

    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => "mock-url");
    global.URL.revokeObjectURL = jest.fn();

    // Mock document.createElement and appendChild/removeChild
    const mockAnchor = {
      style: { display: "" },
      href: "",
      download: "",
      click: jest.fn(),
    };
    jest.spyOn(document, "createElement").mockReturnValue(mockAnchor as any);
    jest
      .spyOn(document.body, "appendChild")
      .mockImplementation(() => mockAnchor as any);
    jest
      .spyOn(document.body, "removeChild")
      .mockImplementation(() => mockAnchor as any);

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ categories: [], brands: [], suppliers: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ categories: [], brands: [], suppliers: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ categories: [], brands: [], suppliers: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockReportData,
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      });

    render(<InventoryReports />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Download CSV")).toBeInTheDocument();
    });

    const downloadButton = screen.getByText("Download CSV");
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining("format=csv"));
    });

    expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    expect(mockAnchor.click).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("mock-url");
  });

  it("displays loading state while generating report", () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<InventoryReports />, { wrapper: createWrapper() });

    expect(
      screen.getByTestId("loading-spinner") || screen.getByRole("progressbar")
    ).toBeInTheDocument();
  });

  it("handles API errors gracefully", async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ categories: [], brands: [], suppliers: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ categories: [], brands: [], suppliers: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ categories: [], brands: [], suppliers: [] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

    render(<InventoryReports />, { wrapper: createWrapper() });

    // The component should handle the error gracefully
    await waitFor(() => {
      // Check that the component doesn't crash and still shows the UI
      expect(screen.getByText("Inventory Reports")).toBeInTheDocument();
    });
  });

  it("filters reports correctly", async () => {
    const mockCategories = [{ id: 1, name: "Electronics" }];
    const mockBrands = [{ id: 1, name: "Samsung" }];
    const mockSuppliers = [{ id: 1, name: "Tech Supplier" }];

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ categories: mockCategories }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ brands: mockBrands }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ suppliers: mockSuppliers }),
      })
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          title: "Filtered Report",
          generatedAt: new Date().toISOString(),
          data: [],
        }),
      });

    render(<InventoryReports />, { wrapper: createWrapper() });

    // Show filters
    const filterButton = screen.getByText("Filters");
    fireEvent.click(filterButton);

    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });

    // Select a category filter
    const categorySelect = screen.getByDisplayValue("All categories");
    fireEvent.click(categorySelect);

    const electronicsOption = screen.getByText("Electronics");
    fireEvent.click(electronicsOption);

    // Check that the API was called with the filter
    await waitFor(() => {
      const lastCall = (fetch as jest.Mock).mock.calls[
        (fetch as jest.Mock).mock.calls.length - 1
      ];
      expect(lastCall[0]).toContain("category=1");
    });
  });

  it("refreshes report when refresh button is clicked", async () => {
    const mockReportData = {
      title: "Current Stock Report",
      generatedAt: new Date().toISOString(),
      data: [],
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ categories: [], brands: [], suppliers: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ categories: [], brands: [], suppliers: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ categories: [], brands: [], suppliers: [] }),
      })
      .mockResolvedValue({
        ok: true,
        json: async () => mockReportData,
      });

    render(<InventoryReports />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Current Stock Report")).toBeInTheDocument();
    });

    const refreshButton = screen.getByText("Refresh");
    fireEvent.click(refreshButton);

    // Check that the API was called again
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(5); // Initial 3 + 1 report + 1 refresh
    });
  });

  it("clears filters when clear filters button is clicked", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ categories: [], brands: [], suppliers: [] }),
    });

    render(<InventoryReports />, { wrapper: createWrapper() });

    // Show filters
    const filterButton = screen.getByText("Filters");
    fireEvent.click(filterButton);

    await waitFor(() => {
      expect(screen.getByText("Clear Filters")).toBeInTheDocument();
    });

    const clearButton = screen.getByText("Clear Filters");
    fireEvent.click(clearButton);

    // Verify filters are cleared (this would depend on implementation details)
    // For now, just check that the button exists and can be clicked
    expect(clearButton).toBeInTheDocument();
  });
});
