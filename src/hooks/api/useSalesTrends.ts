import { useQuery } from '@tanstack/react-query';

interface SalesTrendData {
  day: string;
  sales: number;
  transactions: number;
  date: string;
}

const fetchSalesTrends = async (): Promise<SalesTrendData[]> => {
  const response = await fetch('/api/dashboard/sales-trends');
  if (!response.ok) {
    throw new Error('Failed to fetch sales trends data');
  }

  const result = await response.json();
  return result.data;
};

export function useSalesTrends() {
  return useQuery({
    queryKey: ['sales-trends'],
    queryFn: fetchSalesTrends,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}
