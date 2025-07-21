import { useQuery, useMutation } from "@tanstack/react-query";

// Types
export interface POSProduct {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category?: {
    id: number;
    name: string;
  };
  brand?: {
    id: number;
    name: string;
  };
  description?: string;
  barcode?: string;
  status: string;
}

export interface ProductSearchParams {
  search?: string;
  status?: string;
  limit?: number;
}

export interface BarcodeLookupParams {
  barcode: string;
}

// API Functions
const searchProducts = async (
  params: ProductSearchParams
): Promise<{ products: POSProduct[] }> => {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set("search", params.search);
  if (params.status) searchParams.set("status", params.status);
  if (params.limit) searchParams.set("limit", params.limit.toString());

  const response = await fetch(`/api/pos/search-products?${searchParams}`);

  if (!response.ok) {
    throw new Error("Failed to search products");
  }

  return response.json();
};

const lookupBarcode = async (barcode: string): Promise<POSProduct> => {
  const response = await fetch(
    `/api/pos/barcode-lookup?barcode=${encodeURIComponent(barcode)}`
  );

  if (!response.ok) {
    throw new Error("Product not found");
  }

  return response.json();
};

// Query Hooks
export function useProductSearch(searchTerm: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["pos-product-search", searchTerm],
    queryFn: () =>
      searchProducts({
        search: searchTerm,
        status: "active",
        limit: 20,
      }),
    enabled: enabled && searchTerm.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

export function useBarcodeLookup(barcode: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["pos-barcode-lookup", barcode],
    queryFn: () => lookupBarcode(barcode),
    enabled: enabled && barcode.trim().length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}

// Mutation Hooks
export function useBarcodeLookupMutation() {
  return useMutation({
    mutationFn: lookupBarcode,
    retry: 1,
  });
}
