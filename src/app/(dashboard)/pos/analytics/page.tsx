import { auth } from '#root/auth';
import { redirect } from 'next/navigation';
import { MainAnalytics } from '@/components/pos/MainAnalytics';

export const metadata = {
  title: 'Analytics - BaaWA Inventory POS',
  description: 'Quick insights for informed decision-making',
};

export default async function AnalyticsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.status !== 'APPROVED') {
    redirect('/pending-approval');
  }

  return <MainAnalytics user={session.user} />;
}
