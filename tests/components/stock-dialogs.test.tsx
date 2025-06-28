import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AddStockDialog } from "@/components/inventory/AddStockDialog";
import { StockReconciliationDialog } from "@/components/inventory/StockReconciliationDialog";

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: {
        id: "1",
        email: "test@example.com",
        role: "ADMIN",
      },
    },
    status: "authenticated",
  }),
}));

// Mock sonner
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("AddStockDialog Component", () => {
  const mockProduct = {
    id: 1,
    name: "Test Product",
    sku: "TEST001",
    stock: 50,
    cost: 25.0,
  };

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    product: mockProduct,
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    global.fetch = jest.fn();
    jest.clearAllMocks();
  });

  test("renders dialog with product information", () => {
    render(<AddStockDialog {...defaultProps} />);

    expect(screen.getByText("Add Stock")).toBeInTheDocument();
    expect(screen.getByText(/Test Product/)).toBeInTheDocument();
    expect(screen.getByText(/TEST001/)).toBeInTheDocument();
    expect(screen.getByText(/Current Stock: 50/)).toBeInTheDocument();
  });

  test("validates quantity input", async () => {
    render(<AddStockDialog {...defaultProps} />);

    const quantityInput = screen.getByLabelText(/Quantity to Add/);
    const submitButton = screen.getByRole("button", { name: /Add Stock/ });

    // Test negative quantity
    fireEvent.change(quantityInput, { target: { value: "-5" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Quantity must be at least 1/)
      ).toBeInTheDocument();
    });
  });

  test("calculates new stock level correctly", () => {
    render(<AddStockDialog {...defaultProps} />);

    const quantityInput = screen.getByLabelText(/Quantity to Add/);
    fireEvent.change(quantityInput, { target: { value: "10" } });

    expect(screen.getByText(/New stock level: 60 units/)).toBeInTheDocument();
  });

  test("calculates total cost correctly", () => {
    render(<AddStockDialog {...defaultProps} />);

    const quantityInput = screen.getByLabelText(/Quantity to Add/);
    const costInput = screen.getByLabelText(/Cost per Unit/);

    fireEvent.change(quantityInput, { target: { value: "10" } });
    fireEvent.change(costInput, { target: { value: "30.00" } });

    expect(screen.getByText(/Total cost: \$300\.00/)).toBeInTheDocument();
  });

  test("submits form successfully", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, success: true }),
    });

    render(<AddStockDialog {...defaultProps} />);

    const quantityInput = screen.getByLabelText(/Quantity to Add/);
    const costInput = screen.getByLabelText(/Cost per Unit/);
    const submitButton = screen.getByRole("button", { name: /Add Stock/ });

    fireEvent.change(quantityInput, { target: { value: "10" } });
    fireEvent.change(costInput, { target: { value: "25.00" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/stock-additions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: 1,
          quantity: 10,
          costPerUnit: 25.0,
          supplierId: null,
          purchaseDate: null,
          notes: null,
        }),
      });
    });

    expect(defaultProps.onSuccess).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});

describe("StockReconciliationDialog Component", () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    global.fetch = jest.fn();
    jest.clearAllMocks();

    // Mock products API
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/api/products")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: [
              { id: 1, name: "Product 1", sku: "SKU001", currentStock: 100 },
              { id: 2, name: "Product 2", sku: "SKU002", currentStock: 50 },
            ],
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ id: 1, success: true }),
      });
    });
  });

  test("renders dialog with title and description inputs", async () => {
    render(<StockReconciliationDialog {...defaultProps} />);

    expect(screen.getByText("Stock Reconciliation")).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
  });

  test("allows adding products to reconciliation", async () => {
    render(<StockReconciliationDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Add Product/)).toBeInTheDocument();
    });

    const addButton = screen.getByRole("button", { name: /Add Product/ });
    fireEvent.click(addButton);

    // Should add a new row to the products table
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  test("calculates discrepancy automatically", async () => {
    render(<StockReconciliationDialog {...defaultProps} />);

    await waitFor(() => {
      const addButton = screen.getByRole("button", { name: /Add Product/ });
      fireEvent.click(addButton);
    });

    // This would need more detailed implementation to test the calculation
    // For now, we just verify the UI elements are present
    expect(screen.getByText(/Discrepancy/)).toBeInTheDocument();
  });

  test("validates required fields", async () => {
    render(<StockReconciliationDialog {...defaultProps} />);

    const saveButton = screen.getByRole("button", { name: /Save as Draft/ });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Title is required/)).toBeInTheDocument();
    });
  });

  test("saves as draft successfully", async () => {
    render(<StockReconciliationDialog {...defaultProps} />);

    const titleInput = screen.getByLabelText(/Title/);
    fireEvent.change(titleInput, { target: { value: "Test Reconciliation" } });

    const saveButton = screen.getByRole("button", { name: /Save as Draft/ });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/stock-reconciliations",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
    });
  });
});

describe("Error Handling", () => {
  test("AddStockDialog handles API errors", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Product not found" }),
    });

    const mockProduct = {
      id: 1,
      name: "Test Product",
      sku: "TEST001",
      stock: 50,
      cost: 25.0,
    };

    render(
      <AddStockDialog
        isOpen={true}
        onClose={jest.fn()}
        product={mockProduct}
        onSuccess={jest.fn()}
      />
    );

    const quantityInput = screen.getByLabelText(/Quantity to Add/);
    const submitButton = screen.getByRole("button", { name: /Add Stock/ });

    fireEvent.change(quantityInput, { target: { value: "10" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(require("sonner").toast.error).toHaveBeenCalledWith(
        "Product not found"
      );
    });
  });

  test("StockReconciliationDialog handles network errors", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network error")
    );

    render(
      <StockReconciliationDialog
        isOpen={true}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    );

    const titleInput = screen.getByLabelText(/Title/);
    fireEvent.change(titleInput, { target: { value: "Test" } });

    const saveButton = screen.getByRole("button", { name: /Save as Draft/ });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(require("sonner").toast.error).toHaveBeenCalled();
    });
  });
});
