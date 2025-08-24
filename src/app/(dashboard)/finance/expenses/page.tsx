import { auth } from '#root/auth';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/roles';
import { ExpenseList } from '@/components/finance/ExpenseList';

export const metadata: Metadata = {
  title: 'Expenses - BaaWA Inventory',
  description: 'View and manage all expense transactions',
};

export default async function ExpensePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Check if user has permission to create transactions (Admin and Manager)
  if (!hasPermission(session.user.role, 'FINANCE_TRANSACTIONS_CREATE')) {
    redirect('/unauthorized');
  }

  return <ExpenseList user={session.user} />;
}
