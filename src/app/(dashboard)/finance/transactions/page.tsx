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

  if (!hasPermission(session.user.role, 'FINANCE_TRANSACTIONS_READ')) {
    redirect('/unauthorized');
  }

  return <FinanceTransactionList user={session.user} />;
}
