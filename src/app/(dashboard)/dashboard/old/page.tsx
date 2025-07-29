import { redirect } from 'next/navigation';
import { auth } from '../../../../../auth';
import { SimpleDashboard } from '@/components/dashboard/old/SimpleDashboard';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return <SimpleDashboard user={session.user} />;
}
