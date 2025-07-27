import { auth } from '#root/auth';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
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

  // Check if user has finance access
  const userRole = session.user.role;
  if (!['ADMIN', 'MANAGER'].includes(userRole)) {
    redirect('/unauthorized');
  }

  return <IncomeList user={session.user} />;
}
