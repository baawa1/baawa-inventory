import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { useProductSubmit } from '@/components/inventory/add-product/useProductSubmit';
import { useEditProductSubmit } from '@/components/inventory/edit-product/useEditProductSubmit';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('Product Submission Hooks', () => {
  beforeEach(() => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockClear();
    jest.clearAllMocks();
  });

  describe('useProductSubmit', () => {
    it('should submit product data successfully', async () => {
      const mockForm = {
        handleSubmit: jest.fn(callback => callback),
        getValues: jest.fn(() => ({
          name: 'Test Product',
          sku: 'TEST-001',
          purchasePrice: 10.5,
          sellingPrice: 15.99,
          minimumStock: 5,
          currentStock: 10,
          status: 'ACTIVE',
        })),
      };

      const mockSetIsSubmitting = jest.fn();
      const mockSetSubmitError = jest.fn();

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        {
          ok: true,
          json: async () => ({ data: { id: 1, name: 'Test Product' } }),
        } as Response
      );

      const { onSubmit } = useProductSubmit(
        mockForm as any,
        mockSetIsSubmitting,
        mockSetSubmitError
      );

      await onSubmit({
        name: 'Test Product',
        sku: 'TEST-001',
        purchasePrice: 10.5,
        sellingPrice: 15.99,
        minimumStock: 5,
        currentStock: 10,
        status: 'ACTIVE',
      });

      expect(mockSetIsSubmitting).toHaveBeenCalledWith(true);
      expect(mockSetSubmitError).toHaveBeenCalledWith(null);
      expect(global.fetch).toHaveBeenCalledWith('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Product',
          sku: 'TEST-001',
          purchasePrice: 10.5,
          sellingPrice: 15.99,
          minimumStock: 5,
          currentStock: 10,
          status: 'ACTIVE',
          description: null,
          barcode: null,
          notes: null,
          maximumStock: null,
        }),
      });
      expect(mockSetIsSubmitting).toHaveBeenCalledWith(false);
    });

    it('should handle API errors', async () => {
      const mockForm = {
        handleSubmit: jest.fn(callback => callback),
      };

      const mockSetIsSubmitting = jest.fn();
      const mockSetSubmitError = jest.fn();

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        {
          ok: false,
          json: async () => ({
            message: 'Product with this SKU already exists',
          }),
        } as Response
      );

      const { onSubmit } = useProductSubmit(
        mockForm as any,
        mockSetIsSubmitting,
        mockSetSubmitError
      );

      await onSubmit({
        name: 'Test Product',
        sku: 'TEST-001',
        purchasePrice: 10.5,
        sellingPrice: 15.99,
        minimumStock: 5,
        currentStock: 10,
        status: 'ACTIVE',
      });

      expect(mockSetSubmitError).toHaveBeenCalledWith(
        'Product with this SKU already exists'
      );
      expect(mockSetIsSubmitting).toHaveBeenCalledWith(false);
    });

    it('should handle network errors', async () => {
      const mockForm = {
        handleSubmit: jest.fn(callback => callback),
      };

      const mockSetIsSubmitting = jest.fn();
      const mockSetSubmitError = jest.fn();

      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { onSubmit } = useProductSubmit(
        mockForm as any,
        mockSetIsSubmitting,
        mockSetSubmitError
      );

      await onSubmit({
        name: 'Test Product',
        sku: 'TEST-001',
        purchasePrice: 10.5,
        sellingPrice: 15.99,
        minimumStock: 5,
        currentStock: 10,
        status: 'ACTIVE',
      });

      expect(mockSetSubmitError).toHaveBeenCalledWith('Network error');
      expect(mockSetIsSubmitting).toHaveBeenCalledWith(false);
    });

    it('should clean up optional fields', async () => {
      const mockForm = {
        handleSubmit: jest.fn(callback => callback),
      };

      const mockSetIsSubmitting = jest.fn();
      const mockSetSubmitError = jest.fn();

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        {
          ok: true,
          json: async () => ({ data: { id: 1 } }),
        } as Response
      );

      const { onSubmit } = useProductSubmit(
        mockForm as any,
        mockSetIsSubmitting,
        mockSetSubmitError
      );

      await onSubmit({
        name: 'Test Product',
        sku: 'TEST-001',
        description: '   ', // Whitespace
        barcode: '   ', // Whitespace
        notes: '   ', // Whitespace
        purchasePrice: 10.5,
        sellingPrice: 15.99,
        minimumStock: 5,
        currentStock: 10,
        status: 'ACTIVE',
        maximumStock: 0, // Should become null
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Product',
          sku: 'TEST-001',
          description: null,
          barcode: null,
          notes: null,
          purchasePrice: 10.5,
          sellingPrice: 15.99,
          minimumStock: 5,
          currentStock: 10,
          status: 'ACTIVE',
          maximumStock: null,
        }),
      });
    });
  });

  describe('useEditProductSubmit', () => {
    it('should submit product update successfully', async () => {
      const mockSetIsSubmitting = jest.fn();
      const mockSetSubmitError = jest.fn();
      const mockOnSuccess = jest.fn();

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        {
          ok: true,
          json: async () => ({ data: { id: 1, name: 'Updated Product' } }),
        } as Response
      );

      const { onSubmit } = useEditProductSubmit(
        1,
        mockSetIsSubmitting,
        mockSetSubmitError,
        mockOnSuccess
      );

      await onSubmit(
        {
          name: 'Updated Product',
          sku: 'TEST-001',
          purchasePrice: 12.5,
          sellingPrice: 19.99,
          minimumStock: 5,
          currentStock: 15,
          status: 'ACTIVE',
        },
        {} as any
      );

      expect(mockSetIsSubmitting).toHaveBeenCalledWith(true);
      expect(mockSetSubmitError).toHaveBeenCalledWith(null);
      const fetchCall = (global.fetch as jest.MockedFunction<typeof fetch>).mock
        .calls[0];
      expect(fetchCall[0]).toBe('/api/products/1');
      expect(fetchCall[1]).toMatchObject({
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const requestBody = JSON.parse(fetchCall[1]?.body as string);
      expect(requestBody).toMatchObject({
        name: 'Updated Product',
        sku: 'TEST-001',
        purchasePrice: 12.5,
        sellingPrice: 19.99,
        minimumStock: 5,
        currentStock: 15,
        status: 'ACTIVE',
      });
      expect(mockSetIsSubmitting).toHaveBeenCalledWith(false);
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it('should handle API errors during update', async () => {
      const mockSetIsSubmitting = jest.fn();
      const mockSetSubmitError = jest.fn();
      const mockOnSuccess = jest.fn();

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        {
          ok: false,
          json: async () => ({ message: 'Product not found' }),
        } as Response
      );

      const { onSubmit } = useEditProductSubmit(
        1,
        mockSetIsSubmitting,
        mockSetSubmitError,
        mockOnSuccess
      );

      await onSubmit(
        {
          name: 'Updated Product',
          sku: 'TEST-001',
          purchasePrice: 12.5,
          sellingPrice: 19.99,
          minimumStock: 5,
          currentStock: 15,
          status: 'ACTIVE',
        },
        {} as any
      );

      expect(mockSetSubmitError).toHaveBeenCalledWith('Product not found');
      expect(mockSetIsSubmitting).toHaveBeenCalledWith(false);
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('should handle network errors during update', async () => {
      const mockSetIsSubmitting = jest.fn();
      const mockSetSubmitError = jest.fn();
      const mockOnSuccess = jest.fn();

      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { onSubmit } = useEditProductSubmit(
        1,
        mockSetIsSubmitting,
        mockSetSubmitError,
        mockOnSuccess
      );

      await onSubmit(
        {
          name: 'Updated Product',
          sku: 'TEST-001',
          purchasePrice: 12.5,
          sellingPrice: 19.99,
          minimumStock: 5,
          currentStock: 15,
          status: 'ACTIVE',
        },
        {} as any
      );

      expect(mockSetSubmitError).toHaveBeenCalledWith('Network error');
      expect(mockSetIsSubmitting).toHaveBeenCalledWith(false);
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('should handle undefined values correctly', async () => {
      const mockSetIsSubmitting = jest.fn();
      const mockSetSubmitError = jest.fn();
      const mockOnSuccess = jest.fn();

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        {
          ok: true,
          json: async () => ({ data: { id: 1 } }),
        } as Response
      );

      const { onSubmit } = useEditProductSubmit(
        1,
        mockSetIsSubmitting,
        mockSetSubmitError,
        mockOnSuccess
      );

      await onSubmit(
        {
          name: 'Test Product',
          sku: 'TEST-001',
          description: undefined,
          barcode: undefined,
          categoryId: undefined,
          brandId: undefined,
          supplierId: undefined,
          purchasePrice: undefined,
          sellingPrice: undefined,
          currentStock: undefined,
          minimumStock: undefined,
          maximumStock: undefined,
          status: 'ACTIVE',
          notes: undefined,
        },
        {} as any
      );

      const fetchCall = (global.fetch as jest.MockedFunction<typeof fetch>).mock
        .calls[0];
      expect(fetchCall[0]).toBe('/api/products/1');
      expect(fetchCall[1]).toMatchObject({
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const requestBody = JSON.parse(fetchCall[1]?.body as string);
      expect(requestBody).toMatchObject({
        name: 'Test Product',
        sku: 'TEST-001',
        status: 'ACTIVE',
      });
    });
  });
});
