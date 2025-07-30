import { useQuery } from '@tanstack/react-query';

interface RecentTransaction {
  id: number;
  transactionNumber: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  customerName: string;
  customerEmail: string | null;
  createdAt: string;
  itemCount: number;
  totalItems: number;
  firstItem: string;
}

const fetchRecentTransactions = async (limit: number = 10): Promise<RecentTransaction[]> => {
  const response = await fetch(`/api/dashboard/recent-transactions?limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch recent transactions');
  }

  const result = await response.json();
  return result.data;
};

export function useRecentTransactions(limit: number = 10) {
  return useQuery({
    queryKey: ['recent-transactions', limit],
    queryFn: () => fetchRecentTransactions(limit),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
} 