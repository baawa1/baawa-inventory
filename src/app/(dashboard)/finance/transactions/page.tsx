import { redirect } from 'next/navigation';
import { auth } from '#root/auth';
import { FinanceTransactionList } from '@/components/finance/FinanceTransactionList';
import { hasPermission } from '@/lib/auth/roles';

export const metadata = {
  title: 'Financial Transactions - BaaWA Inventory POS',
  description:
    'View and manage all financial transactions including expenses and income',
};

export default async function FinanceTransactionsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Check if user has permission to access financial reports (Admin only)
  if (!hasPermission(session.user.role, 'FINANCIAL_REPORTS')) {
    redirect('/unauthorized');
  }

  return <FinanceTransactionList user={session.user} />;
}
