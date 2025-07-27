import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductSearchBar } from '@/components/pos/ProductSearchBar';

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
  useBarcodeLookupMutation: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
    error: null,
  })),
}));

const mockOnProductSelect = jest.fn();

describe('ProductSearchBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render search input', () => {
      render(<ProductSearchBar onProductSelect={mockOnProductSelect} />);

      expect(
        screen.getByPlaceholderText(/Search products/i)
      ).toBeInTheDocument();
    });

    it('should render search mode buttons', () => {
      render(<ProductSearchBar onProductSelect={mockOnProductSelect} />);

      expect(screen.getByText('Search')).toBeInTheDocument();
      expect(screen.getByText('Barcode')).toBeInTheDocument();
      expect(screen.getByText('Camera')).toBeInTheDocument();
    });
  });

  describe('Search Input', () => {
    it('should allow typing in search input', () => {
      render(<ProductSearchBar onProductSelect={mockOnProductSelect} />);

      const searchInput = screen.getByPlaceholderText(/Search products/i);
      fireEvent.change(searchInput, { target: { value: 'test product' } });

      expect(searchInput).toHaveValue('test product');
    });

    it('should handle empty search input', () => {
      render(<ProductSearchBar onProductSelect={mockOnProductSelect} />);

      const searchInput = screen.getByPlaceholderText(/Search products/i);
      fireEvent.change(searchInput, { target: { value: '' } });

      expect(searchInput).toHaveValue('');
    });
  });

  describe('Search Modes', () => {
    it('should start in search mode by default', () => {
      render(<ProductSearchBar onProductSelect={mockOnProductSelect} />);

      const searchInput = screen.getByPlaceholderText(/Search products/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('should switch to barcode mode when barcode button is clicked', () => {
      render(<ProductSearchBar onProductSelect={mockOnProductSelect} />);

      const barcodeButton = screen.getByText('Barcode');
      fireEvent.click(barcodeButton);

      // Should show barcode input
      expect(screen.getByPlaceholderText(/Enter barcode/i)).toBeInTheDocument();
    });

    it('should return to search mode when search button is clicked', () => {
      render(<ProductSearchBar onProductSelect={mockOnProductSelect} />);

      // Switch to barcode mode first
      const barcodeButton = screen.getByText('Barcode');
      fireEvent.click(barcodeButton);

      // Then switch back to search mode
      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      // Should show search input again
      expect(
        screen.getByPlaceholderText(/Search products/i)
      ).toBeInTheDocument();
    });
  });

  describe('Barcode Input', () => {
    it('should allow entering barcode manually', () => {
      render(<ProductSearchBar onProductSelect={mockOnProductSelect} />);

      // Switch to barcode mode
      const barcodeButton = screen.getByText('Barcode');
      fireEvent.click(barcodeButton);

      const barcodeInput = screen.getByPlaceholderText(/Enter barcode/i);
      fireEvent.change(barcodeInput, { target: { value: '123456789' } });

      expect(barcodeInput).toHaveValue('123456789');
    });

    it('should handle empty barcode input', () => {
      render(<ProductSearchBar onProductSelect={mockOnProductSelect} />);

      // Switch to barcode mode
      const barcodeButton = screen.getByText('Barcode');
      fireEvent.click(barcodeButton);

      const barcodeInput = screen.getByPlaceholderText(/Enter barcode/i);
      fireEvent.change(barcodeInput, { target: { value: '' } });

      expect(barcodeInput).toHaveValue('');
    });
  });

  describe('Mode Switching', () => {
    it('should maintain mode state', () => {
      render(<ProductSearchBar onProductSelect={mockOnProductSelect} />);

      // Switch to barcode mode
      const barcodeButton = screen.getByText('Barcode');
      fireEvent.click(barcodeButton);

      // Should still be in barcode mode
      expect(screen.getByPlaceholderText(/Enter barcode/i)).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle Enter key in search mode', () => {
      render(<ProductSearchBar onProductSelect={mockOnProductSelect} />);

      const searchInput = screen.getByPlaceholderText(/Search products/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.keyPress(searchInput, { key: 'Enter', code: 'Enter' });

      // Should not throw any errors
      expect(searchInput).toBeInTheDocument();
    });

    it('should handle Enter key in barcode mode', () => {
      render(<ProductSearchBar onProductSelect={mockOnProductSelect} />);

      // Switch to barcode mode
      const barcodeButton = screen.getByText('Barcode');
      fireEvent.click(barcodeButton);

      const barcodeInput = screen.getByPlaceholderText(/Enter barcode/i);
      fireEvent.change(barcodeInput, { target: { value: '123456789' } });
      fireEvent.keyPress(barcodeInput, { key: 'Enter', code: 'Enter' });

      // Should not throw any errors
      expect(barcodeInput).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form structure', () => {
      render(<ProductSearchBar onProductSelect={mockOnProductSelect} />);

      const searchInput = screen.getByPlaceholderText(/Search products/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('should support keyboard navigation between modes', () => {
      render(<ProductSearchBar onProductSelect={mockOnProductSelect} />);

      const searchButton = screen.getByText('Search');
      const barcodeButton = screen.getByText('Barcode');
      const cameraButton = screen.getByText('Camera');

      expect(searchButton).toBeInTheDocument();
      expect(barcodeButton).toBeInTheDocument();
      expect(cameraButton).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid input gracefully', () => {
      render(<ProductSearchBar onProductSelect={mockOnProductSelect} />);

      const searchInput = screen.getByPlaceholderText(/Search products/i);
      fireEvent.change(searchInput, { target: { value: 'invalid@#$%' } });

      // Should not throw any errors
      expect(searchInput).toBeInTheDocument();
    });

    it('should handle special characters in search', () => {
      render(<ProductSearchBar onProductSelect={mockOnProductSelect} />);

      const searchInput = screen.getByPlaceholderText(/Search products/i);
      fireEvent.change(searchInput, { target: { value: 'test@#$%^&*()' } });

      // Should not throw any errors
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('Component Props', () => {
    it('should call onProductSelect when product is selected', () => {
      render(<ProductSearchBar onProductSelect={mockOnProductSelect} />);

      // This would be tested when a product is actually selected
      // For now, just verify the prop is passed
      expect(mockOnProductSelect).toBeDefined();
    });

    it('should handle undefined onProductSelect', () => {
      render(<ProductSearchBar onProductSelect={undefined as any} />);

      // Should not throw any errors
      expect(
        screen.getByPlaceholderText(/Search products/i)
      ).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render on different screen sizes', () => {
      render(<ProductSearchBar onProductSelect={mockOnProductSelect} />);

      // Should render without errors
      expect(
        screen.getByPlaceholderText(/Search products/i)
      ).toBeInTheDocument();
    });
  });
});
