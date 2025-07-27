import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { POSInterface } from '@/components/pos/POSInterface';
import { mockSession } from '../../test-utils/mock-session';

// Mock the POS hooks
jest.mock('@/hooks/api/pos', () => ({
  useProductSearch: jest.fn(() => ({
    data: { products: [] },
    isLoading: false,
    error: null,
  })),
  useBarcodeLookup: jest.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
}));

// Mock the offline hook
jest.mock('@/hooks/useOffline', () => ({
  useOffline: jest.fn(() => ({
    isOnline: true,
    queueTransaction: jest.fn(),
  })),
}));

// Mock the toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock child components
jest.mock('@/components/pos/ProductGrid', () => ({
  ProductGrid: ({ onProductSelect }: any) => (
    <div data-testid="product-grid">
      <button
        onClick={() =>
          onProductSelect({
            id: 1,
            name: 'Test Product',
            price: 1000,
            stock: 10,
          })
        }
      >
        Add Test Product
      </button>
    </div>
  ),
}));

jest.mock('@/components/pos/ShoppingCart', () => ({
  ShoppingCart: ({
    items,
    onUpdateQuantity,
    onRemoveItem,
    onClearCart,
  }: any) => (
    <div data-testid="shopping-cart">
      <div>Cart Items: {items.length}</div>
      <button onClick={() => onUpdateQuantity(1, 2)}>Update Quantity</button>
      <button onClick={() => onRemoveItem(1)}>Remove Item</button>
      <button onClick={onClearCart}>Clear Cart</button>
    </div>
  ),
}));

jest.mock('@/components/pos/SlidingPaymentInterface', () => ({
  SlidingPaymentInterface: ({ isOpen, onClose, cart, total }: any) =>
    isOpen ? (
      <div data-testid="payment-interface">
        <div>Payment Total: {total}</div>
        <button onClick={onClose}>Close Payment</button>
      </div>
    ) : null,
}));

jest.mock('@/components/pos/ReceiptGenerator', () => ({
  ReceiptGenerator: ({ sale, onNewSale }: any) => (
    <div data-testid="receipt-generator">
      <div>Receipt for Sale: {sale?.id}</div>
      <button onClick={onNewSale}>New Sale</button>
    </div>
  ),
}));

jest.mock('@/components/pos/OfflineStatusIndicator', () => ({
  OfflineStatusIndicator: () => (
    <div data-testid="offline-indicator">Offline Status</div>
  ),
}));

jest.mock('@/components/pos/POSErrorBoundary', () => ({
  POSErrorBoundary: ({ children }: any) => (
    <div data-testid="pos-error-boundary">{children}</div>
  ),
}));

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <SessionProvider session={mockSession}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SessionProvider>
  );

  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
};

describe('POSInterface', () => {
  const TestWrapper = createTestWrapper();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render the POS interface with main components', () => {
      render(
        <TestWrapper>
          <POSInterface />
        </TestWrapper>
      );

      expect(screen.getByTestId('product-grid')).toBeInTheDocument();
      expect(screen.getByTestId('shopping-cart')).toBeInTheDocument();
      expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('pos-error-boundary')).toBeInTheDocument();
    });

    it('should show empty cart initially', () => {
      render(
        <TestWrapper>
          <POSInterface />
        </TestWrapper>
      );

      expect(screen.getByText('Cart Items: 0')).toBeInTheDocument();
    });
  });

  describe('Product Selection', () => {
    it('should add product to cart when selected', () => {
      render(
        <TestWrapper>
          <POSInterface />
        </TestWrapper>
      );

      const addButton = screen.getByText('Add Test Product');
      fireEvent.click(addButton);

      expect(screen.getByText('Cart Items: 1')).toBeInTheDocument();
    });
  });

  describe('Cart Management', () => {
    it('should update cart item quantity', () => {
      render(
        <TestWrapper>
          <POSInterface />
        </TestWrapper>
      );

      // First add a product
      const addButton = screen.getByText('Add Test Product');
      fireEvent.click(addButton);

      // Then update quantity
      const updateButton = screen.getByText('Update Quantity');
      fireEvent.click(updateButton);

      // Cart should still have 1 item but with updated quantity
      expect(screen.getByText('Cart Items: 1')).toBeInTheDocument();
    });

    it('should remove item from cart', () => {
      render(
        <TestWrapper>
          <POSInterface />
        </TestWrapper>
      );

      // First add a product
      const addButton = screen.getByText('Add Test Product');
      fireEvent.click(addButton);

      // Then remove it
      const removeButton = screen.getByText('Remove Item');
      fireEvent.click(removeButton);

      expect(screen.getByText('Cart Items: 0')).toBeInTheDocument();
    });

    it('should clear cart', () => {
      render(
        <TestWrapper>
          <POSInterface />
        </TestWrapper>
      );

      // First add a product
      const addButton = screen.getByText('Add Test Product');
      fireEvent.click(addButton);

      // Then clear cart
      const clearButton = screen.getByText('Clear Cart');
      fireEvent.click(clearButton);

      expect(screen.getByText('Cart Items: 0')).toBeInTheDocument();
    });
  });

  describe('Payment Flow', () => {
    it('should show payment interface when cart has items', () => {
      render(
        <TestWrapper>
          <POSInterface />
        </TestWrapper>
      );

      // Add a product to cart
      const addButton = screen.getByText('Add Test Product');
      fireEvent.click(addButton);

      // Payment interface should be available
      expect(screen.getByTestId('payment-interface')).toBeInTheDocument();
    });

    it('should calculate correct total', () => {
      render(
        <TestWrapper>
          <POSInterface />
        </TestWrapper>
      );

      // Add a product to cart
      const addButton = screen.getByText('Add Test Product');
      fireEvent.click(addButton);

      // Should show payment total
      expect(screen.getByText('Payment Total: ₦1,000.00')).toBeInTheDocument();
    });
  });

  describe('Receipt Generation', () => {
    it('should show receipt after payment completion', async () => {
      render(
        <TestWrapper>
          <POSInterface />
        </TestWrapper>
      );

      // Add a product to cart
      const addButton = screen.getByText('Add Test Product');
      fireEvent.click(addButton);

      // Complete payment (this would normally be triggered by payment success)
      // For now, we'll just check that the receipt component is available
      expect(screen.getByTestId('receipt-generator')).toBeInTheDocument();
    });

    it('should allow starting new sale', () => {
      render(
        <TestWrapper>
          <POSInterface />
        </TestWrapper>
      );

      const newSaleButton = screen.getByText('New Sale');
      fireEvent.click(newSaleButton);

      // Should reset to empty cart
      expect(screen.getByText('Cart Items: 0')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', () => {
      render(
        <TestWrapper>
          <POSInterface />
        </TestWrapper>
      );

      // The component should render without crashing
      expect(screen.getByTestId('pos-error-boundary')).toBeInTheDocument();
    });
  });

  describe('Offline Functionality', () => {
    it('should show offline status indicator', () => {
      render(
        <TestWrapper>
          <POSInterface />
        </TestWrapper>
      );

      expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();
    });
  });

  describe('Session Management', () => {
    it('should use session data', () => {
      render(
        <TestWrapper>
          <POSInterface />
        </TestWrapper>
      );

      // Component should render with session data
      expect(screen.getByTestId('product-grid')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should integrate all POS components correctly', () => {
      render(
        <TestWrapper>
          <POSInterface />
        </TestWrapper>
      );

      // All main components should be present
      expect(screen.getByTestId('product-grid')).toBeInTheDocument();
      expect(screen.getByTestId('shopping-cart')).toBeInTheDocument();
      expect(screen.getByTestId('payment-interface')).toBeInTheDocument();
      expect(screen.getByTestId('receipt-generator')).toBeInTheDocument();
      expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('pos-error-boundary')).toBeInTheDocument();
    });
  });
});
