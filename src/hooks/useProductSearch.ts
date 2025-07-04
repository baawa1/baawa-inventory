import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { queryKeys } from "@/lib/query-client";

// API function for product search
const fetchProducts = async (filters: {
  search?: string;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}) => {
  const searchParams = new URLSearchParams({
    limit: filters.limit?.toString() || "100",
    sortBy: filters.sortBy || "name",
    sortOrder: filters.sortOrder || "asc",
  });

  if (filters.search) {
    searchParams.append("search", filters.search);
  }

  const response = await fetch(`/api/products?${searchParams}`);
  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }
  return response.json();
};

/**
 * Hook for debounced product search
 * @param searchTerm - The search term to debounce
 * @param delay - The debounce delay in milliseconds (default: 300ms)
 * @returns TanStack Query result with debounced search
 */
export function useProductSearch(searchTerm: string, delay: number = 300) {
  const debouncedSearchTerm = useDebounce(searchTerm, delay);

  return useQuery({
    queryKey: ["products", "search", debouncedSearchTerm],
    queryFn: () =>
      fetchProducts({
        search: debouncedSearchTerm,
        limit: 100,
        sortBy: "name",
        sortOrder: "asc",
      }),
    enabled:
      debouncedSearchTerm.length >= 2 || debouncedSearchTerm.length === 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
