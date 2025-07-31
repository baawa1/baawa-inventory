import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CouponInput } from '@/components/pos/CouponInput';

// Mock the useValidateCoupon hook
jest.mock('@/hooks/api/useCoupons', () => ({
  useValidateCoupon: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
}));

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

describe('CouponInput', () => {
  const defaultProps = {
    totalAmount: 10000,
    onCouponApplied: jest.fn(),
    onCouponRemoved: jest.fn(),
    appliedCoupon: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders coupon input field', () => {
    render(<CouponInput {...defaultProps} />, { wrapper: createWrapper() });

    expect(screen.getByLabelText('Apply Coupon')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Enter coupon code')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
  });

  it('disables apply button when no coupon code entered', () => {
    render(<CouponInput {...defaultProps} />, { wrapper: createWrapper() });

    const applyButton = screen.getByRole('button', { name: 'Apply' });
    expect(applyButton).toBeDisabled();
  });

  it('enables apply button when coupon code is entered', () => {
    render(<CouponInput {...defaultProps} />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText('Enter coupon code');
    const applyButton = screen.getByRole('button', { name: 'Apply' });

    fireEvent.change(input, { target: { value: 'SAVE10' } });

    expect(applyButton).toBeEnabled();
  });

  it('converts coupon code to uppercase', () => {
    render(<CouponInput {...defaultProps} />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText('Enter coupon code');
    fireEvent.change(input, { target: { value: 'save10' } });

    expect(input).toHaveValue('SAVE10');
  });

  it('applies coupon on Enter key press', async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue({
      coupon: { code: 'SAVE10', name: '10% Off' },
      discountAmount: 1000,
      finalAmount: 9000,
    });

    jest.doMock('@/hooks/api/useCoupons', () => ({
      useValidateCoupon: () => ({
        mutateAsync: mockMutateAsync,
        isPending: false,
      }),
    }));

    render(<CouponInput {...defaultProps} />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText('Enter coupon code');
    fireEvent.change(input, { target: { value: 'SAVE10' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        code: 'SAVE10',
        totalAmount: 10000,
      });
    });
  });

  it('displays applied coupon information', () => {
    const appliedCoupon = {
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

    render(<CouponInput {...defaultProps} appliedCoupon={appliedCoupon} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('SAVE10')).toBeInTheDocument();
    expect(screen.getByText('10% Off')).toBeInTheDocument();
    expect(screen.getByText('Discount: ₦1,000.00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '' })).toBeInTheDocument(); // Remove button
  });

  it('calls onCouponRemoved when remove button is clicked', () => {
    const appliedCoupon = {
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

    render(<CouponInput {...defaultProps} appliedCoupon={appliedCoupon} />, {
      wrapper: createWrapper(),
    });

    const removeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(removeButton);

    expect(defaultProps.onCouponRemoved).toHaveBeenCalled();
  });

  it('shows loading state when validating', () => {
    jest.doMock('@/hooks/api/useCoupons', () => ({
      useValidateCoupon: () => ({
        mutateAsync: jest.fn(),
        isPending: true,
      }),
    }));

    render(<CouponInput {...defaultProps} />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText('Enter coupon code');
    const applyButton = screen.getByRole('button', { name: 'Validating...' });

    fireEvent.change(input, { target: { value: 'SAVE10' } });

    expect(applyButton).toBeDisabled();
    expect(input).toBeDisabled();
  });
});
