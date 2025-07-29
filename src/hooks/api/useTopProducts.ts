import { useQuery } from '@tanstack/react-query';

interface TopProductData {
  id: number;
  name: string;
  sku: string;
  sales: number;
  revenue: number;
  transactions: number;
  price: number;
  images: any | null;
}

const fetchTopProducts = async (): Promise<TopProductData[]> => {
  const response = await fetch('/api/dashboard/top-products');
  if (!response.ok) {
    throw new Error('Failed to fetch top products data');
  }

  const result = await response.json();
  return result.data;
};

export function useTopProducts() {
  return useQuery({
    queryKey: ['top-products'],
    queryFn: fetchTopProducts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}
