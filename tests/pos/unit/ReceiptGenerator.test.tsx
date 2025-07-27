import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReceiptGenerator } from '@/components/pos/ReceiptGenerator';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

// Mock window.print
Object.defineProperty(window, 'print', {
  value: jest.fn(),
  writable: true,
});

// Mock window.open
Object.defineProperty(window, 'open', {
  value: jest.fn(),
  writable: true,
});

const mockSale = {
  id: 'SALE-001',
  items: [
    {
      id: 1,
      name: 'Test Product 1',
      sku: 'SKU001',
      price: 1000,
      quantity: 2,
      stock: 10,
      category: 'Electronics',
      brand: 'Test Brand',
    },
    {
      id: 2,
      name: 'Test Product 2',
      sku: 'SKU002',
      price: 500,
      quantity: 1,
      stock: 5,
      category: 'Clothing',
      brand: 'Another Brand',
    },
  ],
  subtotal: 2500,
  discount: 100,
  total: 2400,
  paymentMethod: 'cash',
  customerName: 'John Doe',
  customerPhone: '1234567890',
  customerEmail: 'john@example.com',
  staffName: 'Test Staff',
  timestamp: new Date('2024-01-01T10:00:00Z'),
};

describe('ReceiptGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('renders receipt generator with sale information', () => {
      render(<ReceiptGenerator sale={mockSale} onClose={jest.fn()} />);

      expect(screen.getByText('Receipt')).toBeInTheDocument();
      expect(screen.getByText('SALE-001')).toBeInTheDocument();
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('Test Product 2')).toBeInTheDocument();
      expect(screen.getByText('₦2,400')).toBeInTheDocument();
    });

    it('displays customer information', () => {
      render(<ReceiptGenerator sale={mockSale} onClose={jest.fn()} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('1234567890')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('displays sale details correctly', () => {
      render(<ReceiptGenerator sale={mockSale} onClose={jest.fn()} />);

      expect(screen.getByText('Subtotal:')).toBeInTheDocument();
      expect(screen.getByText('₦2,500')).toBeInTheDocument();
      expect(screen.getByText('Discount:')).toBeInTheDocument();
      expect(screen.getByText('-₦100')).toBeInTheDocument();
      expect(screen.getByText('Total:')).toBeInTheDocument();
      expect(screen.getByText('₦2,400')).toBeInTheDocument();
    });

    it('displays payment method', () => {
      render(<ReceiptGenerator sale={mockSale} onClose={jest.fn()} />);

      expect(screen.getByText('Payment Method:')).toBeInTheDocument();
      expect(screen.getByText('Cash')).toBeInTheDocument();
    });

    it('displays staff information', () => {
      render(<ReceiptGenerator sale={mockSale} onClose={jest.fn()} />);

      expect(screen.getByText('Staff:')).toBeInTheDocument();
      expect(screen.getByText('Test Staff')).toBeInTheDocument();
    });
  });

  describe('Print Functionality', () => {
    it('opens print dialog when print button is clicked', () => {
      render(<ReceiptGenerator sale={mockSale} onClose={jest.fn()} />);

      const printButton = screen.getByText('Print Receipt');
      fireEvent.click(printButton);

      expect(window.print).toHaveBeenCalled();
    });

    it('shows success message after printing', async () => {
      render(<ReceiptGenerator sale={mockSale} onClose={jest.fn()} />);

      const printButton = screen.getByText('Print Receipt');
      fireEvent.click(printButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Print dialog opened');
      });
    });

    it('handles print error gracefully', async () => {
      (window.print as jest.Mock).mockImplementation(() => {
        throw new Error('Print error');
      });

      render(<ReceiptGenerator sale={mockSale} onClose={jest.fn()} />);

      const printButton = screen.getByText('Print Receipt');
      fireEvent.click(printButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to print receipt');
      });
    });
  });

  describe('Download Functionality', () => {
    it('downloads receipt as PDF when download button is clicked', async () => {
      const mockBlob = new Blob(['receipt content'], {
        type: 'application/pdf',
      });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });

      render(<ReceiptGenerator sale={mockSale} onClose={jest.fn()} />);

      const downloadButton = screen.getByText('Download PDF');
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/pos/print-receipt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sale: mockSale,
            format: 'pdf',
          }),
        });
      });
    });

    it('shows success message after successful download', async () => {
      const mockBlob = new Blob(['receipt content'], {
        type: 'application/pdf',
      });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });

      render(<ReceiptGenerator sale={mockSale} onClose={jest.fn()} />);

      const downloadButton = screen.getByText('Download PDF');
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Receipt downloaded successfully'
        );
      });
    });

    it('handles download error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error('Download failed')
      );

      render(<ReceiptGenerator sale={mockSale} onClose={jest.fn()} />);

      const downloadButton = screen.getByText('Download PDF');
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to download receipt');
      });
    });

    it('handles server error response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      render(<ReceiptGenerator sale={mockSale} onClose={jest.fn()} />);

      const downloadButton = screen.getByText('Download PDF');
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to download receipt');
      });
    });
  });

  describe('Email Functionality', () => {
    it('sends receipt via email when email button is clicked', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      render(<ReceiptGenerator sale={mockSale} onClose={jest.fn()} />);

      const emailButton = screen.getByText('Email Receipt');
      fireEvent.click(emailButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/pos/email-receipt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sale: mockSale,
            customerEmail: 'john@example.com',
          }),
        });
      });
    });

    it('shows success message after successful email', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      render(<ReceiptGenerator sale={mockSale} onClose={jest.fn()} />);

      const emailButton = screen.getByText('Email Receipt');
      fireEvent.click(emailButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Receipt sent via email');
      });
    });

    it('handles email error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Email failed'));

      render(<ReceiptGenerator sale={mockSale} onClose={jest.fn()} />);

      const emailButton = screen.getByText('Email Receipt');
      fireEvent.click(emailButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to send email');
      });
    });

    it('handles email server error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Email server error' }),
      });

      render(<ReceiptGenerator sale={mockSale} onClose={jest.fn()} />);

      const emailButton = screen.getByText('Email Receipt');
      fireEvent.click(emailButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to send email');
      });
    });

    it('disables email button when no customer email', () => {
      const saleWithoutEmail = {
        ...mockSale,
        customerEmail: '',
      };

      render(<ReceiptGenerator sale={saleWithoutEmail} onClose={jest.fn()} />);

      const emailButton = screen.getByText('Email Receipt');
      expect(emailButton).toBeDisabled();
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when close button is clicked', () => {
      const mockOnClose = jest.fn();
      render(<ReceiptGenerator sale={mockSale} onClose={mockOnClose} />);

      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when done button is clicked', () => {
      const mockOnClose = jest.fn();
      render(<ReceiptGenerator sale={mockSale} onClose={mockOnClose} />);

      const doneButton = screen.getByText('Done');
      fireEvent.click(doneButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Receipt Content', () => {
    it('displays item details correctly', () => {
      render(<ReceiptGenerator sale={mockSale} onClose={jest.fn()} />);

      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('SKU001')).toBeInTheDocument();
      expect(screen.getByText('₦1,000')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('₦2,000')).toBeInTheDocument();

      expect(screen.getByText('Test Product 2')).toBeInTheDocument();
      expect(screen.getByText('SKU002')).toBeInTheDocument();
      expect(screen.getByText('₦500')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('₦500')).toBeInTheDocument();
    });

    it('displays timestamp correctly', () => {
      render(<ReceiptGenerator sale={mockSale} onClose={jest.fn()} />);

      expect(screen.getByText('Date:')).toBeInTheDocument();
      expect(screen.getByText('01/01/2024')).toBeInTheDocument();
      expect(screen.getByText('Time:')).toBeInTheDocument();
      expect(screen.getByText('10:00 AM')).toBeInTheDocument();
    });

    it('displays notes when available', () => {
      render(<ReceiptGenerator sale={mockSale} onClose={jest.fn()} />);

      expect(screen.getByText('Notes:')).toBeInTheDocument();
      expect(screen.getByText('Test sale')).toBeInTheDocument();
    });

    it('does not display notes section when no notes', () => {
      const saleWithoutNotes = {
        ...mockSale,
        notes: '',
      };

      render(<ReceiptGenerator sale={saleWithoutNotes} onClose={jest.fn()} />);

      expect(screen.queryByText('Notes:')).not.toBeInTheDocument();
    });
  });

  describe('Payment Method Display', () => {
    it('displays cash payment method correctly', () => {
      render(<ReceiptGenerator sale={mockSale} onClose={jest.fn()} />);

      expect(screen.getByText('Payment Method:')).toBeInTheDocument();
      expect(screen.getByText('Cash')).toBeInTheDocument();
    });

    it('displays card payment method correctly', () => {
      const cardSale = {
        ...mockSale,
        paymentMethod: 'CARD',
      };

      render(<ReceiptGenerator sale={cardSale} onClose={jest.fn()} />);

      expect(screen.getByText('Payment Method:')).toBeInTheDocument();
      expect(screen.getByText('Card')).toBeInTheDocument();
    });

    it('displays transfer payment method correctly', () => {
      const transferSale = {
        ...mockSale,
        paymentMethod: 'TRANSFER',
      };

      render(<ReceiptGenerator sale={transferSale} onClose={jest.fn()} />);

      expect(screen.getByText('Payment Method:')).toBeInTheDocument();
      expect(screen.getByText('Transfer')).toBeInTheDocument();
    });

    it('displays wallet payment method correctly', () => {
      const walletSale = {
        ...mockSale,
        paymentMethod: 'WALLET',
      };

      render(<ReceiptGenerator sale={walletSale} onClose={jest.fn()} />);

      expect(screen.getByText('Payment Method:')).toBeInTheDocument();
      expect(screen.getByText('Wallet')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<ReceiptGenerator sale={mockSale} onClose={jest.fn()} />);

      expect(screen.getByLabelText('Print receipt')).toBeInTheDocument();
      expect(
        screen.getByLabelText('Download receipt as PDF')
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Email receipt')).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(<ReceiptGenerator sale={mockSale} onClose={jest.fn()} />);

      const printButton = screen.getByText('Print Receipt');
      printButton.focus();
      fireEvent.keyDown(printButton, { key: 'Enter' });

      expect(window.print).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles sale with no items', () => {
      const emptySale = {
        ...mockSale,
        items: [],
        subtotal: 0,
        total: 0,
      };

      render(<ReceiptGenerator sale={emptySale} onClose={jest.fn()} />);

      expect(screen.getByText('No items')).toBeInTheDocument();
    });

    it('handles sale with missing customer info', () => {
      const saleWithoutCustomer = {
        ...mockSale,
        customerName: '',
        customerPhone: '',
        customerEmail: '',
      };

      render(
        <ReceiptGenerator sale={saleWithoutCustomer} onClose={jest.fn()} />
      );

      expect(screen.getByText('Customer:')).toBeInTheDocument();
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('handles sale with zero discount', () => {
      const saleWithoutDiscount = {
        ...mockSale,
        discount: 0,
      };

      render(
        <ReceiptGenerator sale={saleWithoutDiscount} onClose={jest.fn()} />
      );

      expect(screen.getByText('Discount:')).toBeInTheDocument();
      expect(screen.getByText('-₦0')).toBeInTheDocument();
    });

    it('handles sale with large numbers', () => {
      const largeSale = {
        ...mockSale,
        subtotal: 999999,
        total: 999999,
      };

      render(<ReceiptGenerator sale={largeSale} onClose={jest.fn()} />);

      expect(screen.getByText('₦999,999')).toBeInTheDocument();
    });
  });
});
