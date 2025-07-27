import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface UpdateIncomeData {
  amount: number;
  description: string;
  transactionDate: string;
  paymentMethod: string;
  incomeSource: string;
  payerName?: string;
  notes?: string;
}

export function useIncomeUpdate() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const updateIncomeMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateIncomeData;
    }) => {
      const response = await fetch(`/api/finance/transactions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update income');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Income updated successfully');
      queryClient.invalidateQueries({ queryKey: ['income'] });
      queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });
      router.push('/finance/income');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    updateIncome: updateIncomeMutation.mutateAsync,
    isUpdating: updateIncomeMutation.isPending,
  };
}
