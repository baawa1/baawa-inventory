import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { POSInterface } from '@/components/pos/POSInterface';

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: '1',
        name: 'Test Staff',
      },
    },
  }),
  SessionProvider: ({ children }: any) => children,
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/components/pos/ProductGrid', () => ({
  ProductGrid: ({ onProductSelect }: any) => (
    <div data-testid="product-grid">
      <button
        onClick={() =>
          onProductSelect({
            id: 1,
            name: 'Test Product',
            sku: 'TEST-001',
            barcode: '1234567890',
            price: 1000,
            basePrice: 1000,
            stock: 10,
            category: 'Accessories',
            brand: 'Test Brand',
          })
        }
      >
        Add Test Product
      </button>
    </div>
  ),
}));

jest.mock('@/components/pos/ShoppingCart', () => ({
  ShoppingCart: ({ items }: any) => (
    <div data-testid="shopping-cart">
      <div>Cart Items: {items.length}</div>
      {items.map((item: any) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  ),
}));

jest.mock('@/components/pos/SlidingPaymentInterface', () => ({
  SlidingPaymentInterface: ({ items, onPaymentSuccess, onCancel }: any) => (
    <div data-testid="payment-interface">
      <div>Payment Items: {items.length}</div>
      <button
        onClick={() =>
          onPaymentSuccess({
            id: '101',
            items,
            subtotal: 1000,
            discount: 0,
            total: 1000,
            paymentMethod: 'cash',
            customerPhone: '+2347000000000',
            staffName: 'Test Staff',
            timestamp: new Date('2026-04-26T09:00:00.000Z'),
          })
        }
      >
        Complete Sale
      </button>
      <button onClick={onCancel}>Close Receipt</button>
    </div>
  ),
}));

jest.mock('@/components/pos/OfflineStatusIndicator', () => ({
  OfflineStatusIndicator: () => <div data-testid="offline-indicator" />,
}));

jest.mock('@/components/pos/POSErrorBoundary', () => ({
  POSErrorBoundary: ({ children }: any) => children,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('POSInterface', () => {
  const Wrapper = createWrapper();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('clears the cart immediately when checkout succeeds', () => {
    render(
      <Wrapper>
        <POSInterface />
      </Wrapper>
    );

    fireEvent.click(screen.getByText('Add Test Product'));
    fireEvent.click(
      screen.getByRole('button', { name: /proceed to\s*payment/i })
    );
    fireEvent.click(screen.getByText('Complete Sale'));

    expect(screen.getByText('Payment Items: 0')).toBeInTheDocument();
  });

  it('returns to a fresh sale after closing the receipt flow', () => {
    render(
      <Wrapper>
        <POSInterface />
      </Wrapper>
    );

    fireEvent.click(screen.getByText('Add Test Product'));
    fireEvent.click(
      screen.getByRole('button', { name: /proceed to\s*payment/i })
    );
    fireEvent.click(screen.getByText('Complete Sale'));
    fireEvent.click(screen.getByText('Close Receipt'));

    expect(screen.queryByTestId('payment-interface')).not.toBeInTheDocument();
    expect(screen.getByText('Cart Items: 0')).toBeInTheDocument();
    expect(screen.queryByText('Test Product')).not.toBeInTheDocument();
  });
});
