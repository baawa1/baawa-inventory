import { auth } from '#root/auth';
import { redirect } from 'next/navigation';
import { FinanceOverview } from '@/components/finance/FinanceOverview';

export const metadata = {
  title: 'Finance Overview - BaaWA Inventory POS',
  description: 'Simple finance overview and transaction management',
};

export default async function FinancePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.status !== 'APPROVED') {
    redirect('/pending-approval');
  }

  return <FinanceOverview user={session.user} />;
}
