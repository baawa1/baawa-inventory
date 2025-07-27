import { useQuery } from '@tanstack/react-query';

interface Supplier {
  id: number;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  taxId?: string | null;
  paymentTerms?: string | null;
  creditLimit?: number | null;
  isActive: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UseSupplierDataResult {
  supplier: Supplier | null;
  loading: boolean;
  error: string | null;
}

export function useSupplierData(
  supplierId: number | null,
  isOpen: boolean
): UseSupplierDataResult {
  // Use TanStack Query hook with conditional fetching
  const {
    data: supplier,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ['suppliers', supplierId],
    queryFn: async () => {
      if (!supplierId) throw new Error('No supplier ID provided');

      const response = await fetch(`/api/suppliers/${supplierId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch supplier: ${response.statusText}`);
      }
      const result = await response.json();
      return result.data;
    },
    enabled: isOpen && !!supplierId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    supplier: supplier || null,
    loading,
    error: error ? (error as Error).message : null,
  };
}
