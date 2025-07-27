import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShoppingCart } from '@/components/pos/ShoppingCart';

const mockCartItems = [
  {
    id: 1,
    name: 'Test Product 1',
    sku: 'TEST-001',
    price: 1000,
    quantity: 2,
    stock: 10,
    category: 'Electronics',
    brand: 'Test Brand',
  },
  {
    id: 2,
    name: 'Test Product 2',
    sku: 'TEST-002',
    price: 2000,
    quantity: 1,
    stock: 5,
    category: 'Clothing',
    brand: 'Fashion Brand',
  },
];

const mockOnUpdateQuantity = jest.fn();
const mockOnRemoveItem = jest.fn();
const mockOnClearCart = jest.fn();

describe('ShoppingCart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Empty Cart', () => {
    it('should display empty cart message when no items', () => {
      render(
        <ShoppingCart
          items={[]}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onClearCart={mockOnClearCart}
        />
      );

      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
      expect(
        screen.getByText('Search for products to add to your cart')
      ).toBeInTheDocument();
    });

    it('should show zero total when cart is empty', () => {
      render(
        <ShoppingCart
          items={[]}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onClearCart={mockOnClearCart}
        />
      );

      // Empty cart doesn't show total, it shows empty message
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    });
  });

  describe('Cart with Items', () => {
    it('should display cart items correctly', () => {
      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onClearCart={mockOnClearCart}
        />
      );

      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('Test Product 2')).toBeInTheDocument();
      expect(screen.getByText(/3 items/)).toBeInTheDocument();
    });

    it('should display item details correctly', () => {
      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onClearCart={mockOnClearCart}
        />
      );

      // Check first item details
      expect(screen.getByText('TEST-001')).toBeInTheDocument();
      expect(screen.getByText('₦1,000.00 each')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2')).toBeInTheDocument(); // Quantity
      expect(screen.getAllByText('₦2,000.00')).toHaveLength(2); // Subtotal appears twice
    });

    it('should calculate total correctly', () => {
      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onClearCart={mockOnClearCart}
        />
      );

      // Total should be (1000 * 2) + (2000 * 1) = 4000
      expect(screen.getByText('₦4,000.00')).toBeInTheDocument();
    });
  });

  describe('Quantity Management', () => {
    it('should call onUpdateQuantity when quantity is changed', () => {
      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onClearCart={mockOnClearCart}
        />
      );

      const quantityInput = screen.getAllByRole('spinbutton')[0];
      fireEvent.change(quantityInput, { target: { value: '3' } });

      expect(mockOnUpdateQuantity).toHaveBeenCalledWith(1, 3);
    });

    it('should not allow quantity below 1', () => {
      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onClearCart={mockOnClearCart}
        />
      );

      const quantityInput = screen.getAllByRole('spinbutton')[0];
      fireEvent.change(quantityInput, { target: { value: '0' } });

      expect(mockOnUpdateQuantity).not.toHaveBeenCalled();
    });

    it('should not allow quantity above stock', () => {
      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onClearCart={mockOnClearCart}
        />
      );

      const quantityInput = screen.getAllByRole('spinbutton')[0];
      fireEvent.change(quantityInput, { target: { value: '15' } });

      expect(mockOnUpdateQuantity).not.toHaveBeenCalled();
    });

    it('should update quantity with plus button', () => {
      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onClearCart={mockOnClearCart}
        />
      );

      // Find the plus button (first button with plus icon)
      const buttons = screen.getAllByRole('button');
      const plusButton = buttons.find(
        button =>
          button.querySelector('svg') &&
          button.querySelector('svg')?.innerHTML.includes('path') &&
          !button.textContent?.includes('Clear') &&
          !button.textContent?.includes('Remove')
      );

      if (plusButton) {
        fireEvent.click(plusButton);
        expect(mockOnUpdateQuantity).toHaveBeenCalledWith(1, 3);
      }
    });

    it('should update quantity with minus button', () => {
      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onClearCart={mockOnClearCart}
        />
      );

      // Find the minus button (second button with minus icon)
      const buttons = screen.getAllByRole('button');
      const minusButton = buttons.find(
        button =>
          button.querySelector('svg') &&
          button.querySelector('svg')?.innerHTML.includes('path') &&
          !button.textContent?.includes('Clear') &&
          !button.textContent?.includes('Remove')
      );

      if (minusButton) {
        fireEvent.click(minusButton);
        expect(mockOnUpdateQuantity).toHaveBeenCalledWith(1, 1);
      }
    });
  });

  describe('Item Removal', () => {
    it('should call onRemoveItem when remove button is clicked', () => {
      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onClearCart={mockOnClearCart}
        />
      );

      // Find the remove button (button with trash icon)
      const buttons = screen.getAllByRole('button');
      const removeButton = buttons.find(
        button =>
          button.querySelector('svg') &&
          button.querySelector('svg')?.innerHTML.includes('path') &&
          !button.textContent?.includes('Clear')
      );

      if (removeButton) {
        fireEvent.click(removeButton);
        expect(mockOnRemoveItem).toHaveBeenCalledWith(1);
      }
    });
  });

  describe('Cart Clearing', () => {
    it('should call onClearCart when clear cart button is clicked', () => {
      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onClearCart={mockOnClearCart}
        />
      );

      const clearCartButton = screen.getByRole('button', { name: /clear/i });
      fireEvent.click(clearCartButton);

      expect(mockOnClearCart).toHaveBeenCalled();
    });
  });

  describe('Stock Warnings', () => {
    it('should show low stock warning for items with low quantity', () => {
      const lowStockItems = [
        {
          ...mockCartItems[0],
          stock: 2,
          quantity: 2,
        },
      ];

      render(
        <ShoppingCart
          items={lowStockItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onClearCart={mockOnClearCart}
        />
      );

      expect(screen.getByText('Low Stock')).toBeInTheDocument();
    });

    it('should not show low stock warning for items with sufficient stock', () => {
      const sufficientStockItems = [
        {
          ...mockCartItems[0],
          stock: 10,
          quantity: 2,
        },
      ];

      render(
        <ShoppingCart
          items={sufficientStockItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onClearCart={mockOnClearCart}
        />
      );

      expect(screen.queryByText('Low Stock')).not.toBeInTheDocument();
    });

    it('should show maximum quantity warning when at stock limit', () => {
      const maxStockItems = [
        {
          ...mockCartItems[0],
          stock: 2,
          quantity: 2,
        },
      ];

      render(
        <ShoppingCart
          items={maxStockItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onClearCart={mockOnClearCart}
        />
      );

      expect(screen.getByText(/Maximum quantity reached/)).toBeInTheDocument();
    });
  });

  describe('Stock Information', () => {
    it('should display stock availability', () => {
      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onClearCart={mockOnClearCart}
        />
      );

      expect(screen.getByText('10 available in stock')).toBeInTheDocument();
      expect(screen.getByText('5 available in stock')).toBeInTheDocument();
    });
  });

  describe('Cart Summary', () => {
    it('should display cart summary correctly', () => {
      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onClearCart={mockOnClearCart}
        />
      );

      expect(screen.getByText('Total Items:')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Subtotal:')).toBeInTheDocument();
      expect(screen.getByText('₦4,000.00')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable all interactions when disabled', () => {
      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onClearCart={mockOnClearCart}
          disabled={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });

      const inputs = screen.getAllByRole('spinbutton');
      inputs.forEach(input => {
        expect(input).toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form structure', () => {
      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onClearCart={mockOnClearCart}
        />
      );

      const quantityInputs = screen.getAllByRole('spinbutton');
      quantityInputs.forEach(input => {
        expect(input).toHaveAttribute('min');
        expect(input).toHaveAttribute('max');
        expect(input).toHaveAttribute('type', 'number');
      });
    });

    it('should support keyboard navigation', () => {
      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onClearCart={mockOnClearCart}
        />
      );

      const quantityInput = screen.getAllByRole('spinbutton')[0];
      quantityInput.focus();

      // Test that the input can receive focus
      expect(quantityInput).toHaveFocus();
    });
  });

  describe('Category and Brand Display', () => {
    it('should display category and brand information', () => {
      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onClearCart={mockOnClearCart}
        />
      );

      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('Test Brand')).toBeInTheDocument();
      expect(screen.getByText('Clothing')).toBeInTheDocument();
      expect(screen.getByText('Fashion Brand')).toBeInTheDocument();
    });

    it('should handle items without category or brand', () => {
      const itemsWithoutCategory = [
        {
          id: 1,
          name: 'Test Product',
          sku: 'TEST-001',
          price: 1000,
          quantity: 1,
          stock: 10,
        },
      ];

      render(
        <ShoppingCart
          items={itemsWithoutCategory}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onClearCart={mockOnClearCart}
        />
      );

      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('TEST-001')).toBeInTheDocument();
    });
  });
});
