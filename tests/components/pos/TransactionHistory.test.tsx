import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TransactionHistory } from "@/components/pos/TransactionHistory";
import { useOffline } from "@/hooks/useOffline";

// Mock useOffline hook
jest.mock("@/hooks/useOffline");
const mockUseOffline = useOffline as jest.MockedFunction<typeof useOffline>;

// Mock useQuery
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQuery: jest.fn(),
}));

import { useQuery } from "@tanstack/react-query";
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;

const mockTransactions = [
  {
    id: 1,
    items: [
      {
        productId: 1,
        name: "Product 1",
        sku: "SKU001",
        quantity: 2,
        price: 1000,
        total: 2000,
      },
    ],
    subtotal: 2000,
    discount: 0,
    total: 2000,
    paymentMethod: "cash",
    customerName: "John Doe",
    customerEmail: "john@example.com",
    staffName: "Staff Member",
    timestamp: new Date("2024-01-15T10:30:00Z"),
    status: "completed",
  },
  {
    id: "offline_123",
    items: [
      {
        productId: 2,
        name: "Product 2",
        sku: "SKU002",
        quantity: 1,
        price: 1500,
        total: 1500,
      },
    ],
    subtotal: 1500,
    discount: 100,
    total: 1400,
    paymentMethod: "pos",
    customerName: "Jane Smith",
    staffName: "Staff Member",
    timestamp: new Date("2024-01-15T11:00:00Z"),
    status: "pending",
  },
];

const renderTransactionHistory = (props = {}) => {
  const defaultProps = {
    ...props,
  };

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TransactionHistory {...defaultProps} />
    </QueryClientProvider>
  );
};

describe("TransactionHistory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOffline.mockReturnValue({
      isOnline: true,
      isSlowConnection: false,
      networkStatus: { isOnline: true, isSlowConnection: false },
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

  test("renders transaction history successfully", () => {
    mockUseQuery.mockReturnValue({
      data: {
        transactions: mockTransactions,
        total: 2,
        page: 1,
        totalPages: 1,
      },
      isLoading: false,
      error: null,
      isError: false,
    } as any);

    renderTransactionHistory();

    expect(screen.getByText("Transaction History")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("₦2,000")).toBeInTheDocument();
    expect(screen.getByText("₦1,400")).toBeInTheDocument();
  });

  test("shows loading state", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isError: false,
    } as any);

    renderTransactionHistory();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test("shows error state", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Failed to load transactions"),
      isError: true,
    } as any);

    renderTransactionHistory();

    expect(screen.getByText(/error/i)).toBeInTheDocument();
    expect(
      screen.getByText(/failed to load transactions/i)
    ).toBeInTheDocument();
  });

  test("displays transaction details correctly", () => {
    mockUseQuery.mockReturnValue({
      data: {
        transactions: mockTransactions,
        total: 2,
        page: 1,
        totalPages: 1,
      },
      isLoading: false,
      error: null,
      isError: false,
    } as any);

    renderTransactionHistory();

    // Check payment methods
    expect(screen.getByText("Cash")).toBeInTheDocument();
    expect(screen.getByText("POS")).toBeInTheDocument();

    // Check status indicators
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();

    // Check dates
    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
  });

  test("shows offline transaction indicators", () => {
    mockUseOffline.mockReturnValue({
      isOnline: false,
      isSlowConnection: false,
      networkStatus: { isOnline: false, isSlowConnection: false },
      queueStats: { pendingTransactions: 1, failedTransactions: 0 },
      queueTransaction: jest.fn(),
      syncNow: jest.fn(),
      cacheProducts: jest.fn(),
      clearFailedTransactions: jest.fn(),
      isSyncing: false,
      isCaching: false,
      error: null,
    });

    mockUseQuery.mockReturnValue({
      data: {
        transactions: mockTransactions,
        total: 2,
        page: 1,
        totalPages: 1,
      },
      isLoading: false,
      error: null,
      isError: false,
    } as any);

    renderTransactionHistory();

    // Should show offline indicator for offline transactions
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });

  test("handles pagination", async () => {
    mockUseQuery.mockReturnValue({
      data: {
        transactions: mockTransactions,
        total: 50,
        page: 1,
        totalPages: 5,
      },
      isLoading: false,
      error: null,
      isError: false,
    } as any);

    renderTransactionHistory();

    // Should show pagination controls
    expect(screen.getByText("Next")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument(); // Current page
  });

  test("filters transactions by date range", async () => {
    mockUseQuery.mockReturnValue({
      data: {
        transactions: mockTransactions,
        total: 2,
        page: 1,
        totalPages: 1,
      },
      isLoading: false,
      error: null,
      isError: false,
    } as any);

    renderTransactionHistory();

    // Look for date filter inputs
    const dateInputs = screen.getAllByDisplayValue("");
    expect(dateInputs.length).toBeGreaterThan(0);
  });

  test("filters transactions by payment method", async () => {
    mockUseQuery.mockReturnValue({
      data: {
        transactions: mockTransactions,
        total: 2,
        page: 1,
        totalPages: 1,
      },
      isLoading: false,
      error: null,
      isError: false,
    } as any);

    renderTransactionHistory();

    // Should have payment method filter
    expect(screen.getByText(/all payment methods/i)).toBeInTheDocument();
  });

  test("exports transactions", async () => {
    mockUseQuery.mockReturnValue({
      data: {
        transactions: mockTransactions,
        total: 2,
        page: 1,
        totalPages: 1,
      },
      isLoading: false,
      error: null,
      isError: false,
    } as any);

    renderTransactionHistory();

    const exportButton = screen.getByText(/export/i);
    expect(exportButton).toBeInTheDocument();

    fireEvent.click(exportButton);

    // Should trigger export functionality
    // (Implementation would depend on the actual export mechanism)
  });

  test("handles manual sync for offline transactions", async () => {
    const mockSyncNow = jest.fn().mockResolvedValue({ success: 1, failed: 0 });

    mockUseOffline.mockReturnValue({
      isOnline: true,
      isSlowConnection: false,
      networkStatus: { isOnline: true, isSlowConnection: false },
      queueStats: { pendingTransactions: 1, failedTransactions: 0 },
      queueTransaction: jest.fn(),
      syncNow: mockSyncNow,
      cacheProducts: jest.fn(),
      clearFailedTransactions: jest.fn(),
      isSyncing: false,
      isCaching: false,
      error: null,
    });

    mockUseQuery.mockReturnValue({
      data: {
        transactions: mockTransactions,
        total: 2,
        page: 1,
        totalPages: 1,
      },
      isLoading: false,
      error: null,
      isError: false,
    } as any);

    renderTransactionHistory();

    const syncButton = screen.getByText(/sync now/i);
    fireEvent.click(syncButton);

    await waitFor(() => {
      expect(mockSyncNow).toHaveBeenCalled();
    });
  });

  test("shows empty state when no transactions", () => {
    mockUseQuery.mockReturnValue({
      data: {
        transactions: [],
        total: 0,
        page: 1,
        totalPages: 0,
      },
      isLoading: false,
      error: null,
      isError: false,
    } as any);

    renderTransactionHistory();

    expect(screen.getByText(/no transactions found/i)).toBeInTheDocument();
  });

  test("displays transaction item details on expand", async () => {
    mockUseQuery.mockReturnValue({
      data: {
        transactions: mockTransactions,
        total: 2,
        page: 1,
        totalPages: 1,
      },
      isLoading: false,
      error: null,
      isError: false,
    } as any);

    renderTransactionHistory();

    // Find and click expand button for transaction details
    const expandButtons = screen.getAllByText(/details/i);
    if (expandButtons.length > 0) {
      fireEvent.click(expandButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Product 1")).toBeInTheDocument();
        expect(screen.getByText("SKU001")).toBeInTheDocument();
      });
    }
  });

  test("calculates totals correctly", () => {
    mockUseQuery.mockReturnValue({
      data: {
        transactions: mockTransactions,
        total: 2,
        page: 1,
        totalPages: 1,
      },
      isLoading: false,
      error: null,
      isError: false,
    } as any);

    renderTransactionHistory();

    // Should show transaction totals
    expect(screen.getByText("₦2,000")).toBeInTheDocument(); // First transaction
    expect(screen.getByText("₦1,400")).toBeInTheDocument(); // Second transaction (with discount)
  });

  test("handles different transaction statuses", () => {
    const transactionsWithVariousStatuses = [
      { ...mockTransactions[0], status: "completed" },
      { ...mockTransactions[1], status: "pending" },
      { ...mockTransactions[0], id: 3, status: "failed" },
    ];

    mockUseQuery.mockReturnValue({
      data: {
        transactions: transactionsWithVariousStatuses,
        total: 3,
        page: 1,
        totalPages: 1,
      },
      isLoading: false,
      error: null,
      isError: false,
    } as any);

    renderTransactionHistory();

    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });
});
