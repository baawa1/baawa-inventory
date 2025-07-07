import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { POSInterface } from "@/components/pos/POSInterface";
import { useOffline } from "@/hooks/useOffline";
import { toast } from "sonner";

// Mock the offline hook
jest.mock("@/hooks/useOffline");
const mockUseOffline = useOffline as jest.MockedFunction<typeof useOffline>;

// Mock toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

// Mock child components
jest.mock("@/components/pos/ProductGrid", () => ({
  ProductGrid: ({
    onProductSelect,
  }: {
    onProductSelect: (product: any) => void;
  }) => (
    <div data-testid="product-grid">
      <button
        data-testid="test-product"
        onClick={() =>
          onProductSelect({
            id: 1,
            name: "Test Product",
            price: 1000,
            stock: 10,
            barcode: "123456789",
          })
        }
      >
        Test Product
      </button>
    </div>
  ),
}));

jest.mock("@/components/pos/ShoppingCart", () => ({
  ShoppingCart: ({ items, onUpdateQuantity, onRemoveItem }: any) => (
    <div data-testid="shopping-cart">
      {items.map((item: any) => (
        <div key={item.id} data-testid={`cart-item-${item.id}`}>
          <span>{item.name}</span>
          <span data-testid={`quantity-${item.id}`}>{item.quantity}</span>
          <button
            data-testid={`increase-${item.id}`}
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          >
            +
          </button>
          <button
            data-testid={`remove-${item.id}`}
            onClick={() => onRemoveItem(item.id)}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  ),
}));

jest.mock("@/components/pos/PaymentInterface", () => ({
  PaymentInterface: ({ total, onPaymentComplete }: any) => (
    <div data-testid="payment-interface">
      <span data-testid="payment-total">₦{total}</span>
      <button
        data-testid="cash-payment"
        onClick={() => onPaymentComplete({ method: "CASH", amount: total })}
      >
        Cash Payment
      </button>
    </div>
  ),
}));

jest.mock("@/components/pos/BarcodeScanner", () => ({
  BarcodeScanner: ({ onScan }: { onScan: (barcode: string) => void }) => (
    <div data-testid="barcode-scanner">
      <button data-testid="scan-barcode" onClick={() => onScan("123456789")}>
        Scan Barcode
      </button>
    </div>
  ),
}));

jest.mock("@/components/pos/OfflineStatusIndicator", () => ({
  OfflineStatusIndicator: () => (
    <div data-testid="offline-status">Offline Status</div>
  ),
}));

// Mock API calls
global.fetch = jest.fn();

const renderPOSInterface = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <POSInterface />
    </QueryClientProvider>
  );
};

describe("POSInterface", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOffline.mockReturnValue({
      isOnline: true,
      isSlowConnection: false,
      networkStatus: {
        isOnline: true,
        isSlowConnection: false,
        connectionType: "ethernet",
      },
      queueStats: { pendingTransactions: 0, failedTransactions: 0 },
      queueTransaction: jest.fn(),
      syncNow: jest.fn(),
      cacheProducts: jest.fn(),
      clearFailedTransactions: jest.fn(),
      isSyncing: false,
      isCaching: false,
      error: null,
    });
  });

  test("renders all main components", () => {
    renderPOSInterface();

    expect(screen.getByTestId("product-grid")).toBeInTheDocument();
    expect(screen.getByTestId("shopping-cart")).toBeInTheDocument();
    expect(screen.getByTestId("barcode-scanner")).toBeInTheDocument();
    expect(screen.getByTestId("offline-status")).toBeInTheDocument();
  });

  test("adds product to cart when selected", async () => {
    renderPOSInterface();

    fireEvent.click(screen.getByTestId("test-product"));

    await waitFor(() => {
      expect(screen.getByTestId("cart-item-1")).toBeInTheDocument();
      expect(screen.getByTestId("quantity-1")).toHaveTextContent("1");
    });
  });

  test("updates quantity when product is added again", async () => {
    renderPOSInterface();

    // Add product twice
    fireEvent.click(screen.getByTestId("test-product"));
    fireEvent.click(screen.getByTestId("test-product"));

    await waitFor(() => {
      expect(screen.getByTestId("quantity-1")).toHaveTextContent("2");
    });
  });

  test("increases quantity using cart controls", async () => {
    renderPOSInterface();

    // Add product first
    fireEvent.click(screen.getByTestId("test-product"));

    await waitFor(() => {
      expect(screen.getByTestId("quantity-1")).toHaveTextContent("1");
    });

    // Increase quantity
    fireEvent.click(screen.getByTestId("increase-1"));

    await waitFor(() => {
      expect(screen.getByTestId("quantity-1")).toHaveTextContent("2");
    });
  });

  test("removes item from cart", async () => {
    renderPOSInterface();

    // Add product first
    fireEvent.click(screen.getByTestId("test-product"));

    await waitFor(() => {
      expect(screen.getByTestId("cart-item-1")).toBeInTheDocument();
    });

    // Remove item
    fireEvent.click(screen.getByTestId("remove-1"));

    await waitFor(() => {
      expect(screen.queryByTestId("cart-item-1")).not.toBeInTheDocument();
    });
  });

  test("shows payment interface when cart has items", async () => {
    renderPOSInterface();

    // Add product to cart
    fireEvent.click(screen.getByTestId("test-product"));

    await waitFor(() => {
      expect(screen.getByTestId("payment-interface")).toBeInTheDocument();
      expect(screen.getByTestId("payment-total")).toHaveTextContent("₦1000");
    });
  });

  test("handles barcode scanning", async () => {
    // Mock successful barcode lookup
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 2,
        name: "Scanned Product",
        price: 2000,
        stock: 5,
        barcode: "123456789",
      }),
    });

    renderPOSInterface();

    fireEvent.click(screen.getByTestId("scan-barcode"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/pos/barcode-lookup?barcode=123456789"
      );
    });
  });

  test("handles offline mode", () => {
    mockUseOffline.mockReturnValue({
      isOnline: false,
      isSlowConnection: false,
      networkStatus: {
        isOnline: false,
        isSlowConnection: false,
      },
      queueStats: { pendingTransactions: 2, failedTransactions: 0 },
      queueTransaction: jest.fn(),
      syncNow: jest.fn(),
      cacheProducts: jest.fn(),
      clearFailedTransactions: jest.fn(),
      isSyncing: false,
      isCaching: false,
      error: null,
    });

    renderPOSInterface();

    expect(screen.getByTestId("offline-status")).toBeInTheDocument();
  });

  test("processes payment online", async () => {
    // Mock successful payment
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, success: true }),
    });

    renderPOSInterface();

    // Add product to cart
    fireEvent.click(screen.getByTestId("test-product"));

    await waitFor(() => {
      expect(screen.getByTestId("payment-interface")).toBeInTheDocument();
    });

    // Process payment
    fireEvent.click(screen.getByTestId("cash-payment"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/pos/create-sale",
        expect.any(Object)
      );
      expect(toast.success).toHaveBeenCalledWith(
        "Sale completed successfully!"
      );
    });
  });

  test("queues transaction when offline", async () => {
    const mockQueueTransaction = jest.fn();
    mockUseOffline.mockReturnValue({
      isOnline: false,
      isSlowConnection: false,
      networkStatus: {
        isOnline: false,
        isSlowConnection: false,
      },
      queueStats: { pendingTransactions: 0, failedTransactions: 0 },
      queueTransaction: mockQueueTransaction,
      syncNow: jest.fn(),
      cacheProducts: jest.fn(),
      clearFailedTransactions: jest.fn(),
      isSyncing: false,
      isCaching: false,
      error: null,
    });

    renderPOSInterface();

    // Add product to cart
    fireEvent.click(screen.getByTestId("test-product"));

    await waitFor(() => {
      expect(screen.getByTestId("payment-interface")).toBeInTheDocument();
    });

    // Process payment while offline
    fireEvent.click(screen.getByTestId("cash-payment"));

    await waitFor(() => {
      expect(mockQueueTransaction).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        "Sale queued for sync when online"
      );
    });
  });

  test("handles payment failure", async () => {
    // Mock failed payment
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
    });

    renderPOSInterface();

    // Add product to cart
    fireEvent.click(screen.getByTestId("test-product"));

    await waitFor(() => {
      expect(screen.getByTestId("payment-interface")).toBeInTheDocument();
    });

    // Process payment
    fireEvent.click(screen.getByTestId("cash-payment"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to process sale");
    });
  });

  test("clears cart after successful payment", async () => {
    // Mock successful payment
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, success: true }),
    });

    renderPOSInterface();

    // Add product to cart
    fireEvent.click(screen.getByTestId("test-product"));

    await waitFor(() => {
      expect(screen.getByTestId("cart-item-1")).toBeInTheDocument();
    });

    // Process payment
    fireEvent.click(screen.getByTestId("cash-payment"));

    await waitFor(() => {
      expect(screen.queryByTestId("cart-item-1")).not.toBeInTheDocument();
    });
  });
});
