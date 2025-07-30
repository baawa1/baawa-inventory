import { auth } from '#root/auth';
import { redirect } from 'next/navigation';
import { DailyOrdersDetails } from '@/components/pos/DailyOrdersDetails';
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';

export const metadata = {
  title: 'Daily Orders - BaaWA Inventory POS',
  description: 'View detailed orders for a specific date',
};

export default async function DailyOrdersPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.status !== 'APPROVED') {
    redirect('/pending-approval');
  }

  return (
    <DashboardPageLayout
      title={`Daily Orders - ${new Date(date).toLocaleDateString()}`}
      description={`View all orders for ${new Date(date).toLocaleDateString()}`}
    >
      <DailyOrdersDetails user={session.user} date={date} />
    </DashboardPageLayout>
  );
}
