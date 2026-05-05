import { redirect } from 'next/navigation';
import { auth } from '#root/auth';
import { FinanceTransactionList } from '@/components/finance/FinanceTransactionList';
import { hasPermission } from '@/lib/auth/roles';

export const metadata = {
  title: 'Finance Ledger - BaaWA Inventory POS',
  description:
    'View the master finance ledger across POS sales, debt collections, stock purchases, owner funding, and manual entries',
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
