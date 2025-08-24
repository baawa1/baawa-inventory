import { auth } from '#root/auth';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/roles';
import { FinanceOverview } from '@/components/finance/FinanceOverview';
import { prefetchQuery } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-client';

export const metadata = {
  title: 'Finance Overview - BaaWA Inventory POS',
  description: 'Simple finance overview and transaction management',
};

// Prefetch finance data on page load
async function prefetchFinanceData() {
  try {
    await prefetchQuery({
      queryKey: queryKeys.finance.summary(),
      queryFn: async () => {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/finance/summary`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        if (!response.ok) {
          throw new Error('Failed to fetch financial summary');
        }
        return response.json();
      },
    });
  } catch (error) {
    console.error('Failed to prefetch finance data:', error);
  }
}

export default async function FinancePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.status !== 'APPROVED') {
    redirect('/pending-approval');
  }

  // Check if user has permission to access financial reports (Admin only)
  if (!hasPermission(session.user.role, 'FINANCIAL_REPORTS')) {
    redirect('/unauthorized');
  }

  // Prefetch finance data in the background
  prefetchFinanceData();

  return <FinanceOverview user={session.user} />;
}
