import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useCoupons,
  useCreateCoupon,
  useValidateCoupon,
} from '@/hooks/api/useCoupons';

// Mock fetch
global.fetch = jest.fn();

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
};

describe('useCoupons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches coupons successfully', async () => {
    const mockCoupons = [
      {
        id: 1,
        code: 'SAVE10',
        name: '10% Off',
        description: 'Get 10% off',
        type: 'PERCENTAGE' as const,
        value: 10,
        minimumAmount: 5000,
        maxUses: 100,
        currentUses: 5,
        isActive: true,
        validFrom: '2024-01-01T00:00:00Z',
        validUntil: '2024-12-31T23:59:59Z',
        createdBy: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdByUser: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      },
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCoupons,
    });

    const { result } = renderHook(() => useCoupons('', 'all'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockCoupons);
    expect(fetch).toHaveBeenCalledWith('/api/pos/coupons?');
  });

  it('handles fetch error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useCoupons('', 'all'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
  });
});

describe('useCreateCoupon', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates coupon successfully', async () => {
    const mockCoupon = {
      id: 1,
      code: 'NEW10',
      name: 'New Coupon',
      description: 'New discount',
      type: 'PERCENTAGE' as const,
      value: 10,
      minimumAmount: 1000,
      maxUses: 50,
      currentUses: 0,
      isActive: true,
      validFrom: '2024-01-01T00:00:00Z',
      validUntil: '2024-12-31T23:59:59Z',
      createdBy: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdByUser: {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCoupon,
    });

    const { result } = renderHook(() => useCreateCoupon(), {
      wrapper: createWrapper(),
    });

    const couponData = {
      code: 'NEW10',
      name: 'New Coupon',
      description: 'New discount',
      type: 'PERCENTAGE' as const,
      value: 10,
      minimumAmount: 1000,
      maxUses: 50,
      validFrom: '2024-01-01T00:00:00Z',
      validUntil: '2024-12-31T23:59:59Z',
    };

    result.current.mutate(couponData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(fetch).toHaveBeenCalledWith('/api/pos/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(couponData),
    });
  });
});

describe('useValidateCoupon', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates coupon successfully', async () => {
    const mockValidation = {
      coupon: {
        id: 1,
        code: 'SAVE10',
        name: '10% Off',
        type: 'PERCENTAGE' as const,
        value: 10,
        minimumAmount: 5000,
      },
      discountAmount: 1000,
      finalAmount: 9000,
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockValidation,
    });

    const { result } = renderHook(() => useValidateCoupon(), {
      wrapper: createWrapper(),
    });

    const validationData = {
      code: 'SAVE10',
      totalAmount: 10000,
    };

    result.current.mutate(validationData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(fetch).toHaveBeenCalledWith('/api/pos/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validationData),
    });
  });

  it('handles validation error', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid coupon code' }),
    });

    const { result } = renderHook(() => useValidateCoupon(), {
      wrapper: createWrapper(),
    });

    const validationData = {
      code: 'INVALID',
      totalAmount: 10000,
    };

    result.current.mutate(validationData);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
