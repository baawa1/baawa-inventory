import { useQuery } from '@tanstack/react-query';

interface IncomeData {
  id: number;
  transactionNumber: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string | null;
  transactionDate: Date;
  paymentMethod: string | null;
  notes: string | null;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'APPROVED' | 'REJECTED';
  incomeDetails?: {
    id: number;
    incomeSource: string;
    payerName: string | null;
  };
}

export function useIncomeData(incomeId: string) {
  return useQuery({
    queryKey: ['income', incomeId],
    queryFn: async (): Promise<IncomeData> => {
      const response = await fetch(`/api/finance/transactions/${incomeId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch income data');
      }
      const data = await response.json();
      // API returns { success: true, data: transaction, message?: string }
      const amount = Number(data.data.amount);
      return {
        ...data.data,
        amount: Number.isFinite(amount) ? amount : 0,
      };
    },
    enabled: !!incomeId,
  });
}
