import { auth } from '../../../../../../auth';
import { redirect } from 'next/navigation';
import { CustomerHistoryList } from '@/components/pos/CustomerHistoryList';
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';

export const metadata = {
  title: 'Customer History - BaaWA Inventory POS',
  description: 'View and manage all customers and their purchase history',
};

export default async function CustomerHistoryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.status !== 'APPROVED') {
    redirect('/pending-approval');
  }

  return (
    <DashboardPageLayout
      title="Customer History"
      description="View and manage all customers and their purchase history"
    >
      <CustomerHistoryList user={session.user} />
    </DashboardPageLayout>
  );
}
