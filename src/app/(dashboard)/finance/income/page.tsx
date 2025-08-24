import { auth } from '#root/auth';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/roles';
import { IncomeList } from '@/components/finance/IncomeList';

export const metadata: Metadata = {
  title: 'Income - BaaWA Inventory',
  description: 'View and manage all income transactions',
};

export default async function IncomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Check if user has permission to create transactions (Admin and Manager)
  if (!hasPermission(session.user.role, 'FINANCE_TRANSACTIONS_CREATE')) {
    redirect('/unauthorized');
  }

  return <IncomeList user={session.user} />;
}
